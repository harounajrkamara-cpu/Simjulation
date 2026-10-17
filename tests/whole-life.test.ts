import { describe, expect, it } from 'vitest';
import { gmEpilogue } from '../ai/gm';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { careerOf } from '../engine/gm-career';
import { lifeStage } from '../engine/stages';
import { fromSave, stateHash, toSave } from '../engine/engine';
import { spouseOf, childrenOf } from '../engine/family';
import { memberOf } from '../engine/court';
import { ended } from '../engine/epilogue';
import type { RankId } from '../engine/career';

// The whole game, end to end (goal Oct 17: "finish the whole game, all stages"). One life through the real referee, only
// with Game Master changes the code checks: slave → freedom → soldier → officer → general, land, a house, the court, the
// epilogue. If any stage cannot be reached by the rules, this fails.
const sc = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'The years turn.', summary: 'x', ...t });

describe('a whole life, all four stages', () => {
  it('slave to general to epilogue, through the referee only, and the save replays', async () => {
    const s = startGmGame();
    const step = (t: Partial<GmTurn>) => gmApply(s, sc(t));
    const until = (rank: RankId, max = 200) => {
      for (let k = 0; k < max && careerOf(s).rank !== rank; k++) {
        step({ days: 60, changes: [{ kind: 'deed', deed: 'won', reason: "Li's men won the field; the lord saw it" }, { kind: 'deed', deed: 'objective', reason: 'the objective taken as ordered' }] });
        step({ changes: [{ kind: 'promotion', reason: 'an officer fell; the post is free', sponsor: 'tadaoki' }] });
      }
      expect(careerOf(s).rank).toBe(rank);
    };

    // Stage 1: the slave earns freedom by the merit law.
    expect(lifeStage(s)).toBe('slave');
    step({ changes: [{ kind: 'service', reason: 'Li steps forward when the Hagiwara levy is called' }] });
    for (let k = 0; k < 3; k++) step({ days: 20, changes: [{ kind: 'deed', deed: 'standard', reason: 'a Suiren standard taken; the sergeant saw it' }, { kind: 'deed', deed: 'saved_officer', reason: 'the sergeant dragged out of the river' }] });
    step({ changes: [{ kind: 'freedom', route: 'merit' }] });
    expect(s.characters[s.liId].status).toBe('free');

    // Stage 2: soldier and officer.
    step({ changes: [{ kind: 'person', id: 'tadaoki', name: 'Hagiwara Tadaoki', role: 'heir of House Hagiwara, Sennin-shō', desc: 'The border lord\'s heir.', goal: 'Hold the border.', trust: 80, respect: 80, affection: 80 }] });
    until('hyakuningashira');
    expect(lifeStage(s)).toBe('officer');

    // Stage 3: land and a house.
    until('sanbyakuninsho');
    const land = step({ changes: [{ kind: 'land', koku: 300, name: 'Ōtaki', reason: 'Lord Hagiwara grants land for the Kurose campaign' }] });
    expect(land.notes, land.notes.join(' ')).toEqual([]);
    step({ changes: [{ kind: 'person', id: 'aiko', name: 'Aiko', role: 'a weaver of Akaishi', desc: 'x', goal: 'x', trust: 80, affection: 80 }] });
    step({ changes: [{ kind: 'marry', npc: 'aiko', reason: 'love' }] });
    expect(spouseOf(s)).toBe('aiko');
    for (let k = 0; k < 10; k++) step({ days: 30 });
    step({ changes: [{ kind: 'child', name: 'Takeshi', son: true }] });
    expect(childrenOf(s)).toHaveLength(1);

    // Stage 4: a general at court.
    until('senninsho');
    expect(lifeStage(s)).toBe('general');
    for (let k = 0; k < 3; k++) step({ changes: [{ kind: 'faction', faction: 'kings_men', delta: 10, reason: 'Li held the north for the young king' }] });
    step({ changes: [{ kind: 'faction', faction: 'kings_men', join: true }] });
    expect(memberOf(s)).toBe('kings_men');

    // The end: Li retires; the epilogue is told from the record.
    const ev = await gmEpilogue(null, s, 'retired');
    expect(ended(s)).toBe(true);
    const text = ev[0].fact;
    expect(text).toMatch(/Sennin-shō/);
    expect(text).toMatch(/Married to Aiko/);
    expect(text).toMatch(/Takeshi \(son\)/);
    expect(text).toMatch(/King's Men/);
    expect(text).toMatch(/Land: 300 koku/);

    // Everything was an event: the save replays the whole life exactly.
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });
});

describe('the runaway road (Phase 2 question 4)', () => {
  it('an escaped slave is free and hunted, can serve Tatara, and his career goes on there', () => {
    const s = startGmGame();
    const c = s.characters[s.liId];
    c.skills.stealth = 30;
    c.skills.endurance = 45;
    s.date = { ...s.date, month: 11 };
    gmApply(s, sc({ changes: [{ kind: 'freedom', route: 'escape' }] }));
    expect(c.status).toBe('free');
    expect(s.knowledge).toContain('hunted');
    gmApply(s, sc({ place: 'Hinokuchi, Tatara', changes: [{ kind: 'serve', kingdom: 'tatara' }] }));
    expect(careerOf(s).kingdom).toBe('tatara');
    expect(lifeStage(s)).toBe('soldier');
  });
});
