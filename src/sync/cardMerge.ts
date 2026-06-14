import type { CardCollection } from '../cards/CardCollectionContext';

/**
 * Merge two card collections by card id. A card is simply in or out, so on a
 * conflict (same id on both sides) the entry with the newer savedAt wins — it
 * carries the fresher price snapshot. No pruning: cloud-only entries are kept,
 * mirroring the manga merge's safety rule.
 */
export function mergeCardCollections(a: CardCollection, b: CardCollection): CardCollection {
  const out: CardCollection = { ...a };
  for (const [id, entry] of Object.entries(b)) {
    const existing = out[id];
    if (!existing || entry.savedAt > existing.savedAt) out[id] = entry;
  }
  return out;
}
