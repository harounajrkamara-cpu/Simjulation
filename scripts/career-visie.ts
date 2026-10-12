// Career pace vs the owner's VISIE age targets (docs/VISIE.md §4) and the Numbers §12 rank ages.
// The approved rules are used read-only (engine/rules.ts): gain = base × age × room × challenge, training cap per stat per
// season (Numbers §2), merit, weights and thresholds (Numbers §6). No dice: three fixed policies, a fixed event mix per life
// stage, fixed days in the year. Everything marked ASSUMPTION is this sim's event mix, not canon.
// Run: npx tsx scripts/career-visie.ts            (add --engine to also measure the real stage-1 engine)
import { ageOn, dateFromIndex, dayIndex } from '../engine/calendar';
import { createWorld } from '../engine/data';
import { RANK_BANDS, SEASON_TRAINING_CAP, ageFactor, challengeFactor, commandCapacity, growthGain, r3, rankLetter } from '../engine/rules';

export type Policy = 'cautious' | 'normal' | 'strong';
export const POLICIES: Policy[] = ['cautious', 'normal', 'strong'];
export type Stage = 'slave' | 'soldier' | 'officer' | 'general';

/** Numbers §2 base gain per event. */
export const BASE = {
  trainAlone: 0.02, trainTeacher: 0.05, study: 0.02, fight: 0.4, duelWon: 1.0, lead: 0.8, battleWon: 1.0,
  plan: 0.8, talk: 0.6, govern: 0.5, nearDeath: 1.5,
};
export type BaseKey = keyof typeof BASE;

/** WB ch. 4 men · Numbers §6 size class, score needed to reach the rank, weights (combat, command, political) by target rank. */
export const RANKS = [
  { name: 'Ashigaru', men: 1, size: 0, need: 0, w: [0, 0, 0] },
  { name: 'Gochō', men: 5, size: 1, need: 15, w: [0.6, 0.3, 0.1] },
  { name: 'Kogashira', men: 10, size: 2, need: 40, w: [0.6, 0.3, 0.1] },
  { name: 'Gojū-gashira', men: 50, size: 3, need: 100, w: [0.35, 0.5, 0.15] },
  { name: 'Hyakunin-gashira', men: 100, size: 4, need: 220, w: [0.35, 0.5, 0.15] },
  { name: 'Sanbyakunin-shō', men: 300, size: 5, need: 450, w: [0.15, 0.6, 0.25] },
  { name: 'Sennin-shō', men: 1000, size: 6, need: 900, w: [0.15, 0.6, 0.25] },
  { name: 'Gosennin-shō', men: 5000, size: 7, need: 1800, w: [0.05, 0.55, 0.4] },
  { name: 'Taishō', men: 10000, size: 8, need: 3500, w: [0.05, 0.55, 0.4] },
  { name: 'Dai-Shōgun', men: 50000, size: 8, need: 7000, w: [0.05, 0.45, 0.5] },
] as const;
const LAND_RANK = 5; // Numbers §7: land (a village) from Sanbyakunin-shō
const BARRIER = 1.0; // Numbers §6: Kurogane merit law ×1.0
const MERIT_FOR_FREEDOM = 30; // Numbers §6: 30 combat + command merit in Kurogane service, or a Kogashira+ head
const HEAD_MERIT = [0, 3, 3, 10, 25, 60, 120]; // Numbers §6 heads by foe Warrior band F..S (band → officer rank: ASSUMPTION)
const TALK_MERIT = 10; // Numbers §6 negotiation won 5–30 (ASSUMPTION: 10)
const GOVERN_MERIT = 5; // Numbers §6 good governance per season

/** Event mix per life stage (ASSUMPTION). Rates are per year unless said; fractions are spread over the years in a fixed way. */
export interface Mix {
  val: [number, number]; // VAL training: days per season, base (alone 0.02 / with a teacher 0.05)
  style: [number, number]; // style training: days per season, base
  study: number; // INT study days per season (0.02)
  fights: number; // real fights survived (skirmishes, raids), spring–autumn
  kills: number; // witnessed enemy ashigaru per fight or battle (combat merit 1 each)
  duels: number; // officer duels offered, summer–autumn (taken only within `up`, and then won)
  up: number; // rank steps above his own Warrior rank he takes on: +1 strong, 0 normal
  battles: number; // battles his unit fights, summer–autumn
  won: number; // share of those battles won
  plans: number; // successful plans or ambushes
  talks: number; // negotiations won (winter)
}

