import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { fromSave, li, stateHash, toSave, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GM_LIMITS, gmApply, gmApplyFix, gmMemoryText, lastFightResult, parseGmTurn, startGmGame } from '../engine/gm';

// Game Master mode (owner decision Oct 7): Claude runs the world; the code remembers and referees.

const scene = (o: Record<string, unknown>) => parseGmTurn({ scene: 'Li carries water past the horse lines.', summary: 'Water.', ...o })!;

describe('Game Master mode: the code keeps the memory', () => {
  it('starts with no fixed story beats; scenes, people, storylines and lore are remembered', () => {
    const s = startGmGame();
    expect(s.events.filter((e) => e.type === 'story')).toHaveLength(0);
    gmApply(s, scene({
      summary: 'Li meets Tomoe, a camp follower who sells sake.',
      journal: 'I met Tomoe, who sells sake to the band.',
      changes: [
        { kind: 'person', id: 'tomoe', name: 'Tomoe', role: 'camp follower', desc: 'A sharp-eyed woman selling sake.', goal: 'Get rich off the band', secret: 'Spies for the Hagiwara steward' },
        { kind: 'thread', id: 'sake_debt', text: 'Gonza owes Tomoe money', open: true },
        { kind: 'lore', title: 'Camp followers', text: 'Women and men who follow a band to sell it things.' },
      ],
      days: 2,
    }));
    const mem = gmMemoryText(s);
    expect(mem).toContain('Tomoe [id: tomoe]');
    expect(mem).toContain('SECRET: Spies for the Hagiwara steward');
    expect(mem).toContain('[sake_debt] Gonza owes Tomoe money');
    expect(mem).toContain('Li meets Tomoe');
    expect(s.journal.at(-1)!.text).toBe('I met Tomoe, who sells sake to the band.');
    expect(today(s)).toBe(2);
    expect(s.gm!.lore[0].title).toBe('Camp followers');
  });

  it('a save replays every scene to the same state', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'relation', npc: 'raizen', field: 'respect', delta: 5, reason: 'Held his tongue' }, { kind: 'money', amount: 30, reason: 'a tip' }], days: 3 }));
    gmApply(s, scene({ changes: [{ kind: 'train', focus: 'two_swords', days: 10 }], days: 10 }));
    const back = fromSave(toSave(s));
    expect(stateHash(back)).toBe(stateHash(s));
    expect(back.gm!.scenes).toHaveLength(2);
  });
});

