import { describe, expect, it } from 'vitest';
import { phase, restDone } from '../engine/director';
import { startGame, takeAction } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

// Milestone V5: pacing director core and the first legend moment (GE ch. 3b, 9).

function quiet(s: GameState) {
  const p = s.date.part;
  return takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
}
function toRaid(): GameState {
  const s = startGame();
  while (!s.duel) quiet(s);
  return s;
}
function winRaid(): GameState {
  const s = toRaid();
  handleInput(s, 'attack');
  for (let g = 0; s.duel && g < 10; g++) handleInput(s, 'feint');
  return s;
}
const fired = (s: GameState, id: string) => s.events.find((e) => e.type === 'story' && (e.data as { id?: string }).id === id);

describe('pacing director (GE ch. 9 §2)', () => {
  it('build-up before the first big moment, peak during a fight, then fade, relax and build again', () => {
    const s = startGame();
    expect(phase(s)).toBe('build');
    const r = toRaid();
    expect(phase(r)).toBe('peak');
    handleInput(r, 'attack');
    for (let g = 0; r.duel && g < 10; g++) handleInput(r, 'feint');
    const phases: string[] = [];
    for (let d = 0; d < 6; d++) { phases.push(phase(r)); for (let p = 0; p < 4; p++) quiet(r); }
    expect(phases[0]).toBe('fade'); // the morning after the night raid
    expect(phases).toContain('relax');
    expect(phases).toContain('build'); // (the nickname, itself a peak, may start a new rest)
  });

  it('is deterministic: the same game gives the same phases', () => {
    const a = winRaid(); const b = winRaid();
    expect(phase(a)).toBe(phase(b));
    expect(restDone(a)).toBe(restDone(b));
  });
});

describe('the first nickname: a legend moment (GE ch. 3b)', () => {
  it('comes only after the deed, the spreading word and the quiet days — at the fire, in the evening', () => {
    const s = winRaid();
    const raidDay = fired(s, 'raid')!.day;
    let guard = 0;
    while (!fired(s, 'nickname') && guard++ < 200) quiet(s);
    const e = fired(s, 'nickname')!;
    expect(e).toBeDefined();
    expect(e.part).toBe('evening');
    expect(e.day - raidDay).toBeGreaterThan(3);
    expect((e.data as { tier: string }).tier).toBe('legend');
    expect(s.knowledge).toContain('nickname_kurose_no_ryu');
    expect(s.journal.some((j) => j.text.startsWith('Legend:'))).toBe(true);
  });

  it('is never given to a boy who ran', () => {
    const s = toRaid();
    handleInput(s, 'run');
    for (let d = 0; d < 20 * 4; d++) quiet(s);
    expect(fired(s, 'nickname')).toBeUndefined();
  });
});
