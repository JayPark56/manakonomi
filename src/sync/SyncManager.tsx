import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { getFirebase } from '../auth/firebase';
import { useAuth } from '../auth/AuthContext';
import { useUserData, type UserData } from '../user/UserDataContext';
import { mergeUserData } from './merge';

const WRITE_DEBOUNCE_MS = 800;

/** Single cloud document holding the whole store: users/{uid}/data/userData. */
function userDocRef(db: Firestore, uid: string) {
  return doc(db, 'users', uid, 'data', 'userData');
}

/**
 * Cloud sync side-effects (renders nothing). No-ops entirely for guests or when
 * Firebase is unconfigured. When signed in:
 *  - merge-on-sign-in / reconcile-on-start: pull the cloud doc, merge with the
 *    local store (union favorites, newest-wins ratings by ratedAt), write both;
 *  - write-through: push debounced local changes to the cloud.
 */
export function SyncManager() {
  const { uid } = useAuth();
  const { data, ready, replaceAll } = useUserData();

  // Latest local data without making the merge effect depend on every change.
  const dataRef = useRef(data);
  dataRef.current = data;

  const [syncedUid, setSyncedUid] = useState<string | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot of what is already in the cloud, so the write-through effect does
  // not immediately re-push the just-merged data (or write unchanged data).
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    const fb = getFirebase();
    // Wait for the local store to finish loading before merging, otherwise a
    // fast cloud read could merge into an empty local store and lose data.
    if (!fb || !uid || !ready) {
      setSyncedUid(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ref = userDocRef(fb.db, uid);
        const snap = await getDoc(ref);
        const remote =
          (snap.exists() ? (snap.data()?.userData as UserData | undefined) : undefined) ?? {};
        const merged = mergeUserData(dataRef.current, remote);
        if (cancelled) return;
        replaceAll(merged);
        await setDoc(ref, { userData: merged });
        if (cancelled) return;
        lastWrittenRef.current = JSON.stringify(merged);
        setSyncedUid(uid);
      } catch (err) {
        // Offline / failure: local data is left untouched (source of truth),
        // and write-through stays gated until a successful reconcile.
        console.warn('[sync] merge/reconcile failed:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, ready, replaceAll]);

  useEffect(() => {
    const fb = getFirebase();
    if (!fb || !uid || syncedUid !== uid) return;
    const snapshot = JSON.stringify(data);
    if (snapshot === lastWrittenRef.current) return; // nothing changed since reconcile
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      lastWrittenRef.current = snapshot;
      setDoc(userDocRef(fb.db, uid), { userData: dataRef.current }).catch((err: unknown) =>
        console.warn('[sync] write-through failed:', err),
      );
    }, WRITE_DEBOUNCE_MS);
    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [data, uid, syncedUid]);

  return null;
}
