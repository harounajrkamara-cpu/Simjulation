import { SaveFile } from '../engine/engine';

// Saves in the player's claude.ai account (owner vision Oct 10, VISIE §6): the same life on laptop and phone, safe from
// a cleared browser, and readable by Claude from the chat to fix a bug. The page's `db` capability keeps it owner-only
// (rule on "saves"). A save is the append-only event log, split into chunks under the 256 KiB document limit:
//   saves/life<n>                 the head: version, hash, chunk count, a one-line description (written LAST: the commit)
//   saves/life<n>/chunks/c<k>     the events, in order
// Only chunks that changed are written (a life only grows, so usually just the last one). The browser copy stays the
// first save; the account copy follows a moment later. Anything that fails here leaves the browser save untouched.

interface DocRef { get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
interface Db { doc(path: string): DocRef }

/** Serialized bytes per chunk: well under the 256 KiB document limit. */
const CHUNK_BYTES = 180_000;

let db: Db | null | undefined;
/** What each life's chunks looked like when last written (so unchanged chunks are not written again). */
const written = new Map<number, string[]>();

/** Tests (and other hosts) can hand in their own store. */
export function useCloudDb(d: Db | null) { db = d; written.clear(); }

export async function cloudDb(): Promise<Db | null> {
  if (db !== undefined) return db;
  if (typeof window === 'undefined') return (db = null);
  const claude = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  try { db = claude?.use ? ((await claude.use('db')) as Db | null) : null; } catch { db = null; }
  return db;
}

/** Split the events into chunks by their serialized size. */
export function chunkEvents(events: unknown[], max = CHUNK_BYTES): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let size = 2;
  for (const e of events) {
    const j = JSON.stringify(e);
    if (cur.length && size + j.length + 1 > max) { out.push(`[${cur.join(',')}]`); cur = []; size = 2; }
    cur.push(j);
    size += j.length + 1;
  }
  out.push(`[${cur.join(',')}]`);
  return out;
}

/** Write a life to the account. Resolves true when it is stored. */
export async function saveToCloud(slot: number, save: SaveFile, describe: string): Promise<boolean> {
  const store = await cloudDb();
  if (!store) return false;
  try {
    const chunks = chunkEvents(save.events);
    const before = written.get(slot) ?? [];
    for (let k = 0; k < chunks.length; k++) {
      if (before[k] === chunks[k]) continue;
      await store.doc(`saves/life${slot}/chunks/c${k}`).set({ events: chunks[k] });
    }
    await store.doc(`saves/life${slot}`).set({
      game: save.game, saveVersion: save.saveVersion, dataVersion: save.dataVersion, worldNumber: save.worldNumber, hash: save.hash,
      chunks: chunks.length, events: save.events.length, describe,
    });
    // Chunks beyond the new end (after a bug-fix rewind) are no longer part of the save.
    for (let k = chunks.length; k < before.length; k++) await store.doc(`saves/life${slot}/chunks/c${k}`).delete().catch(() => undefined);
    written.set(slot, chunks);
    return true;
  } catch {
    written.delete(slot); // unsure what was stored: write everything next time
    return false;
  }
}

/** Read a life from the account (undefined when there is none or it cannot be read). */
export async function loadFromCloud(slot: number): Promise<{ save: SaveFile; describe: string } | undefined> {
  const store = await cloudDb();
  if (!store) return undefined;
  try {
    const head = await store.doc(`saves/life${slot}`).get();
    const h = head.exists ? head.data() : undefined;
    if (!h || typeof h.chunks !== 'number') return undefined;
    const chunks: string[] = [];
    for (let k = 0; k < h.chunks; k++) {
      const c = await store.doc(`saves/life${slot}/chunks/c${k}`).get();
      const text = c.exists ? c.data()?.events : undefined;
      if (typeof text !== 'string') return undefined;
      chunks.push(text);
    }
    const events = chunks.flatMap((c) => JSON.parse(c) as unknown[]);
    if (events.length !== h.events) return undefined;
    written.set(slot, chunks);
    return {
      save: { game: h.game, saveVersion: h.saveVersion, dataVersion: h.dataVersion, worldNumber: h.worldNumber, hash: h.hash, events } as SaveFile,
      describe: String(h.describe ?? ''),
    };
  } catch {
    return undefined;
  }
}