const T = BASE.trainTeacher;
const A = BASE.trainAlone;
const m = (val: [number, number], style: [number, number], study: number, fights: number, kills: number, duels: number, up: number,
  battles: number, won: number, plans: number, talks: number): Mix => ({ val, style, study, fights, kills, duels, up, battles, won, plans, talks });

export const MIX: Record<Stage, Record<Policy, Mix>> = {
  // Slave: night training alone, the drill ground by day, Sukezō's letters; levy skirmishes at the ford; officers only when offered.
  slave: {
    cautious: m([20, A], [15, A], 10, 4, 0.25, 0, 0, 0, 0, 0, 0),
    normal: m([45, A], [30, A], 20, 8, 0.5, 2, 0, 0, 0, 0, 0),
    strong: m([90, A], [45, A], 30, 12, 0.75, 2, 1, 0, 0, 0, 0),
  },
  // Soldier (Ashigaru – Kogashira): drill with the unit, a sword teacher for the strong, two campaigns a year.
  soldier: {
    cautious: m([45, A], [30, A], 15, 3, 0.5, 0, 0, 2, 0.5, 0.25, 0),
    normal: m([60, A], [45, A], 20, 6, 0.75, 1, 0, 3, 2 / 3, 0.5, 0),
    strong: m([45, T], [45, T], 30, 10, 1, 2, 1, 4, 0.75, 1, 0),
  },
  // Officer (Gojū-gashira – Sanbyakunin-shō): less own training, more maps and books, still fights in front.
  officer: {
    cautious: m([20, A], [20, A], 20, 1, 0, 0, 0, 2, 0.5, 0.5, 0.25),
    normal: m([30, A], [30, A], 30, 3, 0.5, 0.5, 0, 3, 2 / 3, 1, 0.25),
    strong: m([30, T], [30, T], 45, 4, 1, 1, 1, 4, 0.75, 2, 0.5),
  },
  // General (Sennin-shō and up): commands, plans, negotiates; rarely fights himself.
  general: {
    cautious: m([10, A], [10, A], 30, 0, 0, 0, 0, 2, 0.5, 0.5, 0.5),
    normal: m([20, A], [20, A], 45, 0.5, 0, 0.25, 0, 3, 2 / 3, 1, 0.5),
    strong: m([20, T], [20, T], 60, 1, 0, 0.5, 0, 4, 0.75, 2, 1),
  },
};

/** Command merit per battle, in size classes (Numbers §6): won = objective 5 + won its fight 3 (+ losses under half 2,
 *  + morale never below Wavering 1); lost = orderly withdrawal 3 (+ morale held 1). Which bonus a policy earns: ASSUMPTION. */
const CMD: Record<Policy, { won: number; lost: number }> = {
  cautious: { won: 10, lost: 3 }, normal: { won: 8, lost: 3 }, strong: { won: 11, lost: 4 },
};
/** ASSUMPTION: the strong and normal player survive one near-death moment at their first officer duel (Zone trigger, WB 10.5). */
const NEAR_DEATH: Record<Policy, boolean> = { cautious: false, normal: true, strong: true };
/** ASSUMPTION: the cautious player buys himself free (VISIE Phase 2 #2: "a hard-working buyer is free around 15"). */
const BUY_FREE_AT: Record<Policy, number | undefined> = { cautious: 15, normal: undefined, strong: undefined };
/** Warrior score of the common enemy in real fights (ASSUMPTION): levy/ashigaru E ("trained soldiers"), later veterans D. */
const FOE_FIGHT: Record<Stage, number> = { slave: 22, soldier: 22, officer: 37, general: 37 };

/** A rule change to test (PROPOSAL only, never canon). Empty = the approved numbers. */
export interface Variant {
  label: string;
  startVAL?: number; // canon 14 (WB 10.4)
  cap?: Partial<Record<Stage, number>>; // canon 2.0 per stat per season everywhere (Numbers §2)
  age?: (age: number) => number; // canon ageFactor (Numbers §2)
  base?: Partial<Record<BaseKey, number>>; // canon BASE (Numbers §2)
  slaveFight?: number; // base of a real fight while a slave (canon 0.4)
  leaDrill?: [number, number]; // LEA training days per season and base once Li leads men (canon: none)
  need?: number[]; // promotion thresholds by rank index (canon Numbers §6)
  battles?: number; // battles per year × k (event-mix sensitivity, not a rule)
}
export const APPROVED: Variant = { label: 'approved (Numbers v0.3)' };

