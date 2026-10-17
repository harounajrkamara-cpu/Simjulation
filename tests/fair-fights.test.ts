import { describe, expect, it } from 'vitest';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { has, options } from '../engine/engine';
import { handleInput } from '../engine/game';
import { fightOdds } from '../engine/duel';

// Fair but realistic fights (owner, Oct 17): warn first, always a way out with a cost, variables only from the story.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Gonza comes at him.', summary: 'x', ...t });

describe('fair fights', () => {
  it('Li is warned in words before the first move, from his guess of the foe', () => {
    const s = startGmGame();
    gmApply(s, scene({ fight: { foe: 'Gonza', rank: 'C', look: 'a grown man with a club', deadly: false } }));
    expect(fightOdds(s.duel!)).toMatch(/far beyond Li/);
    expect(fightOdds(s.duel!)).not.toMatch(/\d/);
  });

  it('Give up is always there; backing down from a small fight costs face', () => {
    const s = startGmGame();
    s.flags.rep_soldiers = 10;
    gmApply(s, scene({ fight: { foe: 'Gonza', rank: 'C', look: 'a grown man with a club', deadly: false } }));
    expect(options(s).some((o) => o.label === 'Give up')).toBe(true);
    handleInput(s, '7');
    expect(s.duel?.over ?? true).toBe(true);
    expect(has(s, 'rep_soldiers')).toBe(8);
  });

  it('real variables from the story are counted: a surprise and a hurt, tired foe', () => {
    const s = startGmGame();
    gmApply(s, scene({ fight: { foe: 'Gonza', rank: 'C', look: 'Gonza, drunk, his bad knee locked', deadly: false, surprise: true, foeWound: 2, foeTired: 2 } }));
    expect(s.duel!.surprise).toBe(true);
    expect(s.duel!.foe.wound).toBe(2);
    expect(s.duel!.foe.fatigue).toBe(2);
    expect(fightOdds(s.duel!)).toMatch(/Something is on Li's side/);
  });

  it('a lost fight says Li learned from it', () => {
    const s = startGmGame();
    gmApply(s, scene({ fight: { foe: 'Gonza', rank: 'C', look: 'a grown man with a club', deadly: false } }));
    handleInput(s, '5');
    expect(s.events.some((e) => /Li learned something from this fight/.test(e.fact))).toBe(true);
  });
});
