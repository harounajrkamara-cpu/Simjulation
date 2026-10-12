import { describe, expect, it } from 'vitest';
import { dateFromIndex, dayIndex, nextPart } from '../engine/calendar';
import { fromSave, gonzaPatrols, li, skipDays, startGame, stateHash, takeAction, toSave } from '../engine/engine';
import { handleInput, parseFreeText } from '../engine/game';
import { opinion } from '../engine/relations';
import { commandCapacity, growthGain, rankScores, rankLetter } from '../engine/rules';
import { GameState } from '../engine/types';

function play(inputs: string[]): GameState {
  const s = startGame(1);
  for (const i of inputs) handleInput(s, i);
  return s;
}

const SCRIPT = ['3', '1', 'talk sukezo', '2', '1', '2', '1', 'listen', 'train body', 'wait 5 train', 'STATUS', '2', '1'];

describe('determinism (World Bible ch. 12b)', () => {
  it('same inputs give exactly the same state', () => {
    expect(stateHash(play(SCRIPT))).toBe(stateHash(play(SCRIPT)));
  });

  it('a save rebuilt from its event log matches the live game', () => {
    const s = play(SCRIPT);
    const loaded = fromSave(JSON.parse(JSON.stringify(toSave(s))));
    expect(stateHash(loaded)).toBe(stateHash(s));
  });

  it('a tampered save is rejected', () => {
    const save = toSave(play(SCRIPT));
    save.events = save.events.slice(0, -1);
    expect(() => fromSave(save)).toThrow();
  });
});

describe('calendar (ch. 9)', () => {
  it('rolls parts, days, months and years', () => {
    expect(nextPart({ year: 100, month: 1, day: 1, part: 'morning' }).part).toBe('afternoon');
    expect(nextPart({ year: 100, month: 1, day: 30, part: 'night' })).toEqual({ year: 100, month: 2, day: 1, part: 'morning' });
    expect(nextPart({ year: 100, month: 12, day: 30, part: 'night' })).toEqual({ year: 101, month: 1, day: 1, part: 'morning' });
    expect(dateFromIndex(dayIndex({ year: 101, month: 3, day: 7, part: 'morning' }))).toEqual({ year: 101, month: 3, day: 7, part: 'morning' });
  });
});

describe('numbers sheet', () => {
  it('Li starts at rank F (Numbers §1)', () => {
    const s = startGame();
    const r = rankScores(li(s));
    expect(r.warrior).toBe(10);
    expect(rankLetter(r.overall)).toBe('F');
  });

  it('growth slows near the ceiling and never passes it (Numbers §2)', () => {
    expect(growthGain(1, 12, 14, 97)).toBeGreaterThan(growthGain(1, 12, 80, 97));
    expect(growthGain(10, 12, 96.9, 97)).toBeLessThanOrEqual(0.1);
    expect(growthGain(1, 30, 97, 97)).toBe(0);
  });

  it('training is capped at 2.0 per stat per season', () => {
    const s = startGame();
    for (let d = 0; d < 80; d++) {
      // force every night into training on safe nights
      skipDays(s, 1, { night: 'train' });
    }
    const gained = Object.entries(s.seasonGains).filter(([k]) => k === 'style:two_swords').map(([, v]) => v)[0] ?? 0;
    expect(gained).toBeLessThanOrEqual(2.0001);
  });

  it('command capacity follows 10^(1 + LEA/25) (Numbers §3)', () => {
    expect(commandCapacity(25)).toBe(100);
    expect(commandCapacity(50)).toBe(1000);
    expect(commandCapacity(75)).toBe(10000);
  });

  it('summary opinion is 0 when everything is at 50 (Numbers §8)', () => {
    const rel = { base: { trust: 50, respect: 50, affection: 50, fear: 0, rivalry: 0 }, mods: [], heard: [], lastTalkDay: -1 };
    expect(opinion(rel, 0)).toBe(0);
  });
});

describe('hidden causes', () => {
  it('Gonza catches night training only on his patrol nights, and it hurts', () => {
    const s = startGame();
    // advance to the first patrol night
    while (!(s.date.part === 'night' && gonzaPatrols(s))) takeAction(s, s.date.part === 'night' ? { kind: 'sleep' } : s.date.part === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
    takeAction(s, { kind: 'train', target: 'two_swords' });
    expect(li(s).wound).toBe(1);
    expect(s.journal.some((j) => j.text.includes('Gonza caught me training'))).toBe(true);
  });
});

describe('free text (no-AI mode)', () => {
  it('understands simple intent and asks when unclear', () => {
    const s = startGame();
    expect(parseFreeText(s, 'I do my chores').action?.kind).toBe('chores');
    expect(parseFreeText(s, 'sleep').ask).toBeDefined(); // not possible in the morning
    expect(parseFreeText(s, 'blorp').ask).toBeDefined();
    expect(parseFreeText(s, 'talk to hisame').action).toEqual({ kind: 'talk', target: 'hisame' });
  });

  it('refused actions do not pass time', () => {
    const s = startGame();
    const before = { ...s.date };
    handleInput(s, 'talk to nobody-here');
    expect(s.date).toEqual(before);
  });
});