export interface Row { age: number; VAL: number; LEA: number; INT: number; POL: number; style: number; rank: string; warrior: string; commander: string }
export interface Promotion { rank: string; age: number; LEA: number; capacity: number; overload: number }
export interface Career {
  policy: Policy;
  variant: string;
  rows: Row[]; // at the start (age 12) and on every birthday
  /** First exact age (years, 1 decimal) each threshold or milestone is reached. */
  reached: Record<string, number>;
  promotions: Promotion[];
  freedHow?: string;
  merit: { combat: number; command: number; political: number };
  events: Record<string, number>; // counts, for the report
}

const band = (score: number) => RANK_BANDS.length - 1 - RANK_BANDS.findIndex(([min]) => score >= min);
const stageOf = (slave: boolean, rank: number): Stage => (slave ? 'slave' : rank <= 2 ? 'soldier' : rank <= 5 ? 'officer' : 'general');
const SEASON_DAYS = 90;
/** Day k (0–89) is one of n evenly spread days in the season. */
const onDay = (k: number, n: number) => n > 0 && Math.floor(((k + 1) * n) / SEASON_DAYS) > Math.floor((k * n) / SEASON_DAYS);
/** Days of the n events in a season, evenly spread. */
const eventDays = (n: number) => Array.from({ length: n }, (_, i) => Math.floor(((i + 0.5) * SEASON_DAYS) / n));
const round1 = (x: number) => Math.round(x * 10) / 10;

