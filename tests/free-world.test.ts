import { describe, expect, it } from 'vitest';
import { fromSave, stateHash, toSave, today } from '../engine/engine';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';

// The free world (World Bible ch. 13d, Numbers §11b; owner approved Oct 15).
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
const goTo = (s: ReturnType<typeof startGmGame>, day: number, place?: string) => { while (today(s) < day) gmApply(s, scene({ place, days: Math.min(30, day - today(s)) })); };

describe('fuses: the world moves on by itself', () => {
  it('Gōda\'s coup fires on its day with its canon outcome, and the news reaches Li 3 days later in Kurogane', () => {
    const s = startGmGame();
    goTo(s, 414);
    expect(s.flags.fuse_coup).toBe(1); // "crushed", the highest base weight
    expect(s.journal.some((j) => /Gōda Ensai/.test(j.text))).toBe(false);
    goTo(s, 417);
    expect(s.journal.some((j) => /News: In Seikyō, Gōda Ensai/.test(j.text))).toBe(true);
    expect(gmMemoryText(s)).toContain('WORLD NEWS LI HAS HEARD');
  });

  it('in another kingdom the news takes 10 days', () => {
    const s = startGmGame();
    goTo(s, 414, 'Hinokuchi, Tatara');
    goTo(s, 417, 'Hinokuchi, Tatara');
    expect(s.flags.news_coup ?? 0).toBe(0);
    goTo(s, 424, 'Hinokuchi, Tatara');
    expect(s.flags.news_coup).toBe(1);
  });

  it('Li pushes a fuse only where it plays out, and on either side', () => {
    const s = startGmGame();
    const far = gmApply(s, scene({ changes: [{ kind: 'lever', fuse: 'coup', toward: 'king_killed', reason: 'opens a door' }] }));
    expect(far.notes.join(' ')).toMatch(/not where Gōda's coup plays out/);
    goTo(s, 400, 'the palace in Seikyō');
    gmApply(s, scene({ place: 'the palace in Seikyō', changes: [{ kind: 'lever', fuse: 'coup', toward: 'king_killed', reason: 'opens a door for the killers' }] }));
    gmApply(s, scene({ place: 'the palace in Seikyō', changes: [{ kind: 'lever', fuse: 'coup', toward: 'king_killed', reason: 'tells them the guard rota' }] }));
    goTo(s, 414, 'the palace in Seikyō');
    expect(s.flags.fuse_coup).toBe(3); // king killed: 1 + 2 + 2 beats 3
    expect(s.journal.some((j) => /king Asagiri Tokinari is dead/.test(j.text))).toBe(true); // Li was there: at once
  });

  it('the history replays the same from the save', () => {
    const s = startGmGame();
    goTo(s, 420);
    const back = fromSave(toSave(s));
    expect(stateHash(back)).toBe(stateHash(s));
  });
});

describe('story seeds', () => {
  it('a seed is planted only where and when it fits, then grows or dies, never twice', () => {
    const s = startGmGame();
    expect(gmMemoryText(s)).toContain("[bridge] Raizen's bridge");
    const bad = gmApply(s, scene({ changes: [{ kind: 'seed', id: 'false_name', state: 'planted' }] }));
    expect(bad.notes.join(' ')).toMatch(/cannot be planted now/);
    gmApply(s, scene({ changes: [{ kind: 'seed', id: 'bridge', state: 'planted', note: 'Raizen drinks alone' }] }));
    expect(s.flags.seed_bridge).toBe(1);
    const again = gmApply(s, scene({ changes: [{ kind: 'seed', id: 'bridge', state: 'planted' }] }));
    expect(again.notes.join(' ')).toMatch(/cannot be planted now/);
    gmApply(s, scene({ changes: [{ kind: 'seed', id: 'bridge', state: 'grown' }] }));
    expect(s.flags.seed_bridge).toBe(2);
  });
});
