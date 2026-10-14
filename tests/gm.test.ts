import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { fromSave, li, stateHash, toSave, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GM_LIMITS, gmApply, gmMemoryText, lastFightResult, parseGmTurn, startGmGame } from '../engine/gm';

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

  it('an officer head in Kurogane service can free Li, but only through a won fight', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'service', reason: 'levy' }] }));
    gmApply(s, scene({ fight: { foe: 'A Suiren Kogashira', rank: 'F', look: 'an old officer, half dead', officer: 'Kogashira', deadly: true, witnessedEnemy: true } }));
    for (let g = 0; s.duel && g < 12; g++) handleInput(s, 'feint'); // this foe falls to feints (fixed, no dice)
    expect(s.flags[`duel_${Object.keys(s.gm!.duels)[0]}_won`]).toBe(1);
    expect(s.flags.kogashira_head).toBe(1);
    gmApply(s, scene({ changes: [{ kind: 'freedom', route: 'head' }] }));
    expect(li(s).status).toBe('free');
  });

  // ── Regression test for AI Lab Issue #3 ──────────────────────────────────
  // "A peasant boy with a stick" is NOT a Hyakunin-gashira. Canonical officers
  // (campaign.ts OFFICERS) are only Gochō and Kogashira. Current code blindly
  // trusts Claude's officer claim and awards 10 merit → 1/3 of the 30 needed for freedom.
  it('regression #3: non-canonical officer claims do not grant officer merit', async () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'service', reason: 'levy' }] }));
    gmApply(s, scene({ fight: {
      foe: 'A peasant boy with a stick', rank: 'F', look: 'a scared village boy',
      officer: 'Hyakunin-gashira', deadly: true, witnessedEnemy: true,
    } }));
    for (let g = 0; s.duel && g < 12; g++) handleInput(s, 'feint');
    expect(s.duel).toBeFalsy();
    // Issue #3 fix: Hyakunin-gashira is not canonical (campaign.ts OFFICERS has only Gochō, Kogashira),
    // so the claim is rejected → 0 officer merit and no kogashira head. A plain witnessed kill still gives 1.
    expect(s.flags.merit_service ?? 0).toBeLessThan(10);
    expect(s.flags.kogashira_head ?? 0).toBe(0);
  });

  it('time never runs backwards and a slave scene skips at most a month', () => {
    const s = startGmGame();
    gmApply(s, scene({ days: 0, part: 'evening' }));
    gmApply(s, scene({ days: 0, part: 'morning' }));
    expect(s.date.part).toBe('evening');
    gmApply(s, scene({ days: 400 }));
    expect(today(s)).toBe(30);
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