export function simulate(policy: Policy, v: Variant = APPROVED, maxAge = 32): Career {
  const li = createWorld(1).characters.li;
  const born = li.born;
  const pot = { VAL: li.potential.VAL, LEA: li.potential.LEA, INT: li.potential.INT, POL: li.potential.POL, style: li.potential.VAL };
  const st = { VAL: v.startVAL ?? li.stats.VAL, LEA: li.stats.LEA, INT: li.stats.INT, POL: li.stats.POL, style: li.styles.two_swords ?? 0 };
  type K = keyof typeof st;
  const born0 = dayIndex({ ...born, part: 'morning' });
  const base = { ...BASE, ...v.base };
  let slave = true; let rank = 0; let freedHow: string | undefined; let firstDuel = true;
  const merit = { combat: 0, command: 0, political: 0 };
  const acc: Record<string, number> = {};
  const ev: Record<string, number> = {};
  const reached: Record<string, number> = {};
  const rows: Row[] = []; const promotions: Promotion[] = [];
  let seasonGain: Record<string, number> = {};
  let mix = MIX.slave[policy]; let stage: Stage = 'slave';
  let plan: Record<string, number[]> = {};

  const warrior = () => (st.VAL + st.style) / 2; // Numbers §1
  const commander = () => (st.LEA + st.INT) / 2;
  const ageAt = (d: number) => ageOn(born, dateFromIndex(d));
  const exact = (d: number) => round1((d - born0) / 360);
  const factor = (age: number) => (v.age ? v.age(age) / ageFactor(age) : 1);
  const count = (k: string, n = 1) => (ev[k] = (ev[k] ?? 0) + n);
  /** Uncapped growth from real events (Numbers §2: "real danger has no cap"). */
  const grow = (k: K, b: number, age: number, ch = 1) => { st[k] = r3(st[k] + growthGain(b * factor(age), age, st[k], pot[k], ch)); };
  /** Training/study: capped per stat per season (Numbers §2). */
  const train = (k: K, b: number, age: number) => {
    const cap = v.cap?.[stage] ?? SEASON_TRAINING_CAP;
    const g = Math.min(growthGain(b * factor(age), age, st[k], pot[k]), Math.max(0, cap - (seasonGain[k] ?? 0)));
    if (g <= 0) return;
    st[k] = r3(st[k] + g); seasonGain[k] = (seasonGain[k] ?? 0) + g;
  };
  /** Deterministic spreading of a yearly rate over the seasons it happens in. */
  const take = (k: string, perSeason: number) => { acc[k] = (acc[k] ?? 0) + perSeason; const n = Math.floor(acc[k] + 1e-9); acc[k] -= n; return n; };
  const free = (how: string, d: number) => { slave = false; freedHow = how; reached.free = exact(d); };
  const fight = (age: number, d: number) => {
    const ch = challengeFactor(band(FOE_FIGHT[stage]) - band(warrior()));
    const b = slave && v.slaveFight !== undefined ? v.slaveFight : base.fight;
    grow('VAL', b, age, ch); grow('style', b, age, ch);
    merit.combat += mix.kills; count('fights');
    if (slave && merit.combat + merit.command >= MERIT_FOR_FREEDOM) free('merit (30 in service)', d);
  };
  const duel = (age: number, d: number) => {
    const me = band(warrior());
    const foe = Math.min(me + mix.up, slave ? 2 : 5); // at the ford only Gochō (E) and Kogashira (D) officers; S foes are not offered
    if (foe < 1) return; // no officer that weak
    count('duels');
    const ch = challengeFactor(foe - me);
    grow('VAL', base.duelWon, age, ch); grow('style', base.duelWon, age, ch);
    if (firstDuel && NEAR_DEATH[policy]) { grow('VAL', base.nearDeath, age); count('near-death'); }
    firstDuel = false;
    merit.combat += HEAD_MERIT[foe];
    if (slave && foe >= 2) free('Kogashira head', d);
  };
  const battle = (age: number) => {
    count('battles');
    const won = take('won', mix.won) > 0;
    if (stage !== 'general') { grow('VAL', base.fight, age, challengeFactor(band(FOE_FIGHT[stage]) - band(warrior()))); grow('style', base.fight, age, 1); merit.combat += mix.kills; }
    if (rank >= 1) {
      grow('LEA', base.lead, age);
      if (won) { grow('LEA', base.battleWon, age); grow('INT', base.battleWon, age); }
      merit.command += (won ? CMD[policy].won : CMD[policy].lost) * RANKS[rank].size;
    }
  };
  const ceremony = (age: number, d: number) => {
    if (slave || rank >= RANKS.length - 1) return;
    const next = RANKS[rank + 1];
    const score = next.w[0] * merit.combat + next.w[1] * merit.command + next.w[2] * merit.political;
    const need = (v.need?.[rank + 1] ?? next.need) * BARRIER;
    if (score < need) return; // vacancy and (from Sanbyakunin-shō) a sponsor: ASSUMED available
    rank++;
    const capacity = commandCapacity(st.LEA);
    promotions.push({ rank: next.name, age: exact(d), LEA: round1(st.LEA), capacity, overload: round1(next.men / capacity) });
    reached[next.name] = exact(d);
    void age;
  };
  const check = (d: number) => {
    const marks: [string, number][] = [
      ['VAL 25', st.VAL >= 25 ? 1 : 0], ['VAL 30', st.VAL >= 30 ? 1 : 0], ['VAL 45', st.VAL >= 45 ? 1 : 0], ['VAL 50', st.VAL >= 50 ? 1 : 0],
      ['VAL 80', st.VAL >= 80 ? 1 : 0], ['LEA 80', st.LEA >= 80 ? 1 : 0], ['INT 80', st.INT >= 80 ? 1 : 0],
      ['Warrior A', warrior() >= 75 ? 1 : 0], ['Commander A', commander() >= 75 ? 1 : 0], ['Commander 80', commander() >= 80 ? 1 : 0],
    ];
    for (const [k, ok] of marks) if (ok && reached[k] === undefined) reached[k] = exact(d);
  };
  const row = (d: number) => rows.push({
    age: ageAt(d), VAL: round1(st.VAL), LEA: round1(st.LEA), INT: round1(st.INT), POL: round1(st.POL), style: round1(st.style),
    rank: slave ? 'slave' : RANKS[rank].name, warrior: rankLetter(warrior()), commander: rankLetter(commander()),
  });

  const end = dayIndex({ year: born.year + maxAge, month: born.month, day: born.day, part: 'morning' });
  for (let d = 0; d <= end; d++) {
    const date = dateFromIndex(d);
    const age = ageAt(d);
    const k = ((date.month - 1) % 3) * 30 + date.day - 1; // day in season
    const sIdx = Math.floor((date.month - 1) / 3); // 0 spring · 1 summer · 2 autumn · 3 winter (WB ch. 9)
    if (d === 0) row(d);
    else if (date.month === born.month && date.day === born.day) row(d);
    if (k === 0) {
      seasonGain = {};
      stage = stageOf(slave, rank); mix = MIX[stage][policy];
      const war = sIdx === 1 || sIdx === 2;
      const kb = v.battles ?? 1;
      plan = {
        fight: eventDays(sIdx < 3 ? take('fight', mix.fights / 3) : 0),
        duel: eventDays(war ? take('duel', mix.duels / 2) : 0),
        battle: eventDays(war ? take('battle', (mix.battles * kb) / 2) : 0),
        plan: eventDays(war ? take('plan', mix.plans / 2) : 0),
        talk: eventDays(sIdx === 3 ? take('talk', mix.talks) : 0),
      };
    }
    // training first (Numbers §2 cap), then the day's events
    if (onDay(k, mix.val[0])) train('VAL', mix.val[1], age);
    if (onDay(k, mix.style[0])) train('style', mix.style[1], age);
    if (onDay(k, mix.study)) train('INT', base.study, age);
    if (v.leaDrill && rank >= 1 && onDay(k, v.leaDrill[0])) train('LEA', v.leaDrill[1], age);
    for (const _ of plan.fight.filter((x) => x === k)) fight(age, d);
    for (const _ of plan.duel.filter((x) => x === k)) duel(age, d);
    for (const _ of plan.battle.filter((x) => x === k)) battle(age);
    for (const _ of plan.plan.filter((x) => x === k)) { grow('INT', base.plan, age); count('plans'); }
    for (const _ of plan.talk.filter((x) => x === k)) { grow('POL', base.talk, age); merit.political += TALK_MERIT; count('talks'); }
    if (k === SEASON_DAYS - 1 && rank >= LAND_RANK && !slave) { grow('POL', base.govern, age); merit.political += GOVERN_MERIT; }
    if (slave && BUY_FREE_AT[policy] !== undefined && age >= BUY_FREE_AT[policy]!) free('bought (15 ryō)', d);
    if (date.day === 30 && (date.month === 6 || date.month === 9)) ceremony(age, d); // reward ceremonies after the campaigns
    check(d);
  }
  return {
    policy, variant: v.label, rows, reached, promotions, freedHow,
    merit: { combat: round1(merit.combat), command: round1(merit.command), political: round1(merit.political) }, events: ev,
  };
}

