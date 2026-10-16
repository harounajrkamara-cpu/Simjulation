import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, has } from '../engine/engine';
import { defeatDrafts, ladderStep, openLies, seesThrough, victoryDrafts } from '../engine/fate';
import type { GameState } from '../engine/types';
import { handleInput } from '../engine/game';

// Block E of Phase 6 (audit gaps 9, 23): lies by a fixed rule, and the defeat ladder.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });

describe('lies (GE ch. 5: the listener\'s eye against Li\'s POL)', () => {
  it('Raizen sees through a slave boy\'s lie; Hachi believes him', () => {
    const s = startGmGame();
    expect(seesThrough(s, 'raizen')).toBe(true);
    expect(seesThrough(s, 'hachi')).toBe(false);
    expect(gmMemoryText(s)).toMatch(/IF LI LIES NOW.*Mikumo Raizen.*see through/);
  });

  it('a caught lie costs trust; a believed one stays hidden until found out', () => {
    const s = startGmGame();
    const t0 = s.relations.raizen.base.trust;
    const r = gmApply(s, scene({ changes: [{ kind: 'lie', npc: 'raizen', about: 'the footwork', believed: true } as never] }));
    expect(s.relations.raizen.mods.some((m) => m.value < 0 && /caught lying/.test(m.reason))).toBe(true);
    expect(r.secretNotes?.join(' ')).toMatch(/saw through/);
    expect(s.relations.raizen.base.trust).toBe(t0);
    gmApply(s, scene({ changes: [{ kind: 'lie', npc: 'hachi', about: 'where I was' } as never] }));
    expect(openLies(s)).toHaveLength(1);
    gmApply(s, scene({ changes: [{ kind: 'lie', npc: 'hachi', discovered: true } as never] }));
    expect(openLies(s)).toHaveLength(0);
    expect(s.relations.hachi.mods.some((m) => m.fadeDays === null && m.value < 0)).toBe(true);
  });
});

describe('the defeat ladder (WB 12b #10)', () => {
  function officer(): GameState {
    const s = startGmGame();
    s.characters[s.liId].status = 'free';
    s.flags.levy_service = 1;
    s.flags.rank_level = 3;
    return s;
  }
  it('each defeat within a year climbs a step, with its cost; a win steps down', () => {
    const s = officer();
    for (let k = 0; k < 3; k++) commitDrafts(s, defeatDrafts(s, 'test'));
    expect(ladderStep(s)).toBe(3);
    expect(has(s, 'chance_lost_until')).toBeGreaterThan(0);
    expect(gmApply(s, scene({ changes: [{ kind: 'promotion', reason: 'a post is free' } as never] })).notes.join(' ')).toMatch(/lost his chance/);
    commitDrafts(s, defeatDrafts(s, 'test'));
    commitDrafts(s, defeatDrafts(s, 'test'));
    commitDrafts(s, defeatDrafts(s, 'test'));
    expect(has(s, 'rank_level')).toBe(2); // step 6: rank loss
    commitDrafts(s, victoryDrafts(s));
    expect(ladderStep(s)).toBe(5);
  });

  it('capture: no promotion; it ends by ransom, by release, or by a won fight', () => {
    const s = officer();
    s.flags.defeat_step = 6;
    s.flags.defeat_day = 0;
    commitDrafts(s, defeatDrafts(s, 'the rearguard was overrun'));
    expect(has(s, 'captive')).toBe(1);
    expect(gmMemoryText(s)).toMatch(/LI IS A CAPTIVE/);
    expect(gmApply(s, scene({ changes: [{ kind: 'captivity', end: 'escape' } as never] })).notes.join(' ')).toMatch(/a fight the code runs/);
    s.money = 10_000;
    gmApply(s, scene({ changes: [{ kind: 'captivity', end: 'ransom' } as never] }));
    expect(has(s, 'captive')).toBe(0);
    expect(s.money).toBe(10_000 - 8_000);
  });

  it('a lost real fight climbs the ladder by itself', () => {
    const s = startGmGame();
    gmApply(s, scene({ fight: { foe: 'a Suiren raider', rank: 'B', look: 'a big raider with an axe', deadly: true } }));

    handleInput(s, '6'); // run
    expect(ladderStep(s)).toBe(1);
  });
});
