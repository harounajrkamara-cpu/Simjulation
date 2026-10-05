import { describe, expect, it } from 'vitest';
import { fromSave, maxSkipDays, skipDays, startGame, stateHash, takeAction, toSave, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { modValueAt, opinion } from '../engine/relations';
import { RUMOUR, plainMemory, retell, spreadDrafts } from '../engine/rumours';
import { GameState } from '../engine/types';

// Milestone V1 (Build Plan v2): rumours, third person, WAIT rules.

function toRaid(): GameState {
  const s = startGame();
  while (!s.duel) {
    const p = s.date.part;
    takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
    if (today(s) > 40) throw new Error('raid never started');
  }
  return s;
}

function winRaid(): GameState {
  const s = toRaid();
  handleInput(s, 'attack');
  let guard = 0;
  while (s.duel && guard++ < 10) handleInput(s, 'feint');
  return s;
}

/** Play whole days with a quiet routine. */
function days(s: GameState, n: number): void {
  const end = today(s) + n;
  while (today(s) < end) {
    if (s.duel) throw new Error('days() ran into a fight');
    const p = s.date.part;
    takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
  }
}

const memoryOf = (s: GameState, npc: string, key: string) => s.memories.find((m) => m.npc === npc && m.key === key);

describe('rumours: fixed retelling rules (ch. 12b #2)', () => {
  it('numbers grow by a set step: the bridge legend grows from 120 to 300 in four retellings', () => {
    let t = 'held the bridge against 120 men';
    for (let i = 0; i < 4; i++) t = retell(t, 90);
    expect(t).toBe('held the bridge against 300 men');
  });

  it('uncertain details drop out; certain ones stay', () => {
    const what = 'killed a raider [at Sasabe] [with a dropped sword].';
    expect(retell(what, 70)).toBe(what);
    expect(retell(what, 50)).toBe('killed a raider.');
    expect(plainMemory(what)).toBe('killed a raider at Sasabe with a dropped sword.');
  });
});

describe('rumours spread around the fire (World Bible ch. 8)', () => {
  it('the raid travels one step per night, losing certainty, and silent Hisame tells nobody', () => {
    const s = winRaid();
    expect(memoryOf(s, 'raizen', 'li_raid_sasabe')?.certainty).toBe(80);
    expect(memoryOf(s, 'rokubei', 'li_raid_sasabe')).toBeUndefined();

    days(s, 1); // first night: Raizen → Rokubei, Gonza
    const rokubei = memoryOf(s, 'rokubei', 'li_raid_sasabe')!;
    expect(rokubei.source).toBe('rumour');
    expect(rokubei.certainty).toBe(80 - RUMOUR.rumourLoss);
    expect(rokubei.from).toBe('raizen');
    expect(memoryOf(s, 'gonza', 'li_raid_sasabe')).toBeDefined();
    expect(memoryOf(s, 'sukezo', 'li_raid_sasabe')).toBeUndefined();

    days(s, 1); // second night: Rokubei → Sukezō; detail drops below certainty 60
    const sukezo = memoryOf(s, 'sukezo', 'li_raid_sasabe')!;
    expect(sukezo.certainty).toBe(40);
    expect(sukezo.what).not.toContain('Sasabe');

    days(s, 1); // third night: Sukezō → Hachi
    expect(memoryOf(s, 'hachi', 'li_raid_sasabe')).toBeDefined();

    // Hisame saw it all but passes nothing on: only Raizen heard it from her (scripted), nobody from her by rumour.
    expect(s.memories.filter((m) => m.from === 'hisame')).toHaveLength(0);
  });

  it('hearers change their view of Li, and Gonza resents instead of respecting', () => {
    const s = winRaid();
    const before = opinion(s.relations.rokubei, today(s));
    days(s, 1);
    expect(opinion(s.relations.rokubei, today(s))).toBeGreaterThan(before);
    const gonzaMods = s.relations.gonza.mods.filter((m) => m.reason.startsWith('Heard:'));
    expect(gonzaMods.map((m) => m.field)).toEqual(['rivalry']);
  });

  it('Li sees a sign when the story reaches someone he knows (ch. 12b #11), at most two a night', () => {
    const s = winRaid();
    days(s, 1);
    const signs = s.events.filter((e) => e.type === 'rumour' && e.visible);
    expect(signs.length).toBeGreaterThan(0);
    expect(signs.length).toBeLessThanOrEqual(RUMOUR.maxSigns);
    expect(signs[0].fact).toContain('Sasabe');
  });

  it('a rumour fades after a month (Numbers §8)', () => {
    const s = winRaid();
    days(s, 1);
    const heard = () => s.relations.rokubei.mods.filter((m) => m.reason.startsWith('Heard:'));
    expect(heard().reduce((t, m) => t + modValueAt(m, today(s)), 0)).toBeGreaterThan(0);
    days(s, 31);
    expect(heard().reduce((t, m) => t + modValueAt(m, today(s)), 0)).toBe(0);
  });

  it('spreading is deterministic and survives save and load', () => {
    const a = winRaid(); days(a, 3);
    const b = winRaid(); days(b, 3);
    expect(stateHash(a)).toBe(stateHash(b));
    const loaded = fromSave(JSON.parse(JSON.stringify(toSave(a))));
    expect(stateHash(loaded)).toBe(stateHash(a));
    expect(spreadDrafts(loaded, () => true)).toEqual(spreadDrafts(a, () => true));
  });
});

describe('third person (Game Experience ch. 7)', () => {
  it('no narration addresses the player as "you" (dialogue in quotes may)', () => {
    const s = startGame();
    for (const i of ['3', '1', 'talk sukezo', '2', '1', '2', '1', 'listen', 'train body', 'talk gonza', 'talk rokubei', 'talk hachi', 'STATUS', 'RELATIONS', 'RECAP']) handleInput(s, i);
    const raid = winRaid();
    const lost = toRaid();
    for (let g = 0; lost.duel && g < 12; g++) handleInput(lost, 'counter');
    const fled = toRaid();
    handleInput(fled, 'run');
    days(raid, 2);
    const facts = [s, raid, lost, fled].flatMap((x) => x.events.filter((e) => e.visible).map((e) => e.fact));
    const narration = facts.map((f) => f.replace(/"[^"]*"/g, '""'));
    const bad = narration.filter((f) => /\b(you|your|yours|yourself)\b/i.test(f));
    expect(bad).toEqual([]);
    for (const cmd of ['STATUS', 'RELATIONS', 'RECAP', 'INFOCHAR hachi']) {
      expect(handleInput(s, cmd).text).not.toMatch(/\b(you|your)\b/i);
    }
  });
});

describe('third person in the engine source', () => {
  it('no narration string outside dialogue says "you" or "your"', async () => {
    const { readFileSync } = await import('node:fs');
    const files = ['engine/engine.ts', 'engine/duel.ts', 'engine/content.ts', 'engine/data.ts', 'engine/render.ts', 'engine/relations.ts'];
    const bad: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g)) {
        const text = (m[1] ?? m[2]).replace(/"[^"]*"/g, '""').replace(/\\"[^"]*\\"/g, '');
        if (/\b(you|your|yours|yourself)\b/i.test(text)) bad.push(`${f}: ${text.slice(0, 80)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('WAIT (World Bible ch. 9, Game Experience ch. 9 §6)', () => {
  it('a slave can plan at most a month ahead', () => {
    const s = startGame();
    expect(maxSkipDays(s)).toBe(30);
    const r = handleInput(s, 'wait 60');
    expect(today(s)).toBeLessThanOrEqual(30);
    expect(r.text).toContain('at most 30 days ahead as a slave');
  });

  it('a skip stops when the season turns', () => {
    const s = startGame();
    s.date = { year: 100, month: 3, day: 28, part: 'morning' }; // after the raid's day, near the end of spring
    const r = skipDays(s, 10, { night: 'sleep' });
    expect(r.interrupted).toBe('The season turns: Summer, Year 100.');
    expect(s.date.month).toBe(4);
  });

  it('a skip gives the same result as playing the same routine by hand', () => {
    // Days 11–16 have no story events, so the skip runs through (a story would rightly stop it).
    const a = startGame();
    a.date = { year: 100, month: 1, day: 11, part: 'morning' };
    expect(skipDays(a, 5, { night: 'sleep' }).interrupted).toBeUndefined();
    const b = startGame();
    b.date = { year: 100, month: 1, day: 11, part: 'morning' };
    const end = today(b) + 5;
    while (today(b) < end) {
      const p = b.date.part;
      takeAction(b, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'eat_with', target: 'hachi' } : { kind: 'chores' });
    }
    expect(stateHash(a)).toBe(stateHash(b));
  });

  it('HELP lists the commands, including WAIT', () => {
    expect(handleInput(startGame(), 'HELP').text).toMatch(/WAIT/);
  });
});
