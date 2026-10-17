import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, gmTimeDrafts, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts } from '../engine/engine';
import { injuriesOf, injuryDrafts } from '../engine/engine';
import { monthlyPay } from '../engine/pay';
import { betrayalRisk, loyaltyOf, obedienceOf, openPromises, stance } from '../engine/loyalty';
import { duelRound, DuelState } from '../engine/duel';
import { createBattle, runPhase, overloadOf } from '../engine/battle';
import type { GameState } from '../engine/types';

// Block A of Phase 6 (audit gaps 11, 12, 13, 20, 22): pay, loyalty, promises, permanent injury, command overload.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });

function freeSoldier(rank = 0): GameState {
  const s = startGmGame();
  s.characters[s.liId].status = 'free';
  s.flags.levy_service = 1;
  s.flags.rank_level = rank;
  return s;
}

describe('soldier pay (Numbers §7)', () => {
  it('a free ashigaru in service is paid each month; a slave is not', () => {
    const s = freeSoldier();
    expect(monthlyPay(s)).toBe(208); // 2.5 ryō a year ÷ 12
    const before = s.money;
    commitDrafts(s, gmTimeDrafts(s, 45));
    expect(s.money - before).toBeGreaterThanOrEqual(208);
    expect(monthlyPay(startGmGame())).toBe(0);
  });
});

describe('promises (Numbers §8)', () => {
  it('a promise is tracked; keeping it raises trust, breaking it leaves a permanent scar', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'promise', npc: 'hachi', text: 'I will come back for you', outcome: 'made' }] }));
    expect(openPromises(s)).toHaveLength(1);
    expect(gmMemoryText(s)).toMatch(/LI'S OPEN PROMISES/);
    const t0 = s.relations.hachi.base.trust;
    gmApply(s, scene({ changes: [{ kind: 'promise', npc: 'hachi', outcome: 'broken' }] }));
    expect(openPromises(s)).toHaveLength(0);
    const scar = s.relations.hachi.mods.filter((m) => m.fadeDays === null && m.value < 0);
    expect(scar.reduce((a, m) => a + m.value, 0)).toBe(-12.5);
    expect(t0).toBe(s.relations.hachi.base.trust);
    expect(gmApply(s, scene({ changes: [{ kind: 'promise', npc: 'hachi', outcome: 'kept' }] })).notes.join(' ')).toMatch(/no open promise/);
  });
});

describe('loyalty, obedience and betrayal (Numbers §8)', () => {
  it('a cold man under a weak, beaten Li is a betrayal risk, and the code opens the threat by itself', () => {
    const s = freeSoldier(1);
    gmApply(s, scene({ changes: [{ kind: 'person', id: 'jubei', name: 'Jūbei', role: 'Gochō under Li', desc: 'x', goal: 'x', affection: 10, trust: 10 }] }));
    s.relations.jubei.base = { trust: 10, respect: 10, affection: 10, fear: 0, rivalry: 30 };
    s.characters[s.liId].wound = 2;
    s.characters[s.liId].healDays = 60;
    expect(loyaltyOf(s, 'jubei')).toBeLessThan(40);
    expect(obedienceOf(s, 'jubei')).toBeLessThan(50);
    expect(stance(loyaltyOf(s, 'jubei'), obedienceOf(s, 'jubei'))).toMatch(/betrayal risk/);
    s.flags.civil_war_kurogane = 1;
    expect(betrayalRisk(s, 'jubei')).toBe(true);
    commitDrafts(s, gmTimeDrafts(s, 31));
    expect(s.gm!.clocks!.some((c) => c.id === 'betray_jubei' && c.open)).toBe(true);
    expect(gmMemoryText(s)).toMatch(/WOULD BETRAY NOW/);
  });

  it('fear makes men obey even when they do not love Li', () => {
    const s = freeSoldier(3);
    gmApply(s, scene({ changes: [{ kind: 'person', id: 'goro', name: 'Gorō', role: "Li's lieutenant", desc: 'x', goal: 'x' }] }));
    s.relations.goro.base = { trust: 20, respect: 30, affection: 10, fear: 90, rivalry: 0 };
    expect(obedienceOf(s, 'goro')).toBeGreaterThanOrEqual(50);
    expect(stance(loyaltyOf(s, 'goro'), obedienceOf(s, 'goro'))).toMatch(/obeys while watched/);
  });
});

describe('permanent injury (Numbers §4)', () => {
  it('only a Badly wounded hit with a gap above 100% leaves one; the area follows the attack', () => {
    const f = (id: string, val: number) => ({ id, name: id, val, mastery: 10, wound: 0 as const, fatigue: 0, observed: 0, history: [] });
    const d: DuelState = { id: 't', round: 0, li: f('Li', 60), foe: f('foe', 10), prefs: { attack: 0, counter: 0, feint: 0, observe: 5 }, surprise: false, over: false };
    const r = duelRound(d, 'attack');
    expect(r.state.foe.injury).toBe('sword arm');
    expect(r.lines.join(' ')).toMatch(/never be the same/);
    const even: DuelState = { ...d, foe: f('foe', 55) };
    expect(duelRound(even, 'attack').state.foe.injury).toBeUndefined();
  });

  it('Li\'s injury is recorded and costs VAL', () => {
    const s = startGmGame();
    const val = s.characters[s.liId].stats.VAL;
    commitDrafts(s, injuryDrafts(s, s.liId, 'leg'));
    expect(injuriesOf(s, s.liId)).toEqual(['leg']);
    expect(s.characters[s.liId].stats.VAL).toBe(val - 1);
    expect(injuryDrafts(s, s.liId, 'leg')).toEqual([]); // once only
  });
});

describe('command overload (Numbers §3)', () => {
  const setup = (liLea: number) => createBattle({ id: 'b', name: 'B', place: 'p', ally: [{ sector: 'center', name: 'A', men: 1000 }], enemy: [{ sector: 'center', name: 'E', men: 1000 }], liSector: 'center', liMen: 300, liLeads: true, liInt: 20, liRank: 5, liLea });
  it('a weak commander of a big unit is overloaded and his new orders arrive late', () => {
    const b = setup(15);
    const li = b.units.find((u) => u.id === 'li')!;
    expect(overloadOf(li)).toBeGreaterThan(4);
    const p1 = runPhase(b, 'hold');
    const p2 = runPhase(p1.battle, 'push');
    expect(p2.lines.join(' ')).toMatch(/needs time to answer/);
    expect(p2.battle.liOrder).toBe('hold');
  });
  it('a strong commander is not overloaded: orders act at once', () => {
    const b = setup(70);
    expect(overloadOf(b.units.find((u) => u.id === 'li')!)).toBe(1);
    const p2 = runPhase(runPhase(b, 'hold').battle, 'push');
    expect(p2.battle.liOrder).toBe('push');
  });
});
