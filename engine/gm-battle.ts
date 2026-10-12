import { BattleState, MAX_PHASES, Order, Quality, Sector, UnitSetup, battleReport, battleView, createBattle, ordersFor, runPhase } from './battle';
import { meritOf, rankInfo } from './career';
import { careerOf } from './gm-career';
import { commitDrafts, has, li } from './engine';
import { Draft, GameEvent, GameState } from './types';

// Battles in Game Master mode (World Bible ch. 6b): Claude sets the field (who, where, how many); the code runs every
// phase with the player's orders for Li's own unit; Claude tells the aftermath true to the result. Every phase is an event
// holding the battle's state, so a save replays it exactly. Pure.

const SECTOR_SET: Sector[] = ['left', 'center', 'right', 'reserve'];
const QUALITY_SET: Quality[] = ['levy', 'ashigaru', 'veteran', 'elite'];
const str = (x: unknown, max = 60) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : Number(x) || 0);

function units(raw: unknown): UnitSetup[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object').slice(0, 8).map((x: Record<string, unknown>) => ({
    sector: SECTOR_SET.includes(x.sector as Sector) ? (x.sector as Sector) : 'center',
    name: str(x.name) || 'a unit',
    commander: str(x.commander) || undefined,
    lea: Math.max(0, Math.min(100, num(x.lea) || 40)),
    quality: QUALITY_SET.includes(x.quality as Quality) ? (x.quality as Quality) : 'ashigaru',
    men: Math.max(1, Math.min(250_000, Math.round(num(x.men)))),
    cavalry: Math.max(0, Math.min(1, num(x.cavalry))),
    ground: Math.max(0, Math.min(0.6, num(x.ground))),
  })).filter((u) => u.men > 0);
}

/** Li's own unit: what he leads (his rank's unit), or the unit he fights in (an ashigaru, a slave in the levy). */
function liUnit(s: GameState): { men: number; leads: boolean; name: string } {
  const car = careerOf(s);
  if (li(s).status === 'slave') return { men: 50, leads: false, name: 'the levy bearers' };
  if (car.rank === 'ashigaru') return { men: 100, leads: false, name: "Li's company" };
  const r = rankInfo(car.rank);
  return { men: Math.max(5, r.min), leads: true, name: `Li's ${r.title}` };
}

/** A battle Claude sets up. Refused while a fight or another battle is on, or when either side has nobody. */
export function battleStartDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (s.battle && !s.battle.over) { notes.push('a battle is already being fought'); return []; }
  if (s.duel && !s.duel.over) { notes.push('a battle cannot start during a fight'); return []; }
  const ally = units(x.ally);
  const enemy = units(x.enemy);
  if (!ally.length || !enemy.length) { notes.push('a battle needs units on both sides'); return []; }
  const u = liUnit(s);
  const b = createBattle({
    id: `battle_${s.nextSeq}`, name: str(x.name, 80) || 'A battle', place: str(x.place, 80) || li(s).location,
    ally, enemy, liSector: SECTOR_SET.includes(x.sector as Sector) && x.sector !== 'reserve' ? (x.sector as Sector) : 'center',
    liMen: u.men, liLeads: u.leads, liInt: li(s).stats.INT, liRank: has(s, 'rank_level'), liUnitName: u.name,
  });
  return [{ type: 'battle', fact: `Battle: ${b.name}`, visible: true, data: { battle: b } }];
}

/** One phase with Li's order: the code decides it. When the battle ends: the report, Li's journal and his command merit. */
export function battlePhase(s: GameState, order: Order): GameEvent[] {
  const b = s.battle;
  if (!b || b.over) return [];
  const allowed = ordersFor(b).map((o) => o.order);
  const { battle, lines } = runPhase(b, allowed.includes(order) ? order : 'hold');
  const drafts: Draft[] = [{ type: 'battle', fact: lines.join(' ') || `Phase ${battle.phase}.`, visible: true, data: { battle, order } }];
  if (battle.over) drafts.push(...battleEndDrafts(s, battle));
  return commitDrafts(s, drafts);
}

/** Fight on with "hold" until the battle ends (unimportant battles, or "simulate to the end"). */
export function battleToEnd(s: GameState): GameEvent[] {
  const out: GameEvent[] = [];
  for (let k = 0; k < MAX_PHASES + 1 && s.battle && !s.battle.over; k++) out.push(...battlePhase(s, 'hold'));
  return out;
}

function battleEndDrafts(s: GameState, b: BattleState): Draft[] {
  const me = b.units.find((u) => u.id === b.liUnit)!;
  const won = b.over!.winner === 'ally';
  const out: Draft[] = [{
    type: 'story', fact: `${b.name} is over: ${b.over!.reason}.\n${battleReport(b, 'ally')}`, visible: true,
    journal: `${b.name}: ${won ? 'we won' : b.over!.winner === 'enemy' ? 'we were beaten' : 'nobody won'}. My unit lost ${me.start - me.men} of ${me.start}.`,
    data: { battleEnd: b.id, winner: b.over!.winner },
  }];
  // Command merit for the unit Li leads (Numbers §6): won · never routed. Confirmed by the code, not proposed.
  if (b.liLeads && li(s).status !== 'slave') {
    const car = careerOf(s);
    const deeds = [...(won ? ['won' as const] : []), ...(me.lowestMorale >= 30 ? ['steady_morale' as const] : [])];
    const merit = deeds.reduce((sum, d) => sum + meritOf({ kind: 'command', deed: d, unit: car.rank }).amount, 0);
    if (merit) out.push({ type: 'flag', fact: `command merit +${merit} (${b.name}: ${deeds.join(', ').replace('steady_morale', 'the unit never broke')})`, visible: true, data: { key: 'merit_command', value: has(s, 'merit_command') + merit } });
  }
  return out;
}

/** The battle block of Claude's memory: what is on now, or the result to tell. */
export function battleText(s: GameState): string {
  const b = s.battle;
  if (!b) return '';
  const v = battleView(b);
  const sectors = v.sectors.map((x) => `- ${x.sector}: ours ${x.ours}; theirs ${x.theirs} (${x.source})`).join('\n');
  if (!b.over) {
    return `A BATTLE IS BEING FOUGHT: ${b.name} at ${b.place}, phase ${b.phase} of at most ${MAX_PHASES}. The code runs each phase with the player's order for Li's unit; tell only what Li sees and does now, never the outcome. Li's unit: ${v.li.men} of ${v.li.start} men, ${v.li.morale}.\n${sectors}\nLast phases:\n${b.log.slice(-6).join('\n')}`;
  }
  return `THE BATTLE IS OVER (decided by the code): ${b.name}: ${b.over.reason}. Li's unit kept ${v.li.men} of ${v.li.start} men.\n${battleReport(b, 'ally')}\nTell the aftermath true to this result (the wounded, the dead, who saw what Li did, what comes next).`;
}

/** After the first scene that follows a finished battle, the field is cleared. */
export function battleClearDrafts(s: GameState): Draft[] {
  return s.battle?.over ? [{ type: 'battle', fact: 'The battlefield is cleared.', visible: false, data: { battle: null } }] : [];
}
