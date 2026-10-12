import { describe, expect, it } from 'vitest';
import { commitDrafts, today } from '../engine/engine';
import { gmApply, gmDayCap, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { lifeStage } from '../engine/stages';
import { GameState } from '../engine/types';

// Life stages (World Bible ch. 9, 12; owner vision): where Li stands sets the longest skip and what Claude is told.

const set = (s: GameState, drafts: { key: string; value: number }[]) => commitDrafts(s, drafts.map((d) => ({ type: 'flag' as const, fact: d.key, visible: false, data: d })));
const free = (s: GameState) => commitDrafts(s, [{ type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'a free soldier' } }]);

describe('life stages', () => {
  it('slave → soldier → officer → general, by status and rank', () => {
    const s = startGmGame();
    expect(lifeStage(s)).toBe('slave');
    free(s);
    expect(lifeStage(s)).toBe('soldier');
    set(s, [{ key: 'rank_level', value: 3 }]);
    expect(lifeStage(s)).toBe('officer');
    set(s, [{ key: 'rank_level', value: 6 }]);
    expect(lifeStage(s)).toBe('general');
  });

  it('the longest skip grows with the stage: a month, a season, a year', () => {
    const s = startGmGame();
    expect(gmDayCap(s)).toBe(30);
    free(s);
    expect(gmDayCap(s)).toBe(90);
    set(s, [{ key: 'rank_level', value: 4 }]);
    expect(gmDayCap(s)).toBe(360);
    const before = today(s);
    gmApply(s, parseGmTurn({ scene: 'A quiet year in the garrison.', summary: 'A year.', days: 500 })!);
    expect(today(s) - before).toBe(360);
  });

  it('Claude is told the stage, what it is about and land when there is some', () => {
    const s = startGmGame();
    expect(gmMemoryText(s)).toMatch(/LIFE STAGE: slave/);
    free(s);
    set(s, [{ key: 'rank_level', value: 5 }, { key: 'land_koku', value: 300 }]);
    const mem = gmMemoryText(s);
    expect(mem).toMatch(/LIFE STAGE: officer/);
    expect(mem).toMatch(/about 300 koku/);
  });
});
