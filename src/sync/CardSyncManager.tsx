import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { getFirebase } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import {
  normalizeCollection,
  useCardCollection,
  type CardCollection,
} from '../cards/CardCollectionContext';
import { mergeCardCollections } from './cardMerge';

const WRITE_DEBOUNCE_MS = 800;

/** Separate cloud doc from the manga store: users/{uid}/data/cardCollection. */
function collectionDocRef(db: Firestore, uid: string) {
  return doc(db, 'users', uid, 'data', 'cardCollection');
}

/**
 * Cloud sync for the card collection — same pattern as the manga SyncManager,
 * targeting a separate doc. No-ops for guests / unconfigured Firebase. When
 * signed in: merge-on-sign-in (gated on the local store being READY so an empty
 * store can't clobber the cloud), write-through, reconcile-on-start, newest-wins
 * by savedAt, no prune.
 */
export function CardSyncManager() {
  const { uid } = useAuth();
  const { collection, ready, replaceAll } = useCardCollection();

  const dataRef = useRef(collection);
  dataRef.current = collection;

  const [syncedUid, setSyncedUid] = useState<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    const fb = getFirebase();
    // Wait for the local collection to load before merging (anti-clobber).
    if (!fb || !uid || !ready) {
      setSyncedUid(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ref = collectionDocRef(fb.db, uid);
        const snap = await getDoc(ref);
        // Normalize the cloud doc so legacy entries (saved before multi-game
        // support) get game:'one-piece' before merging.
        const remote = normalizeCollection(
          snap.exists() ? snap.data()?.cardCollection : undefined,
        );
        const merged = mergeCardCollections(dataRef.current, remote);
        if (cancelled) return;
        replaceAll(merged);
        await setDoc(ref, { cardCollection: merged });
        if (cancelled) return;
        lastWrittenRef.current = JSON.stringify(merged);
        setSyncedUid(uid);
      } catch (err) {
        console.warn('[cardSync] merge/reconcile failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, ready, replaceAll]);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb || !uid || syncedUid !== uid) return;
    const snapshot = JSON.stringify(collection);
    if (snapshot === lastWrittenRef.current) return; // nothing changed since reconcile
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      lastWrittenRef.current = snapshot;
      setDoc(collectionDocRef(fb.db, uid), { cardCollection: dataRef.current }).catch(
        (err: unknown) => console.warn('[cardSync] write-through failed:', err),
      );
    }, WRITE_DEBOUNCE_MS);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [collection, uid, syncedUid]);

  return null;
}
