import { commandCapacity } from './rules';
// Battles (World Bible ch. 6b + 12b, Numbers §5): units in sectors, phases of part of a day, losses by strength ratio,
// morale that breaks before men run out, chain routs, pursuit, and reports outside Li's sector. Pure and deterministic:
// same battle + same orders = same result. Li commands only his own unit (size = his rank) and follows orders.

export type Side = 'ally' | 'enemy';
export type Sector = 'left' | 'center' | 'right' | 'reserve';
export type Quality = 'levy' | 'ashigaru' | 'veteran' | 'elite';
export type MoraleState = 'Steady' | 'Wavering' | 'Routing' | 'Shattered';
export type Order = 'hold' | 'push' | 'flank' | 'withdraw' | 'rally';

/** Two days of fighting (3–4 phases a day, ch. 6b); then night ends it and both sides pull back. */
export const MAX_PHASES = 8;
export const SECTORS: Sector[] = ['left', 'center', 'right', 'reserve'];
const LINE: Sector[] = ['left', 'center', 'right'];
export const QUALITY: Record<Quality, number> = { levy: 0.6, ashigaru: 1.0, veteran: 1.3, elite: 1.6 };

export interface Unit {
  id: string;
  side: Side;
  sector: Sector;
  name: string;
  commander: string;
  lea: number;
  quality: Quality;
  /** Share of cavalry (0–1): spears get +30% against it; a pursuer with ≥ 20% cavalry hurts routers more. */
  cavalry: number;
  men: number;
  start: number;
  morale: number;
  dead: number;
  wounded: number;
  captured: number;
  deserted: number;
  commanderAlive: boolean;
  standIn: boolean;
  /** Modifiers that last: high ground +0.15, fortification 0.3–0.6. */
  ground: number;
  /** Out of the fight (withdrew in order, or routed off the field). */
  gone: boolean;
  lowestMorale: number;
}

export interface BattleState {
  id: string;
  name: string;
  place: string;
  phase: number;
  /** Phases fought without the line moving (morale −5 each after 3). */
  stalled: number;
  units: Unit[];
  liUnit: string;
  /** Li leads his unit (an officer), or only fights in it (an ashigaru or a slave in the levy). */
  liLeads: boolean;
  /** Li's INT: narrows the ranges in reports. */
  liInt: number;
  /** Li's command rank level (0–9): more reports, and fresher, as he rises. */
  liRank: number;
  rallied: boolean;
  log: string[];
  /** Li's order in force, and one on its way to his men (Numbers §3: +1 phase of delay per doubling of overload). */
  liOrder?: Order;
  /** Li's command abilities (iron_wall, gale_march) and his aura's first-phase shock on the enemy in his sector. */
  liAbilities?: string[];
  liAuraShock?: number;
  pending?: { order: Order; at: number };
  over?: { winner: Side | 'none'; reason: string };
}

export interface UnitSetup { id?: string; sector: Sector; name: string; commander?: string; lea?: number; quality?: Quality; men: number; cavalry?: number; ground?: number }
export interface BattleSetup { id: string; name: string; place: string; ally: UnitSetup[]; enemy: UnitSetup[]; liSector: Sector; liMen: number; liLeads: boolean; liInt: number; liRank: number; liUnitName?: string; liLea?: number; liAbilities?: string[]; liAuraShock?: number }

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;

export function moraleState(u: Unit): MoraleState {
  if (u.morale < 0) return 'Shattered';
  if (u.morale >= 60) return 'Steady';
  if (u.morale >= 30) return 'Wavering';
  return 'Routing';
}
const MORALE_FACTOR: Record<MoraleState, number> = { Steady: 1, Wavering: 0.8, Routing: 0.3, Shattered: 0 };

