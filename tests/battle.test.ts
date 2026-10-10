import { describe, expect, it } from 'vitest';
import { gmTier } from '../ai/gm';
import { BattleState, MAX_PHASES, battleReport, battleView, commanderLost, createBattle, moraleState, ordersFor, runPhase } from '../engine/battle';
import { commitDrafts, fromSave, stateHash, toSave, today } from '../engine/engine';
import { battlePhase, battleToEnd } from '../engine/gm-battle';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { GameState } from '../engine/types';

// Battles (World Bible ch. 6b, 12b; Numbers §5).

const secs = ['left', 'center', 'right'] as const;
const field = (ally: number[], enemy: number[], leads = true) => createBattle({
  id: 'b', name: 'Test field', place: 'the plain', liSector: 'center', liMen: 100, liLeads: leads, liInt: 20, liRank: leads ? 4 : 0,
  ally: ally.map((men, k) => ({ sector: secs[k], name: `Ally ${secs[k]}`, men })),
  enemy: enemy.map((men, k) => ({ sector: secs[k], name: `Enemy ${secs[k]}`, men })),
});
const toEnd = (b: BattleState) => { while (!b.over) b = runPhase(b).battle; return b; };
const lossPct = (b: BattleState, side: 'ally' | 'enemy') => {
  const us = b.units.filter((u) => u.side === side);
  const start = us.reduce((s, u) => s + u.start, 0);
  return (start - us.reduce((s, u) => s + u.men, 0)) / start;
};

describe('the battle engine', () => {
  it('is deterministic', () => {
    expect(JSON.stringify(toEnd(field([1300, 1300, 1300], [1000, 1000, 1000])))).toBe(JSON.stringify(toEnd(field([1300, 1300, 1300], [1000, 1000, 1000]))));
  });

  it('a normal battle without a rout costs each side under ~10% (Numbers §12); it ends at night', () => {
    const b = toEnd(field([1000, 1000, 1000], [1000, 1000, 1000]));
    expect(b.phase).toBe(MAX_PHASES);
    expect(b.over?.winner).toBe('none');
    expect(lossPct(b, 'ally')).toBeLessThan(0.1);
    expect(lossPct(b, 'enemy')).toBeLessThan(0.1);
  });

  it('a much stronger army breaks the other; the router loses far more (morale breaks before men run out)', () => {
    const b = toEnd(field([2000, 2000, 2000], [1000, 1000, 1000]));
    expect(b.over?.winner).toBe('ally');
    expect(lossPct(b, 'ally')).toBeLessThan(0.06);
    expect(lossPct(b, 'enemy')).toBeGreaterThan(0.15);
    expect(lossPct(b, 'enemy')).toBeLessThan(0.5);
  });

  it('losses split 40 / 45 / 15 and the report has the canon format', () => {
    const b = toEnd(field([2000, 2000, 2000], [1000, 1000, 1000]));
    const r = battleReport(b, 'enemy');
    expect(r).toMatch(/^Battle: \d+ phases \(with a rout\) · Starting strength 3,000\nDead \d+ · Wounded \d+ · Captured \d+ · Missing \d+ · Deserted \d+\nPermanent losses \d+ · Recoverable \(wounded\) \d+ · Total \d+ \([\d.]+%\)$/);
  });

  it('an ashigaru only holds or pushes; an officer can also flank, rally and withdraw', () => {
    expect(ordersFor(field([1000], [1000], false)).map((o) => o.order)).toEqual(['hold', 'push']);
    expect(ordersFor(field([1000], [1000], true)).map((o) => o.order)).toEqual(['hold', 'push', 'flank', 'rally', 'withdraw']);
  });

  it('a flank works only where our side is stronger', () => {
    const strong = runPhase(field([1000, 1500, 1000], [1000, 1000, 1000]), 'flank');
    expect(strong.lines.join(' ')).toMatch(/swings round/);
    const weak = runPhase(field([1000, 600, 1000], [1000, 1500, 1000]), 'flank');
    expect(weak.lines.join(' ')).toMatch(/too strong there/);
  });

  it('losing a commander: −30, shatters only without a stand-in or when already broken', () => {
    const b = field([1000, 1000, 1000], [1000, 1000, 1000]);
    const hit = commanderLost(b, 'enemy1');
    const u = hit.units.find((x) => x.id === 'enemy1')!;
    expect(u.commanderAlive).toBe(false);
    expect(moraleState(u)).not.toBe('Shattered'); // stand-in takes over
  });

  it('Li sees his own sector exactly and the others as reports with a source and age', () => {
    const v = battleView(field([1000, 1000, 1000], [1000, 1000, 1000], false));
    const center = v.sectors.find((x) => x.sector === 'center')!;
    const left = v.sectors.find((x) => x.sector === 'left')!;
    expect(center.exact).toBe(true);
    expect(center.ours).toMatch(/^1,000 men/); // the host unit's 900 plus Li's 100
    expect(left.ours).toMatch(/^~/);
    expect(left.source).toMatch(/messenger · two hours old · unsure/);
  });
});