describe('Game Master mode: the code referees', () => {
  it('cuts changes to the limits and says why', () => {
    const s = startGmGame();
    const r = gmApply(s, scene({ changes: [
      { kind: 'relation', npc: 'raizen', field: 'trust', delta: 60, reason: 'flattery' },
      { kind: 'money', amount: 999999, reason: 'found gold' },
      { kind: 'wound', level: 4, reason: 'a fall' },
      { kind: 'dies', npc: 'li', reason: 'plot' },
    ] }));
    expect(r.notes.join(' ')).toMatch(/limit ±15/);
    expect(s.money).toBe(12 + GM_LIMITS.moneyGain);
    expect(li(s).wound).toBe(3);
    expect(li(s).alive).toBe(true);
    expect(r.notes).toContain('Li does not die');
  });

  it('training follows the season cap, the same as playing it', () => {
    const s = startGmGame();
    const before = li(s).styles.two_swords;
    const r = gmApply(s, scene({ changes: [{ kind: 'train', focus: 'two_swords', days: 90 }] }));
    expect(li(s).styles.two_swords - before).toBeLessThanOrEqual(2.0001);
    expect(r.notes.join(' ')).toMatch(/season cap/);
  });

  it('freedom only through a real route', () => {
    const s = startGmGame();
    const r = gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'raizen' }] }));
    expect(li(s).status).toBe('slave');
    expect(r.notes.join(' ')).toMatch(/must both reach 85/);
    // Owner decision (VISIE Phase 2 #1): only in winter quarters, and only when Li can make it.
    expect(gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'escape' }] })).notes.join(' ')).toMatch(/only slip away in winter quarters/);
    s.date.month = 10;
    expect(gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'escape' }] })).notes.join(' ')).toMatch(/not quiet enough/);
    li(s).skills.stealth = 30;
    li(s).skills.endurance = 45;
    gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'escape' }] }));
    expect(li(s).status).toBe('free');
    expect(s.knowledge).toContain('hunted');
  });

  it('fights are decided by the duel engine, then the result goes back to Claude', () => {
    const s = startGmGame();
    const r = gmApply(s, scene({ fight: { foe: 'A drunk spearman', rank: 'E', look: 'big, swaying, a spear', deadly: false }, days: 5 }));
    expect(r.duelId).toBeDefined();
    expect(s.duel?.id).toBe(r.duelId);
    expect(today(s)).toBe(0); // time waits for the fight
    for (let g = 0; s.duel && g < 12; g++) handleInput(s, 'counter');
    expect(s.duel).toBeFalsy();
    expect(today(s)).toBe(0);
    expect(lastFightResult(s)).toMatch(/THE FIGHT IS OVER/);
    gmApply(s, scene({ summary: 'After the fight.' }));
    expect(lastFightResult(s)).toBeUndefined();
  });

  it('an invented officer earns nothing: a farmhand called "Kogashira" cannot free Li (AI Lab issue #3)', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'service', reason: 'levy' }] }));
    const r = gmApply(s, scene({ fight: { foe: 'A random farmhand', rank: 'F', look: 'a peasant with a staff', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    expect((r.secretNotes ?? []).join(' ')).toMatch(/not a Kogashira on the code's record/);
    for (let g = 0; s.duel && g < 12; g++) handleInput(s, 'feint');
    expect(s.flags.kogashira_head ?? 0).toBe(0);
    expect(s.flags.merit_service ?? 0).toBe(0);
    gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'head' }] }));
    expect(li(s).status).toBe('slave');
  });

  it('the real officer at the ford on his raid day does count, and fights at his real strength', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'service', reason: 'levy' }] }));
    while (today(s) < 261) gmApply(s, scene({ days: Math.min(30, 261 - today(s)) })); // Year 100, Month 9, Day 22: the Kogashira's raid
    const r = gmApply(s, scene({ place: 'the ford on the Kurose', fight: { foe: 'A Suiren Kogashira', rank: 'F', look: 'an officer under a blue banner', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    expect((r.secretNotes ?? []).join(' ')).not.toMatch(/not a Kogashira|no merit/);
    expect(s.duel!.foe.val).toBe(38); // the record's Kogashira, not Claude's "F"
  });

  it('on the raid day a "farmhand" called Kogashira is not the officer: the fight is against the recorded officer, once (Copilot review, PR #5)', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'service', reason: 'levy' }] }));
    while (today(s) < 261) gmApply(s, scene({ days: Math.min(30, 261 - today(s)) }));
    gmApply(s, scene({ place: 'the ford on the Kurose', fight: { foe: 'A random farmhand', rank: 'F', look: 'a peasant with a staff', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    expect(s.duel!.foe.name).toMatch(/Suiren Kogashira/); // the record's officer, at his strength
    expect(s.duel!.foe.val).toBe(38);
    s.duel = undefined; // leave the first fight (its result does not matter here)
    const r = gmApply(s, scene({ place: 'the ford on the Kurose', fight: { foe: 'Another Suiren Kogashira', rank: 'C', look: 'a second officer', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    expect((r.secretNotes ?? []).join(' ')).toMatch(/not a Kogashira on the code's record/);
    expect((r.secretNotes ?? []).join(' ')).toMatch(/one fight that counts is over/);
  });

  it('a known person fights with his own numbers, whatever rank Claude guesses', () => {
    const s = startGmGame();
    gmApply(s, scene({ fight: { foe: 'Gonza', rank: 'F', look: 'one-eared and angry', deadly: false } }));
    expect(s.duel!.foe.val).toBe(s.characters.gonza.stats.VAL);
  });

  it('time never runs backwards: "morning" after an evening is the next morning; a slave scene skips at most a month', () => {
    const s = startGmGame();
    const d0 = today(s);
    gmApply(s, scene({ days: 0, part: 'evening' }));
    gmApply(s, scene({ days: 0, part: 'morning' }));
    expect(today(s)).toBe(d0 + 1);
    expect(s.date.part).toBe('morning');
    gmApply(s, scene({ days: 400 }));
    expect(today(s)).toBe(d0 + 31);
  });

  it('when Li sleeps the next scene is the next morning, even if Claude wrote days 0 (owner, Oct 11)', () => {
    const s = startGmGame();
    gmApply(s, scene({ days: 0, part: 'night' }));
    const d = today(s);
    gmApply(s, scene({ days: 0, sleeps: true }));
    expect(today(s)).toBe(d + 1);
    expect(s.date.part).toBe('morning');
  });

  it('"Something\'s wrong" can move time forward (never in a scene, never back)', () => {
    const s = startGmGame();
    const d = today(s);
    const r = gmApply(s, scene({ changes: [{ kind: 'time', days: 1, part: 'morning', reason: 'sneaky' }] }));
    expect(today(s)).toBe(d);
    expect((r.secretNotes ?? []).join(' ')).toMatch(/time moves with/);
    gmApplyFix(s, { explanation: 'Li slept; the day should have changed.', changes: [{ kind: 'time', days: 1, part: 'morning', reason: 'Li slept' }], rewindScenes: 0 }, 'the day did not change after I slept');
    expect(today(s)).toBe(d + 1);
    gmApplyFix(s, { explanation: 'x', changes: [{ kind: 'time', days: -5, reason: 'back' }], rewindScenes: 0 }, 'go back');
    expect(today(s)).toBe(d + 1);
  });
});

describe('the Game Master loop with a fake Claude', () => {
  it('retries once on a bad answer, then records the scene', async () => {
    const answers = ['not json', JSON.stringify({ scene: 'Rain on the river.', summary: 'Rain.', suggestions: ['I wait', 'I hide'] })];
    const ai = { name: 'fake', ask: async () => answers.shift()! };
    const s = startGmGame();
    const r = await gmTurn(ai, s, 'I look at the river');
    expect(r.turn.scene).toBe('Rain on the river.');
    expect(s.gm!.suggestions).toEqual(['I wait', 'I hide']);
  });
});

describe('pacing: routine plays itself (owner, Oct 12)', () => {
  it('Claude can mark a scene as routine; nothing is routine unless Claude says so', () => {
    expect(parseGmTurn({ scene: 'Li waters the mare.', routine: true })?.routine).toBe(true);
    expect(parseGmTurn({ scene: 'Bells at dawn: raiders at the ford.' })?.routine).toBeUndefined();
  });
});

describe('Copilot QA of PR #5 (6dfcc42): the four reproduced exploits stay closed', () => {
  const toRaidDay = (s: ReturnType<typeof startGmGame>, place: string) => {
    gmApply(s, scene({ place, changes: [{ kind: 'service', reason: 'levy' }] }));
    while (today(s) < 261) gmApply(s, scene({ place, days: Math.min(30, 261 - today(s)) }));
  };
  const winDuel = (s: ReturnType<typeof startGmGame>) => {
    s.characters[s.liId].stats.VAL = 100; s.duel!.li.val = 100; s.duel!.li.mastery = 100;
    for (let g = 0; s.duel && !s.duel.over && g < 12; g++) handleInput(s, 'feint');
  };

  it('1. a non-lethal (practice) win against the raid officer gives no head, no officer merit, no freedom', () => {
    const s = startGmGame();
    toRaidDay(s, 'the ford on the Kurose');
    gmApply(s, scene({ place: 'the ford on the Kurose', fight: { foe: 'A random farmhand', rank: 'F', look: 'a peasant', officer: 'Kogashira', deadly: false, witnessedEnemy: true } }));
    winDuel(s);
    expect(s.flags.kogashira_head ?? 0).toBe(0);
    expect(s.flags.merit_service ?? 0).toBe(0);
    gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'head' }] }));
    expect(li(s).status).toBe('slave');
  });

  it('2. "Li poisons Raizen at dinner" does not kill Raizen', () => {
    const s = startGmGame();
    const r = gmApply(s, scene({ changes: [{ kind: 'dies', npc: 'raizen', reason: 'Li poisons Raizen at dinner' }] }));
    expect(s.characters.raizen.alive).toBe(true);
    expect((r.secretNotes ?? []).join(' ')).toMatch(/does not die by Li's hand/);
  });

  it('3. away from the ford (the rice fields), the raid officer and raid rewards do not count', () => {
    const s = startGmGame();
    toRaidDay(s, 'the rice fields');
    const r = gmApply(s, scene({ place: 'the rice fields', fight: { foe: 'A random farmhand', rank: 'F', look: 'a peasant', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    expect(s.duel!.foe.name).not.toMatch(/Kogashira/);
    expect((r.secretNotes ?? []).join(' ')).toMatch(/not a Kogashira on the code's record/);
  });

  it('4. other wordings of an unearned win are sent back', async () => {
    const { checkGmScene } = await import('../engine/factcheck');
    const s = startGmGame();
    for (const t of ['Li won the spar against Gonza.', 'Li punches Gonza to the ground.', 'Li leaves Gonza unable to rise.'])
      expect(checkGmScene(s, t).map((p) => p.kind)).toContain('fight');
    for (const t of ['Li puts the bucket down near Gonza.', "Li leaves Gonza's tent.", 'Li sends Hachi to fetch water.'])
      expect(checkGmScene(s, t).map((p) => p.kind)).not.toContain('fight');
  });
});