const unit = (side: Side, u: UnitSetup, k: number): Unit => ({
  id: u.id ?? `${side}${k}`, side, sector: u.sector, name: u.name, commander: u.commander ?? 'its captain', lea: clamp(u.lea ?? 40, 0, 100),
  quality: u.quality ?? 'ashigaru', cavalry: clamp(u.cavalry ?? 0, 0, 1), men: Math.max(1, Math.round(u.men)), start: Math.max(1, Math.round(u.men)),
  morale: 70, dead: 0, wounded: 0, captured: 0, deserted: 0, commanderAlive: true, standIn: true, ground: clamp(u.ground ?? 0, 0, 0.6), gone: false, lowestMorale: 70,
});

/** A new battle. Li's own unit is cut out of the ally units of his sector (or added there). */
export function createBattle(b: BattleSetup): BattleState {
  const ally = b.ally.map((u, k) => unit('ally', u, k));
  const enemy = b.enemy.map((u, k) => unit('enemy', u, k));
  const host = ally.find((u) => u.sector === b.liSector);
  const liMen = Math.max(1, Math.round(b.liMen));
  if (host && host.men > liMen) { host.men -= liMen; host.start -= liMen; }
  const li: Unit = { ...unit('ally', { sector: b.liSector, name: b.liUnitName ?? "Li's unit", commander: b.liLeads ? 'Li' : 'his officer', lea: b.liLeads ? b.liLea ?? 40 : 40, men: liMen }, 99), id: 'li' };
  return {
    id: b.id, name: b.name, place: b.place, phase: 0, stalled: 0, units: [...ally, li, ...enemy], liUnit: 'li', liLeads: b.liLeads,
    liInt: b.liInt, liRank: b.liRank, rallied: false, log: [], liAbilities: b.liAbilities ?? [], liAuraShock: b.liAuraShock ?? 0,
  };
}

const inLine = (u: Unit) => !u.gone && u.sector !== 'reserve' && u.men > 0;
/** Numbers §3 overload o = men ÷ capacity (at least 1). */
export const overloadOf = (u: Unit) => Math.max(1, u.men / commandCapacity(u.lea));
// Commander factor 1 + (LEA − 50) ÷ 200, reduced by overload (PROVISIONAL Oct 17: −10% per doubling, owner kan terugdraaien).
const strengthOf = (u: Unit, mods: number) => u.men * QUALITY[u.quality] * (1 + (u.lea - 50) / 200) / (1 + 0.1 * Math.log2(overloadOf(u))) * MORALE_FACTOR[moraleState(u)] * (1 + mods);
/** Numbers §3: morale losses × (1 + 0.5 × log₂ o) for an overloaded commander. */
const lossShock = (u: Unit, n: number, half = false) => shock(u, Math.round(-5 * Math.floor((n / Math.max(1, u.men + n)) / 0.05) * (1 + 0.5 * Math.log2(overloadOf(u))) * (half ? 0.5 : 1)));
const cavalryShare = (us: Unit[]) => { const men = us.reduce((s, u) => s + u.men, 0); return men ? us.reduce((s, u) => s + u.men * u.cavalry, 0) / men : 0; };

/** Losses to one unit, split by Numbers §5 (40% dead · 45% wounded · 15% captured or missing). */
function hurt(u: Unit, n: number) {
  const lost = Math.min(u.men, Math.max(0, Math.round(n)));
  if (!lost) return 0;
  const dead = Math.round(lost * 0.4);
  const wounded = Math.round(lost * 0.45);
  u.dead += dead;
  u.wounded += wounded;
  u.captured += lost - dead - wounded;
  u.men -= lost;
  return lost;
}

const shock = (u: Unit, pts: number) => { if (moraleState(u) !== 'Shattered') { u.morale = clamp(u.morale + pts, 0, 100); u.lowestMorale = Math.min(u.lowestMorale, u.morale); } };