/** Owner targets: VISIE §4 (VAL) and Numbers §12 (rank ages, strong player in Kurogane). */
export const VISIE_VAL: { age: number; lo: number; hi: number; note: string }[] = [
  { age: 12, lo: 5, hi: 10, note: 'VAL ~5–10 at 12 (canon start is 14: WB 10.4, Numbers §1)' },
  { age: 15, lo: 0, hi: 30, note: 'VAL under 25–30 at 15' },
  { age: 17, lo: 45, hi: 50, note: 'VAL ~45–50 at 17' },
  { age: 30, lo: 80, hi: 95, note: 'great generals 80–95 (tested: best of VAL / LEA at 30)' },
];
export const RANK_TARGETS: { what: string; lo: number; hi: number; label: string }[] = [
  { what: 'free', lo: 13, hi: 15, label: '13–15' },
  { what: 'Gochō', lo: 15, hi: 15, label: '~15' },
  { what: 'Kogashira', lo: 16, hi: 16, label: '~16' },
  { what: 'Hyakunin-gashira', lo: 18, hi: 19, label: '18–19' },
  { what: 'Sanbyakunin-shō', lo: 20, hi: 21, label: '20–21' },
  { what: 'Sennin-shō', lo: 22, hi: 24, label: '22–24' },
  { what: 'Taishō', lo: 27, hi: 32, label: '27–32' },
];

export type Verdict = 'on target' | 'near' | 'early' | 'late' | 'low' | 'high' | 'not reached';
export function rankVerdict(age: number | undefined, lo: number, hi: number): Verdict {
  if (age === undefined) return 'not reached';
  const a = Math.floor(age);
  if (a >= lo && a <= hi) return 'on target';
  if (a === lo - 1 || a === hi + 1) return 'near';
  return a < lo ? 'early' : 'late';
}
export function valueVerdict(x: number, lo: number, hi: number): Verdict {
  return x < lo ? 'low' : x > hi ? 'high' : 'on target';
}
export function visieChecks(c: Career) {
  return VISIE_VAL.map((t) => {
    const r = c.rows.find((x) => x.age === t.age)!;
    const x = t.age === 30 ? Math.max(r.VAL, r.LEA) : r.VAL;
    return { ...t, value: x, verdict: valueVerdict(x, t.lo, t.hi) };
  });
}

