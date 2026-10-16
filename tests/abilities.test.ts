import { describe, expect, it } from 'vitest';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, options } from '../engine/engine';
import { abilityDrafts, auraDuel, chooseTechniqueDrafts, hasAbility, influenceCap, liAbilities, pendingTechniques, techBonuses, zoneRounds, zoneUses } from '../engine/abilities';
import { activateZone, duelRound, DuelState } from '../engine/duel';
import { createBattle, runPhase } from '../engine/battle';
import { injuryDrafts } from '../engine/engine';
import type { GameState } from '../engine/types';

// Block C of Phase 6 (audit gaps 5, 19): abilities as records, the Zone, techniques, aura.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
const f = (id: string, val: number) => ({ id, name: id, val, mastery: 30, wound: 0 as const, fatigue: 0, observed: 0, history: [] });
const duel = (x: Partial<DuelState> = {}): DuelState => ({ id: 't', round: 0, li: f('Li', 40), foe: f('Foe', 40), prefs: { attack: 5, counter: 0, feint: 0, observe: 0 }, surprise: false, over: false, ...x });

describe('the Zone – SHINKEN NO RYŪ', () => {
  it('wakes only near death, and becomes an ability record', () => {
    const s = startGmGame();
    const no = gmApply(s, scene({ changes: [{ kind: 'knowledge', key: 'shinken_no_ryu' } as never] }));
    expect(liAbilities(s)).toEqual([]);
    expect(no.secretNotes?.join(' ') ?? '').toMatch(/near-death/);
    gmApply(s, scene({ changes: [{ kind: 'wound', level: 3, reason: 'a spear in the side' } as never, { kind: 'knowledge', key: 'shinken_no_ryu' } as never] }));
    expect(liAbilities(s).map((a) => a.id)).toEqual(['zone']);
  });

  it('in a duel: rounds and uses grow with mastery; while it lasts Li\'s choice wins; then he pays', () => {
    expect([zoneRounds(1), zoneRounds(50), zoneRounds(100)]).toEqual([1, 3, 5]);
    expect([zoneUses(1), zoneUses(100)]).toEqual([3, 5]);
    let d = duel({ zone: { rounds: 2, left: 0, uses: 3, used: 0 }, prefs: { attack: 0, counter: 5, feint: 0, observe: 0 } });
    d = activateZone(d).state;
    expect(d.zone).toMatchObject({ left: 2, used: 1 });
    const r1 = duelRound(d, 'attack'); // counter beats attack, but the Zone wins the clash
    expect(r1.lines.join(' ')).toMatch(/Li's choice beats his/);
    const r2 = duelRound(r1.state, 'attack');
    expect(r2.lines.join(' ')).toMatch(/The Zone breaks/);
    expect(r2.state.li.fatigue).toBeGreaterThanOrEqual(2);
  });

  it('the page offers the Zone as a move once Li has it', () => {
    const s = startGmGame();
    s.knowledge.push('shinken_no_ryu');
    gmApply(s, scene({ fight: { foe: 'a Suiren raider', rank: 'D', look: 'a raider with a spear', deadly: true } }));
    expect(options(s).some((o) => /SHINKEN NO RYŪ/.test(o.label))).toBe(true);
  });
});

describe('ability rules (WB ch. 5)', () => {
  it('the Twin Demon Dance needs two-sword mastery 30 and a witness who trusts Li; then the feint beats an attack', () => {
    const s = startGmGame();
    const notes: string[] = [];
    expect(abilityDrafts(s, { id: 'twin_demon_dance', reason: 'Raizen shows him' }, notes)).toEqual([]);
    expect(notes.join(' ')).toMatch(/mastery 30/);
    s.characters[s.liId].styles.two_swords = 31;
    s.relations.raizen.base.trust = 70;
    commitDrafts(s, abilityDrafts(s, { id: 'twin_demon_dance', reason: 'Raizen shows him what he once saw' }, notes));
    expect(hasAbility(s, 'twin_demon_dance')).toBe(true);
    const r = duelRound(duel({ liAbilities: ['twin_demon_dance'] }), 'feint');
    expect(r.lines.join(' ')).toMatch(/Twin Demon Dance/);
    commitDrafts(s, injuryDrafts(s, s.liId, 'sword arm'));
    expect(hasAbility(s, 'twin_demon_dance')).toBe(false); // an injury blocks it
  });

  it('a common ability needs the rank to hold it', () => {
    const s = startGmGame();
    const notes: string[] = [];
    expect(abilityDrafts(s, { id: 'zanshin', reason: 'years of watching' }, notes)).toEqual([]);
    expect(notes.join(' ')).toMatch(/at most 0 abilities/);
  });

  it('Silver Tongue widens what one scene can move at court', () => {
    const s = startGmGame();
    expect(influenceCap(s, 10)).toBe(10);
    s.characters[s.liId].abilities = [{ id: 'silver_tongue', name: 'Silver Tongue', kind: 'political', rank: 'D', mastery: 1 }];
    expect(influenceCap(s, 10)).toBe(15);
  });
});

describe('style techniques: choose 1 of 2 at 30/50/70/100', () => {
  it('a technique waits for Li\'s choice and then helps that move', () => {
    const s = startGmGame();
    s.characters[s.liId].styles.two_swords = 52;
    expect(pendingTechniques(s).map((p) => p.level)).toEqual([30, 50]);
    commitDrafts(s, chooseTechniqueDrafts(s, 'two_swords', 30, 2));
    commitDrafts(s, chooseTechniqueDrafts(s, 'two_swords', 50, 1));
    expect(pendingTechniques(s)).toEqual([]);
    expect(techBonuses(s, 'two_swords')).toEqual({ counter: 0.1, feint: 0.1 });
    expect(chooseTechniqueDrafts(s, 'two_swords', 30, 1)).toEqual([]); // chosen once
  });
});

describe('aura (ch. 12b: morale and choices only)', () => {
  function strongLi(): GameState {
    const s = startGmGame();
    const c = s.characters[s.liId];
    c.stats = { LEA: 80, VAL: 80, INT: 80, POL: 60 };
    c.styles.two_swords = 80;
    return s;
  }
  it('a much weaker foe hesitates; a much stronger one weighs on Li', () => {
    expect(auraDuel(strongLi(), 20, 20).foeHesitates).toBe(2);
    expect(auraDuel(startGmGame(), 90, 90).liFatigue).toBe(1);
    const r = duelRound(duel({ foeHesitates: 1 }), 'attack');
    expect(r.lines.join(' ')).toMatch(/hesitates/);
    expect(r.state.foe.history).toEqual(['observe']);
  });

  it('in battle, the enemy facing Li falters in the first phase; Iron Wall and Gale March change his unit', () => {
    const setup = (abilities: string[], shock: number) => createBattle({ id: 'b', name: 'B', place: 'p', ally: [{ sector: 'center', name: 'A', men: 500 }], enemy: [{ sector: 'center', name: 'E', men: 500 }], liSector: 'center', liMen: 100, liLeads: true, liInt: 40, liRank: 4, liLea: 60, liAbilities: abilities, liAuraShock: shock });
    const p = runPhase(setup([], -10), 'hold');
    expect(p.lines.join(' ')).toMatch(/falter/);
    expect(p.battle.units.find((u) => u.side === 'enemy')!.morale).toBeLessThan(70);
    const gale = runPhase(setup(['gale_march'], 0), 'push').battle.units.find((u) => u.side === 'enemy')!;
    const plain = runPhase(setup([], 0), 'push').battle.units.find((u) => u.side === 'enemy')!;
    expect(gale.men).toBeLessThanOrEqual(plain.men);
  });
});