/** One phase. `order` is Li's order for his unit (an ashigaru can only hold or push). Returns what happened, in lines. */
export function runPhase(b0: BattleState, order: Order = 'hold'): { battle: BattleState; lines: string[] } {
  const b: BattleState = structuredClone(b0);
  if (b.over) return { battle: b, lines: [] };
  b.phase++;
  const lines: string[] = [];
  const li = b.units.find((u) => u.id === b.liUnit)!;
  const asked: Order = b.liLeads || order === 'hold' || order === 'push' ? order : 'hold';
  // Overload delays orders: a new order reaches a too-big unit only after floor(log₂ o) phases (Numbers §3).
  const delay = b.liLeads ? Math.floor(Math.log2(overloadOf(li))) : 0;
  if (b.pending && b.phase >= b.pending.at) { b.liOrder = b.pending.order; b.pending = undefined; }
  if (b.liOrder === undefined) b.liOrder = asked; // the first order is given before the lines meet
  else if (asked !== (b.pending?.order ?? b.liOrder)) {
    if (delay > 0) { b.pending = { order: asked, at: b.phase + delay }; lines.push(`Li's order goes down the line; a unit this size needs time to answer (${delay} phase${delay > 1 ? 's' : ''}).`); }
    else { b.liOrder = asked; b.pending = undefined; }
  }
  const o: Order = b.liOrder ?? asked;
  const routedBefore = new Set(b.units.filter((u) => moraleState(u) === 'Routing').map((u) => u.id));

  // Li's order.
  if (o === 'withdraw' && inLine(li)) { hurt(li, li.men * 0.03); li.gone = true; lines.push(`Li's unit withdraws in order.`); }
  if (o === 'rally' && !b.rallied) {
    b.rallied = true;
    for (const u of b.units.filter((x) => x.side === 'ally' && x.sector === li.sector && !x.gone)) shock(u, u.id === li.id ? 15 : 8);
    lines.push('Li steadies the line: his men and the units beside him take heart.');
  }

  // Aura (WB ch. 5, 12b): when Li leads, the enemy facing him feels it in the first phase (morale only, never strength).
  if (b.phase === 1 && b.liAuraShock && b.liLeads) {
    for (const u of b.units.filter((x) => x.side === 'enemy' && x.sector === li.sector && inLine(x))) shock(u, b.liAuraShock);
    lines.push('The men facing Li\'s unit feel something in him and falter.');
  }
  let moved = false;
  for (const sector of LINE) {
    const allies = b.units.filter((u) => u.side === 'ally' && u.sector === sector && inLine(u));
    const enemies = b.units.filter((u) => u.side === 'enemy' && u.sector === sector && inLine(u));
    if (!allies.length || !enemies.length) continue;
    const pushing = o === 'push' && li.sector === sector && inLine(li);
    const flanking = o === 'flank' && li.sector === sector && inLine(li);
    const mod = (u: Unit, foes: Unit[]) => u.ground + (cavalryShare(foes) >= 0.2 && u.quality !== 'levy' && u.cavalry === 0 ? 0.3 * cavalryShare(foes) : 0)
      + (u.id === li.id && pushing ? ((b.liAbilities ?? []).includes('gale_march') ? 0.3 : 0.15) : 0);
    let A = allies.reduce((s, u) => s + strengthOf(u, mod(u, enemies)), 0);
    let E = enemies.reduce((s, u) => s + strengthOf(u, mod(u, allies)), 0);
    if (flanking) {
      if (A >= E) { A *= 1.2; for (const u of enemies) shock(u, -15); lines.push(`Li's unit swings round the ${sector} flank: the enemy there reels.`); moved = true; }
      else { lines.push(`Li tries to flank on the ${sector}, but the enemy is too strong there: his unit is caught in the open.`); A *= 0.9; }
    }
    if (!A && !E) continue;
    const strongAlly = A >= E;
    const r = Math.max(A, E) / Math.max(1e-9, Math.min(A, E));
    const weakLoss = A === E ? 0.011 : Math.min(0.05, 0.015 * Math.sqrt(r));
    const strongLoss = A === E ? 0.011 : 0.0075 / Math.sqrt(r);
    for (const u of allies) {
      const pct = (strongAlly ? strongLoss : weakLoss) * (u.id === li.id && pushing ? 1.3 : 1) * (u.id === li.id && flanking && !strongAlly ? 1.5 : 1);
      const n = hurt(u, u.men * pct);
      lossShock(u, n, u.id === li.id && (b.liAbilities ?? []).includes('iron_wall'));
    }
    for (const u of enemies) {
      const n = hurt(u, u.men * (strongAlly ? weakLoss : strongLoss));
      lossShock(u, n);
    }
    // Giving ground costs morale (the line gives ground): −5, or −10 when badly outmatched.
    if (r >= 1.15) {
      moved = true;
      for (const u of strongAlly ? enemies : allies) shock(u, r >= 2.5 ? -10 : -5);
    }
    const pick = (xs: string[]) => xs[(b.phase + LINE.indexOf(sector)) % xs.length]; // varied, but fixed: no chance
    const how = r < 1.15
      ? pick(['the lines grind against each other', 'spear against spear, neither side gives a step', 'the dead pile up and nobody moves', 'shoving, stabbing, holding'])
      : strongAlly
        ? (r >= 2 ? pick(['our men drive them back hard', 'their line bends and gives', 'they are being pushed into the mud'])
          : pick(['our side presses forward', 'we gain a few bloody paces', 'their front rank wavers under our pressure']))
        : (r >= 2 ? pick(['our line is being driven back', 'our men give ground fast', 'the enemy is breaking through'])
          : pick(['the enemy presses our line back', 'we lose a few paces', 'our front rank bends']));
    lines.push(`${cap(sector)}: ${how}.`);
  }

  // Long fight with no progress (3+ phases): everyone tires (−3 per phase; Numbers §5 says −5, softened so that two
  // equal armies pull back at night instead of breaking together — owner question).
  b.stalled = moved ? 0 : b.stalled + 1;
  if (b.stalled >= 3) for (const u of b.units.filter(inLine)) shock(u, -3);

  // Routing units: pursuit losses, and they lower their neighbours (chain rout).
  for (const u of b.units.filter((x) => !x.gone && moraleState(x) === 'Routing')) {
    const foes = b.units.filter((x) => x.side !== u.side && inLine(x));
    hurt(u, u.men * (0.1 + (cavalryShare(foes) >= 0.2 ? 0.1 : 0)));
    if (!routedBefore.has(u.id)) {
      lines.push(`${u.name} breaks and runs!`);
      for (const n of b.units.filter((x) => x.side === u.side && x.id !== u.id && !x.gone && adjacent(x.sector, u.sector))) shock(n, -10);
    }
    if (u.men <= 0 || u.morale < 10) u.gone = true;
  }
  // A collapsing flank exposes its neighbours (ch. 6b): where one side has nobody standing and the other does, the
  // first side's units in the next sector are flanked (−15).
  for (const side of ['ally', 'enemy'] as Side[]) {
    const other: Side = side === 'ally' ? 'enemy' : 'ally';
    for (const sector of LINE) {
      const ours = b.units.some((u) => u.side === side && u.sector === sector && inLine(u) && moraleState(u) !== 'Routing');
      const theirs = b.units.some((u) => u.side === other && u.sector === sector && inLine(u) && moraleState(u) !== 'Routing');
      if (ours || !theirs) continue;
      const exposed = b.units.filter((u) => u.side === side && inLine(u) && u.sector !== sector && adjacent(u.sector, sector));
      if (exposed.length) { for (const u of exposed) shock(u, -15); lines.push(`The ${sector} has collapsed: ${side === 'ally' ? 'our' : 'their'} next units are flanked.`); }
    }
  }
  // Rally: a router back at ≥ 45 returns as Wavering (fixed: no chance).
  for (const u of b.units.filter((x) => !x.gone && routedBefore.has(x.id) && x.morale >= 45)) { u.morale = Math.min(u.morale, 59); lines.push(`${u.name} rallies.`); }
  // Reserves fill a broken sector.
  for (const side of ['ally', 'enemy'] as Side[]) {
    for (const sector of LINE) {
      const holding = b.units.some((u) => u.side === side && u.sector === sector && inLine(u) && moraleState(u) !== 'Routing');
      const reserve = b.units.find((u) => u.side === side && u.sector === 'reserve' && !u.gone && u.men > 0);
      if (!holding && reserve) { reserve.sector = sector; lines.push(`${side === 'ally' ? 'Our' : 'The enemy'} reserve moves up to the ${sector}.`); }
    }
  }

  // The end: a side with nothing left in the line that is not routing, or nearly everyone gone.
  const standing = (side: Side) => b.units.filter((u) => u.side === side && !u.gone && u.men > 0 && moraleState(u) !== 'Routing' && moraleState(u) !== 'Shattered');
  const allyUp = standing('ally').length > 0;
  const enemyUp = standing('enemy').length > 0;
  if (!allyUp || !enemyUp) {
    b.over = !allyUp && !enemyUp ? { winner: 'none', reason: 'both armies broke' } : { winner: allyUp ? 'ally' : 'enemy', reason: allyUp ? 'the enemy army broke and fled' : 'our army broke and fled' };
  } else if (b.phase >= MAX_PHASES) b.over = { winner: 'none', reason: 'night falls on a battle neither side could win; both pull back' };
  if (b.over) lines.push(b.over.winner === 'ally' ? 'Victory: the enemy breaks.' : b.over.winner === 'enemy' ? 'Defeat: our army breaks.' : `The battle ends: ${b.over.reason}.`);
  b.log.push(...lines.map((l) => `Phase ${b.phase}: ${l}`));
  return { battle: b, lines };
}

