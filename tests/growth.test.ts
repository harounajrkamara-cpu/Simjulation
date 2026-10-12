import { describe, expect, it } from 'vitest';
import { commitDrafts } from '../engine/engine';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { lifeStat } from '../engine/growth';
import { GameState } from '../engine/types';

// Everyone grows (owner vision Oct 10).

const meet = (s: GameState, ids: string[]) => commitDrafts(s, ids.map((id) => ({ type: 'flag' as const, fact: `met ${id}`, visible: false, data: { key: `met_${id}`, value: 1 } })));
const pass = (s: GameState, days: number) => gmApply(s, parseGmTurn({ scene: 'Time passes.', summary: 'Time.', days })!);

describe('everyone grows', () => {
  it('a life trains a stat: fighters VAL, leaders LEA, scholars and cooks INT, nobles POL', () => {
    expect(lifeStat('archer of the band')).toBe('VAL');
    expect(lifeStat('commander of Kōri fort (Sanbyakunin-shō)')).toBe('LEA');
    expect(lifeStat('slave cook and medic')).toBe('INT');
    expect(lifeStat("the border lord's daughter")).toBe('POL');
  });

  it('each season the people Li has met grow by their life; strangers do not', () => {
    const s = startGmGame();
    meet(s, ['hisame', 'hachi']);
    const before = { hisame: s.characters.hisame.stats.VAL, hachi: s.characters.hachi.stats.VAL, ishizue: s.characters.ishizue.stats.LEA };
    for (let k = 0; k < 4; k++) pass(s, 30); // across the season line at day 90
    expect(s.characters.hisame.stats.VAL).toBeGreaterThan(before.hisame);
    expect(s.characters.hachi.stats.VAL).toBeGreaterThan(before.hachi);
    expect(s.characters.ishizue.stats.LEA).toBe(before.ishizue);
  });

  it('old warriors slow down', () => {
    const s = startGmGame();
    meet(s, ['sukezo']); // born Year 37: 63
    const val = s.characters.sukezo.stats.VAL;
    for (let k = 0; k < 4; k++) pass(s, 30);
    expect(s.characters.sukezo.stats.VAL).toBeLessThan(val);
  });

  it('Claude may grow a person once per scene with a reason, and give a new role', () => {
    const s = startGmGame();
    meet(s, ['hachi']);
    const val = s.characters.hachi.stats.VAL;
    const r = gmApply(s, parseGmTurn({ scene: 'Hachi survives the raid.', summary: 'Raid.', changes: [
      { kind: 'grow', npc: 'hachi', stat: 'VAL', reason: 'survived his first raid' },
      { kind: 'grow', npc: 'hachi', stat: 'VAL', reason: 'again' },
      { kind: 'grow', npc: 'hisame', stat: 'VAL' },
      { kind: 'role', npc: 'hachi', role: 'bearer of the Hagiwara levy' },
    ] })!);
    expect(s.characters.hachi.stats.VAL).toBeGreaterThan(val);
    expect(r.notes.join(' ')).toMatch(/grows once per scene/);
    expect(r.notes.join(' ')).toMatch(/needs a reason/);
    expect(s.characters.hachi.role).toBe('bearer of the Hagiwara levy');
    expect(gmMemoryText(s)).toMatch(/Hachi \[id: hachi\] — bearer of the Hagiwara levy, age \d+, true strength [FEDCBAS]/);
  });
});
