import { describe, expect, it } from 'vitest';
import { officerTemplate } from '../engine/campaign';
import { startGame, takeAction, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { journalArcs, recap, trophies } from '../engine/render';
import { GameState } from '../engine/types';

// Phase 2 row, rest: timeskip summary (WB ch. 9), RECAP in arcs with trophies (WB ch. 11).

function quiet(s: GameState) {
  const p = s.date.part;
  if (s.duel && !s.duel.over) return handleInput(s, 'counter');
  return takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
}

describe('timeskip summary', () => {
  it('a WAIT reports Li\'s routine, his people and the changes, and why it stopped', () => {
    const s = startGame();
    while (!(today(s) === 2 && s.date.part === 'morning')) quiet(s);
    const r = handleInput(s, 'WAIT 7 TRAIN');
    const x = r.summary!;
    expect(x.days).toBe(2);
    expect(x.stopped).toContain('Villagers from Sasabe');
    expect(x.li[0]).toMatch(/^Li worked \d+ shifts in the camp and trained in secret on \d+ nights?\.$/);
    expect(x.people).toContain('New: Kaname (cold toward Li).');
    expect(r.text).toContain('== TIMESKIP · 2 days ==');
  });

  it('a skip with nothing new still says so, and no summary when no day passed', () => {
    const s = startGame();
    while (!(today(s) === 10 && s.date.part === 'morning')) quiet(s);
    const r = handleInput(s, 'WAIT 3');
    expect(r.summary!.days).toBe(3);
    expect(r.summary!.stopped).toBeUndefined();
  });

  it('shows only what Li can know: no hidden numbers in the summary', () => {
    const s = startGame();
    while (!(today(s) === 2 && s.date.part === 'morning')) quiet(s);
    const text = JSON.stringify(handleInput(s, 'WAIT 7').summary);
    expect(text).not.toMatch(/potential|trust|affection \d|🔒/);
  });
});

describe('RECAP in arcs, with trophies', () => {
  it('groups the journal by year and season', () => {
    const s = startGame();
    while (today(s) < 95) quiet(s);
    const arcs = journalArcs(s);
    expect(arcs.map((a) => a.title)).toEqual(['Year 100 · Spring', 'Year 100 · Summer']);
    expect(recap(s)).toContain('=== Year 100 · Spring ===');
  });

  it('a won officer duel is a trophy: name, rank and men, place, date, Li\'s read', () => {
    const s = startGame();
    s.events.push({ seq: 9999, day: 171, part: 'morning', type: 'story', fact: '', visible: true, data: { duelEnd: 'officer_5', result: 'won' } });
    const t = trophies(s);
    expect(t).toEqual([`A Suiren Gochō with a lacquered helmet – Gochō (5 men) – the ford on the Kurose – Year 100, Month 6, Day 22 – ${officerTemplate(5).foe.estimate.split(' · ').at(-1)}`]);
  });
});
