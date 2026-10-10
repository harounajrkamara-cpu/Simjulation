import { describe, expect, it } from 'vitest';
import { fromSave, stateHash, toSave } from '../engine/engine';
import { gmApply, parseGmTurn, startGmGame } from '../engine/gm';
import { chunkEvents, loadFromCloud, saveToCloud, useCloudDb } from '../web/cloud-save';

// Saves in the player's account (VISIE §6): chunked under the document limit, only changed chunks written, head last.

function fakeDb() {
  const docs = new Map<string, Record<string, unknown>>();
  const writes: string[] = [];
  return {
    docs, writes,
    db: {
      doc: (path: string) => ({
        get: async () => ({ exists: docs.has(path), data: () => docs.get(path) }),
        set: async (d: Record<string, unknown>) => { writes.push(path); docs.set(path, JSON.parse(JSON.stringify(d))); },
        delete: async () => { docs.delete(path); },
      }),
    },
  };
}

function bigLife(scenes: number) {
  const s = startGmGame();
  for (let k = 0; k < scenes; k++) gmApply(s, parseGmTurn({ scene: `Li works hard, day ${k}. ${'The camp is busy. '.repeat(20)}`, summary: `Scene ${k}.`, days: 1 })!);
  return s;
}

describe('account saves', () => {
  it('chunks stay under the size limit and keep every event in order', () => {
    const events = Array.from({ length: 500 }, (_, k) => ({ k, text: 'x'.repeat(1000) }));
    const chunks = chunkEvents(events, 50_000);
    expect(chunks.length).toBeGreaterThan(5);
    expect(chunks.every((c) => c.length <= 50_000)).toBe(true);
    expect(chunks.flatMap((c) => JSON.parse(c))).toEqual(events);
  });

  it('a life is saved and loaded back exactly; a later save writes only what changed', async () => {
    const f = fakeDb();
    useCloudDb(f.db);
    const s = bigLife(300);
    expect(await saveToCloud(1, toSave(s), 'Year 100')).toBe(true);
    const first = f.writes.length;
    expect(first).toBeGreaterThan(2); // several chunks + the head
    expect(f.writes.at(-1)).toBe('saves/life1'); // the head is written last
    gmApply(s, parseGmTurn({ scene: 'One more day.', summary: 'More.', days: 1 })!);
    await saveToCloud(1, toSave(s), 'Year 100');
    expect(f.writes.length - first).toBe(2); // the last chunk and the head
    useCloudDb(f.db); // a fresh page: nothing cached
    const back = await loadFromCloud(1);
    expect(back?.describe).toBe('Year 100');
    expect(stateHash(fromSave(back!.save))).toBe(stateHash(s));
  });

  it('a missing or broken save reads as none', async () => {
    const f = fakeDb();
    useCloudDb(f.db);
    expect(await loadFromCloud(2)).toBeUndefined();
    await saveToCloud(2, toSave(bigLife(5)), 'x');
    f.docs.delete('saves/life2/chunks/c0');
    useCloudDb(f.db);
    expect(await loadFromCloud(2)).toBeUndefined();
  });

  it('without a store nothing is saved and nothing breaks', async () => {
    useCloudDb(null);
    expect(await saveToCloud(1, toSave(startGmGame()), 'x')).toBe(false);
    expect(await loadFromCloud(1)).toBeUndefined();
  });
});