// ---------- CLI ----------

const pad = (s: string | number, n: number) => String(s).padStart(n);
const fmt = (x: number | undefined) => (x === undefined ? '–' : x.toFixed(1));

export function statTable(cs: Career[]): string {
  const head = `| age | ${cs.map((c) => `${c.policy} VAL / LEA / INT`).join(' | ')} |`;
  const sep = `|---|${cs.map(() => '---').join('|')}|`;
  const lines = cs[0].rows.filter((r) => r.age <= 30).map((r, i) => `| ${r.age} | ${cs.map((c) => {
    const x = c.rows[i];
    return `${pad(x.VAL.toFixed(1), 4)} / ${pad(x.LEA.toFixed(1), 4)} / ${pad(x.INT.toFixed(1), 4)}`;
  }).join(' | ')} |`);
  return [head, sep, ...lines].join('\n');
}

export function rankTable(cs: Career[]): string {
  const head = `| age | ${cs.map((c) => `${c.policy}: rank · Warrior / Commander`).join(' | ')} |`;
  const sep = `|---|${cs.map(() => '---').join('|')}|`;
  const lines = cs[0].rows.filter((r) => r.age <= 30).map((r, i) => `| ${r.age} | ${cs.map((c) => `${c.rows[i].rank} · ${c.rows[i].warrior} / ${c.rows[i].commander}`).join(' | ')} |`);
  return [head, sep, ...lines].join('\n');
}

export function thresholdTable(cs: Career[]): string {
  const keys = ['VAL 25', 'VAL 30', 'VAL 45', 'VAL 50', 'VAL 80', 'LEA 80', 'INT 80', 'Warrior A', 'Commander A', 'Commander 80'];
  const lines = keys.map((k) => `| ${k} | ${cs.map((c) => fmt(c.reached[k])).join(' | ')} |`);
  const ranks = RANK_TARGETS.map((t) => `| ${t.what} (target ${t.label}) | ${cs.map((c) => `${fmt(c.reached[t.what])} ${rankVerdict(c.reached[t.what], t.lo, t.hi)}`).join(' | ')} |`);
  return [`| threshold (first age) | ${cs.map((c) => c.policy).join(' | ')} |`, `|---|${cs.map(() => '---').join('|')}|`, ...lines, ...ranks].join('\n');
}

export function visieTable(cs: Career[]): string {
  const lines = VISIE_VAL.map((t, i) => `| ${t.note} | ${cs.map((c) => { const x = visieChecks(c)[i]; return `${x.value.toFixed(1)} ${x.verdict}`; }).join(' | ')} |`);
  return [`| VISIE target | ${cs.map((c) => c.policy).join(' | ')} |`, `|---|${cs.map(() => '---').join('|')}|`, ...lines].join('\n');
}

export function mixTable(): string {
  const out = ['| stage | policy | VAL train d/season (base) | style train | INT study d/season | fights/yr | kills/fight | duels/yr (accepts) | battles/yr (won) | plans/yr | talks/yr |', '|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const s of Object.keys(MIX) as Stage[]) for (const p of POLICIES) {
    const x = MIX[s][p];
    out.push(`| ${s} | ${p} | ${x.val[0]} (${x.val[1]}) | ${x.style[0]} (${x.style[1]}) | ${x.study} | ${x.fights} | ${x.kills} | ${x.duels} (+${x.up}) | ${x.battles} (${Math.round(x.won * 100)}%) | ${x.plans} | ${x.talks} |`);
  }
  return out.join('\n');
}

/** Rule changes to test (PROPOSALS, not canon). Each changes one thing against the approved numbers. */
export const PROPOSALS: Variant[] = [
  { label: 'P1 slave-stage training cap 1.0 (not 2.0) per stat per season', cap: { slave: 1.0 } },
  { label: 'P2 P1 + a real fight while a slave teaches 0.2 (not 0.4)', cap: { slave: 1.0 }, slaveFight: 0.2 },
  { label: 'P3 LEA drill: officers train LEA like VAL (teacher 0.05, capped 2.0)', leaDrill: [45, 0.05] },
  { label: 'P4 battles won as commander 2.0 (not 1.0) and leading 1.6 (not 0.8)', base: { battleWon: 2.0, lead: 1.6 } },
  { label: 'P5 start VAL 8 (owner VISIE) instead of 14', startVAL: 8 },
  { label: 'S1 sensitivity (not a rule): 6 battles a year instead of 2–4', battles: 1.5 },
];