const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const adjacent = (a: Sector, b: Sector) => a === b || (a === 'center') !== (b === 'center');

/** The enemy commander of a unit fell (a duel Li won, an arrow): −30 to that unit; it shatters only if it was already wavering or has no stand-in (ch. 12b #5). */
export function commanderLost(b0: BattleState, unitId: string): BattleState {
  const b: BattleState = structuredClone(b0);
  const u = b.units.find((x) => x.id === unitId);
  if (!u || !u.commanderAlive) return b;
  const wasWavering = moraleState(u) !== 'Steady';
  u.commanderAlive = false;
  shock(u, -30);
  if (!u.standIn || (wasWavering && u.morale < 30)) { u.morale = -1; u.gone = true; b.log.push(`Phase ${b.phase}: ${u.name} loses its commander and shatters.`); }
  else { b.log.push(`Phase ${b.phase}: ${u.name} loses its commander; a stand-in takes over.`); shock(u, 10); }
  return b;
}

// ---------- what Li sees (WB 6b, 12b #6): his sector exact, the rest as reports with source, age and confidence ----------

export interface SectorView { sector: Sector; ours: string; theirs: string; source: string; exact: boolean }
export interface BattleView { title: string; phase: number; li: { men: number; start: number; morale: MoraleState; losses: number }; sectors: SectorView[] }

