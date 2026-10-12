import { describe, expect, it } from 'vitest';
import { li, options, startGame, takeAction, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

// Milestone V4: first-week teaching beats and the sparring bout (Game Experience ch. 8).

function quiet(s: GameState) {
  const p = s.date.part;
  return takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
}

function toSpar(): GameState {
  const s = startGame();
  while (!(today(s) === 19 && s.date.part === 'afternoon')) quiet(s);
  return s;
}

describe("Gonza's chest (Day 1 morning)", () => {
  it('the first screen offers a real choice, with its risk shown', () => {
    const o = options(startGame());
    expect(o[0]).toMatchObject({ label: 'Take the chest from Hachi', risk: 'Gonza will notice' });
    expect(o[1].label).toBe('Look away and keep quiet');
  });

  it('taking the chest wins Hachi and is remembered by Gonza', () => {
    const s = startGame();
    handleInput(s, '1');
    expect(s.relations.hachi.mods.some((m) => m.reason === 'Took my load from Gonza')).toBe(true);
    expect(s.memories.some((m) => m.npc === 'gonza' && m.key === 'li_defied_gonza')).toBe(true);
    expect(s.journal.some((j) => j.text.includes('I carried the chest for Hachi'))).toBe(true);
  });

  it('a choice lapses when the part of the day passes', () => {
    const s = startGame();
    takeAction(s, { kind: 'chores' });
    expect(options(s).some((o) => o.action.kind === 'choose')).toBe(false);
    expect(takeAction(s, { kind: 'choose', target: 'chest:0' }).refused).toBe(true);
  });
});

describe('the first week teaches as it goes', () => {
  it('cook tent, first night and the WAIT lesson arrive on their days', () => {
    const s = startGame();
    while (today(s) < 7) quiet(s);
    const ids = s.events.filter((e) => e.type === 'story').map((e) => (e.data as { id?: string }).id);
    expect(ids).toEqual(expect.arrayContaining(['chest', 'cook_tent', 'first_night', 'wait_lesson']));
  });
});

describe('the sparring bout with Daisuke (Month 1, Day 20)', () => {
  it('Daisuke challenges; Li may fight or walk past', () => {
    const s = toSpar();
    expect(options(s).slice(0, 2).map((o) => o.label)).toEqual(['Take a stick and fight him', 'Walk past him']);
  });

  it('good play wins: read him, counter his swings, strike when he waits (31 of 178 move lines win)', () => {
    const s = toSpar();
    handleInput(s, '1');
    expect(s.duel?.id).toBe('spar');
    expect(options(s).find((o) => o.label === 'Run')?.risk).toBe('the village boys will laugh');
    for (const m of ['counter', 'counter', 'attack', 'attack', 'counter', 'counter', 'attack', 'counter']) if (s.duel) handleInput(s, m);
    expect(s.flags.duel_spar_won).toBe(1);
    expect(s.relations.daisuke.mods.some((m) => m.reason === 'Beat me fairly in front of others')).toBe(true);
  });

  it('losing costs little: at worst Hurt, never worse (sticks)', () => {
    const s = toSpar();
    handleInput(s, '1');
    for (let g = 0; s.duel && g < 12; g++) handleInput(s, 'observe');
    expect(s.duel).toBeFalsy();
    expect(li(s).wound).toBeLessThanOrEqual(1);
  });

  it('the raid still comes after, on Month 2, Day 6', () => {
    const s = toSpar();
    handleInput(s, '2');
    while (!s.duel) quiet(s);
    expect(s.duel.id).toBe('raid');
    expect(s.date).toMatchObject({ month: 2, day: 6 });
  });
});
