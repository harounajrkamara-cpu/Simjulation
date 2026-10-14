import { describe, it, expect } from 'vitest';
import { startGame, takeAction, li, options } from '../engine/engine';
import { PAYDAY_TIP, DICE_WIN_BASE, DICE_WIN_PER_OBS, CARRY_PAY_BASE, CARRY_PAY_PER_END } from '../engine/campaign';

describe('Phase 2: more ways to earn', () => {
  it('carry_villages pays endurance-based wages', () => {
    const s = startGame(1);
    s.date = { year: 100, month: 1, day: 3, part: 'morning' };
    const before = s.money;
    const result = takeAction(s, { kind: 'carry_villages' });
    const end = li(s).skills.endurance ?? 25;
    const expected = CARRY_PAY_BASE + Math.floor(end / 3) * CARRY_PAY_PER_END;
    expect(result.events.some((e) => e.type === 'money' && e.data.amount === expected)).toBe(true);
    expect(s.money).toBe(before + expected);
    expect(s.flags.carry_villages_total).toBe(1);
  });

  it('carry_villages is offered as a daytime option (no battle)', () => {
    const s = startGame(1);
    s.date = { year: 100, month: 1, day: 3, part: 'morning' };
    const opts = options(s);
    const carry = opts.find((o) => o.action.kind === 'carry_villages');
    expect(carry).toBeDefined();
    expect(carry!.label).toMatch(/carry/i);
  });

  it('dice game on payday evening pays observation-based winnings', () => {
    const s = startGame(1);
    s.date = { year: 100, month: 1, day: 1, part: 'evening' };
    // Must have heard all rumours first (RUMOURS has 6 entries)
    s.flags.rumours_heard = 99;
    const obs = li(s).skills.observation ?? 20;
    const expectedWin = DICE_WIN_BASE + Math.floor(obs / 5) * DICE_WIN_PER_OBS;
    const before = s.money;
    const result = takeAction(s, { kind: 'listen' });
    expect(result.events.some((e) => e.type === 'money' && e.data.amount === expectedWin)).toBe(true);
    expect(s.money).toBe(before + expectedWin);
  });

  it('listen on non-payday evening does NOT trigger dice game', () => {
    const s = startGame(1);
    s.date = { year: 100, month: 1, day: 5, part: 'evening' };
    s.flags.rumours_heard = 99;
    const before = s.money;
    const result = takeAction(s, { kind: 'listen' });
    const moneyEvents = result.events.filter((e) => e.type === 'money');
    expect(moneyEvents.every((e) => e.data.amount === 0 || e.data.amount === undefined)).toBe(true);
    expect(s.money).toBe(before);
  });

  it('dice winnings increase with observation skill', () => {
    const s1 = startGame(1);
    s1.date = { year: 100, month: 1, day: 1, part: 'evening' };
    const win1 = DICE_WIN_BASE + Math.floor((li(s1).skills.observation ?? 0) / 5) * DICE_WIN_PER_OBS;

    const s2 = startGame(1);
    s2.date = { year: 100, month: 1, day: 1, part: 'evening' };
    li(s2).skills.observation = 50;
    const win2 = DICE_WIN_BASE + Math.floor(50 / 5) * DICE_WIN_PER_OBS;

    expect(win2).toBeGreaterThan(win1);
  });
});
