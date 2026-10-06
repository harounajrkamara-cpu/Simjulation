import { describe, expect, it } from 'vitest';
import { strongCareer } from '../scripts/career';
import { PRICE_MON, raidIndexOn } from '../engine/campaign';
import { li, options, startGame, takeAction, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

// Phase 2: the slave arc to freedom (WB 10.4 freedom routes, Numbers §6, §7, §12).

function quiet(s: GameState) {
  const p = s.date.part;
  if (s.duel && !s.duel.over) return handleInput(s, 'counter');
  return takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
}
function toDay(s: GameState, day: number, part = 'morning') { while (!(today(s) === day && s.date.part === part)) quiet(s); }

describe('the Hagiwara levy and the border raids', () => {
  it('raids follow a fixed schedule: months 4–9, days 8 and 22', () => {
    expect(raidIndexOn(90 + 7)).toBe(0); // Year 100, Month 4, Day 8
    expect(raidIndexOn(90 + 21)).toBe(1);
    expect(raidIndexOn(90 + 8)).toBeUndefined();
    expect(raidIndexOn(9 * 30 + 7)).toBeUndefined(); // Month 10: winter, no raids
  });

  it('in summer the levy is called; stepping forward puts Li in Kurogane service and in the fight at the ford', () => {
    const s = startGame();
    toDay(s, 90);
    const o = options(s);
    expect(o[0].label).toBe('Step forward: serve in the Hagiwara levy');
    handleInput(s, '1');
    expect(s.flags.choice_levy).toBe(3);
    toDay(s, 97);
    expect(s.duel?.id).toBe('skirmish_0');
  });

  it('staying with the baggage means no raids for Li', () => {
    const s = startGame();
    toDay(s, 90);
    handleInput(s, '2');
    toDay(s, 98);
    expect(s.events.some((e) => e.type === 'duel' && String((e.data as { state?: { id?: string } }).state?.id ?? '').startsWith('skirmish'))).toBe(false);
  });
});

describe('freedom (Numbers §12: a strong player is free at 13–15)', () => {
  it('a strong career earns thirty merit in service and is freed by the merit law in time', () => {
    const c = strongCareer();
    expect(c.merit).toBeGreaterThanOrEqual(30);
    expect(c.freeAt).toBeDefined();
    expect(c.freeAt!.age).toBeGreaterThanOrEqual(13);
    expect(c.freeAt!.age).toBeLessThanOrEqual(15);
  });

  it('buying freedom: fifteen ryō paid to Rokubei', () => {
    const s = startGame();
    s.knowledge.push('own_price_15');
    s.money = PRICE_MON + 5;
    toDay(s, 12, 'evening');
    const o = options(s).find((x) => x.action.kind === 'buy_freedom')!;
    expect(o.label).toBe('Pay Rokubei the price: fifteen ryō');
    handleInput(s, o.key);
    expect(li(s).status).toBe('free');
    expect(s.money).toBe(5);
    expect(s.journal.some((j) => j.text.startsWith('Legend: I bought my freedom'))).toBe(true);
  });

  it("Raizen's release comes when his trust and respect are very high", () => {
    const s = startGame();
    s.relations.raizen.base.trust = 90;
    s.relations.raizen.base.respect = 90;
    toDay(s, 12, 'night');
    expect(li(s).status).toBe('free');
    expect(s.knowledge).toContain('stage1_complete');
  });
});