// ---------- in Game Master mode ----------

function soldierLi(): GameState {
  const s = startGmGame();
  commitDrafts(s, [
    { type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'Gochō (5) in Kurogane service' } },
    { type: 'flag', fact: 'rank', visible: false, data: { key: 'rank_level', value: 1 } },
  ]);
  return s;
}
const setup = {
  kind: 'battle', name: 'The ford at Kōri', place: 'the Kurose ford', sector: 'center',
  ally: [{ sector: 'left', name: 'Hagiwara spears', men: 2000 }, { sector: 'center', name: 'Ishizue guard', men: 2000, quality: 'veteran' }, { sector: 'right', name: 'Levy', men: 2000, quality: 'levy' }],
  enemy: [{ sector: 'left', name: 'Suiren left', men: 1000 }, { sector: 'center', name: 'Suiren center', men: 1000 }, { sector: 'right', name: 'Suiren right', men: 1000, cavalry: 0.3 }],
};

describe('battles in Game Master mode', () => {
  it('Claude sets the field; no time passes; Li leads his own Gochō unit; the memory shows the battle', () => {
    const s = soldierLi();
    const day = today(s);
    gmApply(s, parseGmTurn({ scene: 'The Suiren lines come across the ford.', summary: 'Battle.', days: 5, changes: [setup] })!);
    expect(s.battle?.liLeads).toBe(true);
    expect(s.battle?.units.find((u) => u.id === 'li')?.men).toBe(5);
    expect(today(s)).toBe(day);
    expect(gmMemoryText(s)).toMatch(/A BATTLE IS BEING FOUGHT: The ford at Kōri/);
  });

  it('phases run by the code; the end gives the report, the journal line and command merit; then Claude tells the aftermath', () => {
    const s = soldierLi();
    gmApply(s, parseGmTurn({ scene: 'They come.', summary: 'Battle.', changes: [setup] })!);
    battlePhase(s, 'push');
    expect(s.battle?.phase).toBe(1);
    battleToEnd(s);
    expect(s.battle?.over?.winner).toBe('ally');
    expect(s.flags.merit_command).toBe(4); // won 3×1 + never broke 1×1 (Gochō, size class 1)
    expect(s.journal.at(-1)?.text).toMatch(/The ford at Kōri: we won/);
    expect(gmMemoryText(s)).toMatch(/THE BATTLE IS OVER/);
    expect(gmTier(s)).toBe('complex');
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
    gmApply(s, parseGmTurn({ scene: 'The dead are counted.', summary: 'After.' })!);
    expect(s.battle).toBeNull();
  });

  it('refuses a second battle, or one without both sides', () => {
    const s = soldierLi();
    gmApply(s, parseGmTurn({ scene: 'x', summary: 'y', changes: [setup] })!);
    const r = gmApply(s, parseGmTurn({ scene: 'x', summary: 'y', changes: [setup] })!);
    expect(r.notes.join(' ')).toMatch(/already being fought/);
    const t = soldierLi();
    expect(gmApply(t, parseGmTurn({ scene: 'x', summary: 'y', changes: [{ ...setup, enemy: [] }] })!).notes.join(' ')).toMatch(/both sides/);
  });
});