const round50 = (n: number) => Math.max(0, Math.round(n / 50) * 50);
/** A range around the truth, narrower with INT and fresher with rank. Deterministic. */
function estimate(n: number, int: number, wide: number): string {
  if (n <= 0) return 'none';
  const spread = clamp(wide - int / 400, 0.05, wide);
  const lo = round50(n * (1 - spread));
  const hi = Math.max(lo + 50, round50(n * (1 + spread)));
  return `~${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')}`;
}

export function battleView(b: BattleState): BattleView {
  const li = b.units.find((u) => u.id === b.liUnit)!;
  const men = (side: Side, sector: Sector) => b.units.filter((u) => u.side === side && u.sector === sector && !u.gone).reduce((s, u) => s + u.men, 0);
  const worst = (side: Side, sector: Sector) => {
    const us = b.units.filter((u) => u.side === side && u.sector === sector && !u.gone);
    return us.length ? us.map(moraleState).sort((x, y) => ['Steady', 'Wavering', 'Routing', 'Shattered'].indexOf(y) - ['Steady', 'Wavering', 'Routing', 'Shattered'].indexOf(x))[0] : '';
  };
  const age = b.liRank >= 4 ? 'fresh' : b.liRank >= 2 ? 'an hour old' : 'two hours old';
  const sectors: SectorView[] = SECTORS.filter((x) => men('ally', x) || men('enemy', x)).map((sector) => {
    const exact = sector === li.sector;
    return {
      sector, exact,
      ours: exact ? `${men('ally', sector).toLocaleString('en-US')} men · ${worst('ally', sector)}` : `${estimate(men('ally', sector), b.liInt, 0.15)} · ${worst('ally', sector)}`,
      theirs: `${estimate(men('enemy', sector), b.liInt, exact ? 0.15 : 0.3)}${exact ? ` · ${worst('enemy', sector)}` : ''}`,
      source: exact ? 'seen with his own eyes' : sector === 'reserve' ? `orders from the rear · ${age}` : `a messenger · ${age} · ${b.liRank >= 3 ? 'fairly sure' : 'unsure'}`,
    };
  });
  return {
    title: b.name, phase: b.phase,
    li: { men: li.men, start: li.start, morale: moraleState(li), losses: li.start - li.men },
    sectors,
  };
}