export function summary(c: Career): string {
  const r = (k: string) => fmt(c.reached[k]);
  const at = (a: number) => c.rows.find((x) => x.age === a)!;
  return `VAL@15 ${at(15).VAL.toFixed(1)} · VAL@17 ${at(17).VAL.toFixed(1)} · VAL@30 ${at(30).VAL.toFixed(1)} · LEA@30 ${at(30).LEA.toFixed(1)} · free ${r('free')} · Gochō ${r('Gochō')} · Kogashira ${r('Kogashira')} · Hyakunin ${r('Hyakunin-gashira')} · Sanbyakunin ${r('Sanbyakunin-shō')} · Sennin ${r('Sennin-shō')} · Taishō ${r('Taishō')}`;
}

/** Optional calibration: the real stage-1 engine with the career.ts strong player (VAL/style on each birthday, to freedom). */
async function engineCheck(): Promise<string> {
  const { autoMove } = await import('../engine/duel');
  const { li, options, skipDays, startGame, today } = await import('../engine/engine');
  const { handleInput } = await import('../engine/game');
  const { rankScores } = await import('../engine/rules');
  const OFFICER = { 'Gochō': 29, 'Kogashira': 37 } as Record<string, number>;
  const s = startGame();
  const out: string[] = [];
  const snap = (tag: string) => { const c = li(s); out.push(`${tag}: age ${ageOn(c.born, s.date)} · VAL ${c.stats.VAL.toFixed(1)} · two swords ${(c.styles.two_swords ?? 0).toFixed(1)} · ${c.status}`); };
  let last = 12; snap('start');
  for (let g = 0; g < 20000 && today(s) < 360 * 4 && li(s).status === 'slave'; g++) {
    const a = ageOn(li(s).born, s.date); if (a !== last) { snap('birthday'); last = a; }
    if (s.duel && !s.duel.over) { handleInput(s, s.duel.round === 0 ? 'observe' : autoMove(s.duel)); continue; }
    const opts = options(s);
    const officer = opts.find((x) => /^Go for the /.test(x.label));
    if (officer) { const brave = rankScores(li(s)).warrior >= OFFICER[officer.label.replace('Go for the ', '')] - 4; handleInput(s, brave ? officer.key : opts.find((x) => /Hold your place/.test(x.label))!.key); continue; }
    const o = opts.find((x) => x.action.kind === 'choose' && /Step forward|fight|Take the chest/.test(x.label));
    if (o) { handleInput(s, o.key); continue; }
    if (!skipDays(s, 30, { night: 'train' }).events.length) handleInput(s, '1');
  }
  snap('end');
  return out.join('\n');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/career-visie.ts')) {
  const cs = POLICIES.map((p) => simulate(p));
  console.log('## Event mix (ASSUMPTION)\n' + mixTable());
  console.log('\n## VAL / LEA / INT by age (approved numbers)\n' + statTable(cs));
  console.log('\n## Rank and power rank by age\n' + rankTable(cs));
  console.log('\n## Thresholds and §12 milestones (first exact age)\n' + thresholdTable(cs));
  console.log('\n## VISIE targets\n' + visieTable(cs));
  console.log('\n## Promotions (strong): LEA vs the unit at promotion (Numbers §3 capacity, no delegation)');
  for (const p of cs[2].promotions) console.log(`${p.age.toFixed(1)} ${p.rank}: LEA ${p.LEA}, capacity ${p.capacity}, overload ×${p.overload}`);
  console.log('\n## Freedom, merit and events');
  for (const c of cs) console.log(`${c.policy}: ${c.freedHow} · merit ${JSON.stringify(c.merit)} · ${JSON.stringify(c.events)}`);
  console.log('\n## Proposals (strong / normal), one change each');
  for (const v of PROPOSALS) for (const p of ['strong', 'normal'] as Policy[]) console.log(`${v.label} [${p}]: ${summary(simulate(p, v))}`);
  console.log(`baseline [strong]: ${summary(cs[2])}\nbaseline [normal]: ${summary(cs[1])}`);
  if (process.argv.includes('--engine')) engineCheck().then((x) => console.log('\n## Real stage-1 engine (strong player of scripts/career.ts)\n' + x));
}
