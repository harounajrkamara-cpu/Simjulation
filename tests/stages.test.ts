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

describe('Tatara runaway start (world 2)', () => {
  it('starts in Tatara as a free hunted smith', () => {
    // We need a way to start world 2. Since createWorld is not exported,
    // we test via the GM layer: start a GM game with worldNumber=2.
    const s = startGmGame(2); // startGmGame accepts an optional worldNumber
    // Life stage is determined by status and rank_level:
    // - status is 'free' (not slave)
    // - rank_level defaults to 0 (Ashigaru) -> soldier stage
    expect(lifeStage(s)).toBe('soldier');
    expect(s.liId).toBe('li');
    const li = s.characters['li'];
    expect(li.role).toContain('Tatara');
    expect(li.status).toBe('free');
    expect(li.location).toBe('tatara');
    expect(s.money).toBe(0);
    expect(s.date).toEqual({ year: 101, month: 1, day: 1, part: 'morning' });
    expect(s.seasonKey).toBe('101-Spring');
    // Knowledge includes both base and Tatara-specific
    expect(s.knowledge).toContain('tatara_refuge');
    expect(s.knowledge).toContain('hunted_by_band');
    // Flags
    expect(s.flags.hunted).toBe(1);
    expect(s.flags.runaway).toBe(1);
    // Tatara characters are present
    expect(s.characters['kane']).toBeDefined();
    expect(s.characters['masaru']).toBeDefined();
    expect(s.characters['shinobu']).toBeDefined();
    // Relations: old band degraded, Tatara hosts present
    expect(s.relations['raizen'].base.trust).toBeLessThan(30); // trust degraded
    expect(s.relations['gonza'].base.fear).toBeGreaterThan(20); // fear increased
    expect(s.relations['kane'].base.trust).toBeGreaterThan(70); // trust with smith
    // Known list includes Tatara contacts
    expect(s.flags.met_kane).toBe(1);
    expect(s.flags.met_masaru).toBe(1);
    expect(s.flags.met_hachi).toBe(1); // from slave start
  });
});