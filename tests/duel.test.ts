import { describe, expect, it } from 'vitest';
import { DUEL_MOVES, DuelMove, DuelState, duelRound } from '../engine/duel';
import { li, startGame, takeAction, today } from '../engine/engine';
import { handleInput } from '../engine/game';

function duel(liVal: number, liM: number, foeVal: number, foeM: number, extra: Partial<DuelState> = {}): DuelState {
  return {
    id: 't', round: 0, over: false, surprise: false, prefs: { attack: 3, counter: 1, feint: 1, observe: 0 },
    li: { id: 'li', name: 'Li', val: liVal, mastery: liM, wound: 0, fatigue: 0, observed: 0, history: [] },
    foe: { id: 'f', name: 'Foe', val: foeVal, mastery: foeM, wound: 0, fatigue: 0, observed: 0, history: [] },
    ...extra,
  };
}

/** Search every sequence of Li's moves (depth-limited) and report if any wins / any loses. */
function explore(d: DuelState, depth: number): { canWin: boolean; canLose: boolean } {
  let canWin = false; let canLose = false;
  const walk = (s: DuelState, n: number) => {
    if (s.over || n === 0) { if (s.result === 'won') canWin = true; if (s.result === 'lost') canLose = true; return; }
    for (const m of DUEL_MOVES) walk(duelRound(s, m).state, n - 1);
  };
  walk(d, depth);
  return { canWin, canLose };
}

const play = (d: DuelState, moves: DuelMove[]) => moves.reduce((s, m) => (s.over ? s : duelRound(s, m).state), d);

describe('duel balance (World Bible ch. 6a upset rule, Numbers §4 v0.3)', () => {
  it('same rank: good choices can win, bad choices can lose', () => {
    expect(explore(duel(52, 52, 52, 52), 6)).toEqual({ canWin: true, canLose: true });
  });

  it('one rank up (C vs B): winnable with good play', () => {
    expect(explore(duel(52, 52, 67, 67), 7).canWin).toBe(true);
  });

  it('three ranks up (F vs C): no sequence wins', () => {
    expect(explore(duel(14, 6, 52, 50), 6).canWin).toBe(false);
  });

  it('is deterministic', () => {
    const seq: DuelMove[] = ['observe', 'feint', 'attack', 'counter', 'attack'];
    expect(play(duel(40, 40, 45, 45), seq)).toEqual(play(duel(40, 40, 45, 45), seq));
  });
});

describe('the Sasabe raid', () => {
  function toRaid() {
    const s = startGame();
    while (!s.duel) {
      const p = s.date.part;
      takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
      if (today(s) > 40) throw new Error('raid never started');
    }
    return s;
  }

  it('starts on Month 2, Day 6 at night and freezes time during the fight', () => {
    const s = toRaid();
    expect(s.date).toMatchObject({ month: 2, day: 6, part: 'night' });
    handleInput(s, '4'); // observe
    expect(s.date).toMatchObject({ month: 2, day: 6, part: 'night' });
  });

  it('a smart fight wins: strike from surprise, then feint against his counter', () => {
    const s = toRaid();
    handleInput(s, 'attack');
    let guard = 0;
    while (s.duel && guard++ < 10) handleInput(s, 'feint');
    expect(s.journal.some((j) => j.text.includes('I brought down a Suiren raider'))).toBe(true);
    expect(s.flags.merit_combat).toBe(1);
  });

  it('Li never dies: losing leaves him badly wounded at most', () => {
    const s = toRaid();
    let guard = 0;
    while (s.duel && guard++ < 12) handleInput(s, 'counter');
    expect(li(s).alive).toBe(true);
    expect(li(s).wound).toBeLessThanOrEqual(3);
    expect(s.duel).toBeFalsy();
  });
});