/** The battle report in the canon format (Numbers §5), for one side. */
export function battleReport(b: BattleState, side: Side = 'ally'): string {
  const us = b.units.filter((u) => u.side === side);
  const start = us.reduce((s, u) => s + u.start, 0);
  const sum = (k: 'dead' | 'wounded' | 'captured' | 'deserted') => us.reduce((s, u) => s + u[k], 0);
  const captured = Math.round(sum('captured') * 0.6);
  const missing = sum('captured') - captured;
  const permanent = sum('dead') + sum('captured') + sum('deserted');
  const total = permanent + sum('wounded');
  const routed = us.some((u) => u.lowestMorale < 30);
  return [
    `Battle: ${b.phase} phases (${routed ? 'with a rout' : 'no rout'}) · Starting strength ${start.toLocaleString('en-US')}`,
    `Dead ${sum('dead')} · Wounded ${sum('wounded')} · Captured ${captured} · Missing ${missing} · Deserted ${sum('deserted')}`,
    `Permanent losses ${permanent} · Recoverable (wounded) ${sum('wounded')} · Total ${total} (${r1((total / Math.max(1, start)) * 100)}%)`,
  ].join('\n');
}

/** Orders Li may give: an officer leads his unit; an ashigaru (or a slave in the levy) follows orders and fights. */
export function ordersFor(b: BattleState): { order: Order; label: string; risk?: string }[] {
  const li = b.units.find((u) => u.id === b.liUnit)!;
  if (b.over || !inLine(li)) return [];
  const base = [
    { order: 'hold' as Order, label: b.liLeads ? 'Hold the line' : 'Hold your place in the line' },
    { order: 'push' as Order, label: b.liLeads ? 'Press the attack' : 'Fight hard at the front', risk: 'more losses' },
  ];
  if (!b.liLeads) return base;
  return [
    ...base,
    { order: 'flank' as Order, label: 'Swing round their flank', risk: 'only works if our side is the stronger here' },
    ...(b.rallied ? [] : [{ order: 'rally' as Order, label: 'Rally the men (once)' }]),
    { order: 'withdraw' as Order, label: 'Withdraw in order', risk: 'the line beside you may break' },
  ];
}
