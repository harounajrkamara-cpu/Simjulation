import { describe, expect, it } from 'vitest';
import { bad, good, skilled, upsetRate } from '../scripts/balance';
import { fromSave, stateHash, toSave } from '../engine/engine';
import { handleInput, newGame } from '../engine/game';

// Milestone V6: the slice test — balance (Numbers §12) and a full scripted playthrough of chapter 1.

describe('duel balance across a grid of opponents (Numbers §12)', () => {
  it('bad choices almost never beat a higher rank (target < 3%)', () => {
    expect(upsetRate([45, 59], [60, 74], bad)).toBeLessThan(0.03);
  });
  it('same rank is a real fight (35–65%)', () => {
    const r = upsetRate([45, 59], [45, 59], good);
    expect(r).toBeGreaterThan(0.35);
    expect(r).toBeLessThan(0.65);
  });
  it('two ranks up cannot be won with ordinary play (D vs B)', () => {
    expect(upsetRate([30, 44], [60, 74], good)).toBe(0);
  });
  // Owner decision (Oct 15): C beats B 10–20% with good choices. Good = reading the foe's habits from the hint and
  // predicting his next move (`skilled`); answering only his last move (`good`) stays low, and that is fair.
  it('C vs B with skilled choices is on target (10–20%)', () => {
    const r = upsetRate([45, 59], [60, 74], skilled);
    expect(r).toBeGreaterThanOrEqual(0.1);
    expect(r).toBeLessThanOrEqual(0.2);
  });
  it('two ranks up stays practically impossible even when skilled (< 2%)', () => {
    expect(upsetRate([30, 44], [60, 74], skilled)).toBeLessThan(0.02);
  });
});

describe('the whole vertical slice, played start to finish', () => {
  it('a player gets from the first morning through the spar, the raid and the nickname without a dead end', () => {
    const { state: s } = newGame();
    const said: string[] = [];
    const say = (t: string) => { said.push(t); return handleInput(s, t); };
    say('1'); // take the chest from Hachi
    let turns = 1;
    for (let guard = 0; guard < 400 && !s.knowledge.includes('nickname_kurose_no_ryu'); guard++) {
      turns++;
      if (s.duel && !s.duel.over) {
        // In a fight: the winning lines for each duel (found by search, see tests/v4 and the raid test).
        const seq = s.duel.id === 'spar' ? ['counter', 'counter', 'attack', 'attack', 'counter', 'counter', 'attack', 'counter'] : ['attack', 'feint', 'feint', 'feint', 'feint', 'feint', 'feint', 'feint'];
        say(seq[Math.min(s.duel.round, seq.length - 1)]);
        continue;
      }
      const opts = handleInput(s, '').text;
      if (/Take a stick and fight him/.test(opts)) { say('1'); continue; }
      const p = s.date.part;
      if (p === 'evening' && !s.flags.lessons_open) { say('talk sukezo'); continue; }
      if (p === 'evening') { say('listen'); continue; }
      if (p === 'night') { say('sleep'); continue; }
      say('wait 30');
    }
    expect(s.knowledge).toContain('nickname_kurose_no_ryu');
    expect(s.flags.duel_spar_won).toBe(1);
    expect(s.flags.duel_raid_won).toBe(1);
    const ids = s.events.filter((e) => e.type === 'story').map((e) => (e.data as { id?: string }).id).filter(Boolean);
    for (const id of ['arrival', 'chest', 'cook_tent', 'first_night', 'inspection', 'sasabe_rice', 'wait_lesson', 'sayo_visit', 'spar', 'raid', 'nickname']) expect(ids).toContain(id);
    // The save of the whole slice loads back to the same state.
    expect(stateHash(fromSave(JSON.parse(JSON.stringify(toSave(s)))))).toBe(stateHash(s));
    // Pacing (GE ch. 9 §4): the chapter fits in one or two sessions when quiet days are skipped.
    expect(turns).toBeLessThan(150);
  });
});
