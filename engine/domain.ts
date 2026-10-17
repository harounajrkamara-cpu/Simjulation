// Land & domain, Stage 3 (World Bible ch. 7, 8, 9; Numbers §7, §8).
// Pure and deterministic: no randomness, no clock, inputs are never mutated.
// Disasters come only from causes (neglect, war, overpopulation, high tax): ch. "no dice".
// Money is stored as whole mon. Values tagged PROVISIONAL are not on the Numbers Sheet yet:
// they are proposals for the owner and live in one place (PROVISIONAL) so they are easy to tune.

// ---------- money (Numbers §7) ----------
export const MON_PER_RYO = 1000; // §7 game conversion: 1 koku = 1 ryō = 1,000 mon (fixed)
export const MON_PER_KOKU = 1000;
export const ryo = (n: number) => Math.round(n * MON_PER_RYO);
export const kokuMon = (n: number) => Math.round(n * MON_PER_KOKU);

/** "150 ryō", "1 ryō 250 mon", "80 mon". */
export function formatMon(mon: number): string {
  const sign = mon < 0 ? '-' : '';
  const m = Math.abs(Math.round(mon));
  const r = Math.floor(m / MON_PER_RYO);
  const rest = m % MON_PER_RYO;
  if (r === 0) return `${sign}${rest} mon`;
  return rest ? `${sign}${r.toLocaleString('en-US')} ryō ${rest} mon` : `${sign}${r.toLocaleString('en-US')} ryō`;
}

// ---------- land (ch. 7 "Land & taxes", "Army comes from land") ----------
export type LandClass = 'village' | 'villages' | 'district' | 'province' | 'kingdom';

/** ch. 7: village 300–1,000 · several villages · district 10k–50k · province 100k–500k+ · kingdom 1M–10M. */
export function landClass(koku: number): LandClass {
  if (koku < 1_000) return 'village';
  if (koku < 10_000) return 'villages';
  if (koku < 100_000) return 'district'; // 50k–100k is a gap in canon: counted as district
  if (koku < 1_000_000) return 'province';
  return 'kingdom';
}

/** Numbers §7 land duty 2–2.5 armed men per 100 koku = ch. 7 normal 200–250 per 10,000; total war ~2×. */
export function armyFromLand(koku: number): { dutyMin: number; normal: number; totalWar: number } {
  const normal = Math.floor((koku * 25) / 1000);
  return { dutyMin: Math.floor((koku * 2) / 100), normal, totalWar: normal * 2 };
}

// ---------- ranks, pay, land grants (ch. 4, ch. 7, Numbers §7) ----------
export type RankId =
  | 'ashigaru' | 'gocho' | 'kogashira' | 'gojugashira' | 'hyakunin'
  | 'sanbyakunin' | 'sennin' | 'gosennin' | 'taisho' | 'daishogun';

export interface RankRow {
  id: RankId; name: string;
  /** ch. 4: smallest unit the rank commands (Dai-Shōgun minimum is not in canon: PROVISIONAL). */
  men: number;
  /** ch. 7 pay per year in ryō, [min, max]; null from Sanbyakunin-shō up (land instead). */
  payRyo: [number, number] | null;
  /** Numbers §7 land granted, koku [min, max]; max null = open ("100,000+"). */
  land: [number, number | null] | null;
}

export const RANKS: RankRow[] = [
  { id: 'ashigaru', name: 'Ashigaru', men: 0, payRyo: [2, 3], land: null },
  { id: 'gocho', name: 'Gochō', men: 5, payRyo: [4, 6], land: null },
  { id: 'kogashira', name: 'Kogashira', men: 10, payRyo: [4, 6], land: null },
  { id: 'gojugashira', name: 'Gojū-gashira', men: 50, payRyo: [10, 15], land: null },
  { id: 'hyakunin', name: 'Hyakunin-gashira', men: 100, payRyo: [25, 40], land: null },
  { id: 'sanbyakunin', name: 'Sanbyakunin-shō', men: 300, payRyo: null, land: [300, 300] },
  { id: 'sennin', name: 'Sennin-shō', men: 1_000, payRyo: null, land: [2_000, 5_000] },
  { id: 'gosennin', name: 'Gosennin-shō', men: 5_000, payRyo: null, land: [10_000, 20_000] },
  { id: 'taisho', name: 'Taishō', men: 10_000, payRyo: null, land: [30_000, 100_000] },
  { id: 'daishogun', name: 'Dai-Shōgun', men: 50_001, payRyo: null, land: [100_000, null] },
];

export const rankRow = (id: RankId) => RANKS.find((r) => r.id === id)!;

/** ch. 4 Rule 1: nobody outranks the army he serves. Highest rank an army of `men` can hold. */
export function highestRankForArmy(men: number): RankId {
  let best: RankId = 'ashigaru';
  for (const r of RANKS) if (men >= r.men) best = r.id;
  return best;
}

// ---------- Crown (ch. 7 "Families and the Crown", ch. 13c rule 6) ----------
/** Share of tax income owed to the Crown. Canon anchors: Suiren (Authority 25) ~5%, Tatara (95) ~20%+;
 *  linear through those two points, never below 0. Kurogane (55) ≈ 11%, inside ch. 7's default 10–20%. */
export function crownShare(authority: number): number {
  const a = Math.max(0, Math.min(100, authority));
  return Math.max(0, 0.05 + ((a - 25) * 0.15) / 70);
}

// ---------- tax (ch. 7, Numbers §7) ----------
export const TAX_MIN = 0.4; // §7: harvest × tax rate (40–60%)
export const TAX_MAX = 0.6;
export const TAX_MONTH = 9; // ch. 9: tax day = end of month 9
export const WORK_MONTHS = [4, 5, 6, 7, 8, 9]; // ch. 9: planting (summer) and harvest (autumn)

/** Pay per standing soldier per year (ch. 7 Ashigaru 2–3 ryō; §7 example: 7 men ≈ 25 ryō with 1 koku food each). */
export const DEFAULT_PAY_MON = 2_500;

// ---------- PROVISIONAL (not on the Numbers Sheet: owner to confirm) ----------
export const PROVISIONAL = {
  startLoyalty: 60, // peasants start "neutral, watching" (ch. 8 band 60–69)
  taxLoyaltyPerPoint: 1, // loyalty change per tax day = (50 − tax %) × this → 40%: +10, 60%: −10
  restless: 60, // ch. 8 bands: below 60 "suspicious" …
  rebel: 40, // … below 40 "will betray or rebel"
  desperate: 20, // below this they rise even against a full garrison
  famineLine: 0.3, // koku per person the peasants must keep after tax, or famine
  famineLoss: 0.1, // famine: population −10%
  famineLoyalty: -15,
  reliefLoyalty: 5, // lord fed them from the treasury
  overcrowded: 1.25, // people per koku of land above which disease breaks out
  diseaseLoss: 0.05,
  diseaseLoyalty: -5,
  growth: 0.02, // population growth in a year with no famine or disease
  warLossPerMonth: 0.1, // harvest lost per work month the land is fought over
  levyLossKoku: 1, // koku of harvest lost per levy man-month in a work month
  floodNeglectYears: 3, // years without dike & field upkeep before the river floods
  floodLoss: 0.3,
  maintenancePerKoku: 0.02, // ryō per koku of land per year (dikes, ditches, field walls)
  graceMonths: 1, // unpaid men wait this many months, then desert
  labourShare: 0.1, // share of the population free to work on projects
  farmlandMax: 3, // farmland can be cleared this many times
  shrineLoyalty: 10,
  marketIncome: 0.05, // ryō per koku of land per year
  roadTolls: 0.02,
} as const;

// ---------- projects (ch. 7 "Domain & projects"; costs PROVISIONAL, per 1,000 koku of land) ----------
export type ProjectKind = 'watchtower' | 'barracks' | 'farmland' | 'market' | 'roads' | 'smithy' | 'walls' | 'school' | 'shrine';
export const PROJECT_KINDS: ProjectKind[] = ['watchtower', 'barracks', 'farmland', 'market', 'roads', 'smithy', 'walls', 'school', 'shrine'];

export const PROJECTS: Record<ProjectKind, { name: string; ryo: number; workers: number; days: number; effect: string }> = {
  watchtower: { name: 'Watchtower', ryo: 20, workers: 10, days: 30, effect: 'war damage to the harvest halved' },
  barracks: { name: 'Barracks', ryo: 50, workers: 20, days: 60, effect: 'quarters and drill ground for the standing troops' },
  farmland: { name: 'New farmland', ryo: 150, workers: 60, days: 120, effect: 'land +10% koku' },
  market: { name: 'Market', ryo: 80, workers: 25, days: 90, effect: 'market dues each tax day' },
  roads: { name: 'Roads', ryo: 60, workers: 40, days: 90, effect: 'tolls each tax day' },
  smithy: { name: 'Smithy', ryo: 40, workers: 10, days: 45, effect: 'arms and armour made at home' },
  walls: { name: 'Walls', ryo: 200, workers: 80, days: 180, effect: 'the seat can hold against raids' },
  school: { name: 'School', ryo: 60, workers: 15, days: 90, effect: 'reading and figures for retainers' },
  shrine: { name: 'Shrine', ryo: 30, workers: 15, days: 60, effect: 'peasants\' loyalty +10' },
};

export interface Project {
  id: string; kind: ProjectKind; costMon: number; workers: number;
  startDay: number; doneDay: number;
  addKoku: number; // farmland only, fixed at start
}

// ---------- state ----------
export type WalletId = 'li' | 'unit' | 'treasury';
/** ch. 7 wallets, whole mon: Li's personal money · his unit's supplies · the domain treasury. */
export interface Wallets { li: number; unit: number; treasury: number }

export interface Domain {
  id: string; name: string;
  koku: number; // assessed yield, koku per year
  /** Share of this year's harvest lost to the weather (engine/texture.ts; negative = a good year). */
  weather?: number;
  taxRate: number; // 0.40–0.60
  population: number;
  peasantLoyalty: number; // 0–100
  standing: number; // standing troops: full pay all year
  levies: number; // peasants under arms now: food only
  payMon: number; // per standing man per year
  arrears: { standing: number; levies: number }; // men left unpaid last month
  totalWar: boolean;
  crownAuthority: number; // the kingdom's hidden Crown Authority (ch. 13b)
  crownPaid: number; // share of the Crown's due the holder pays, 0–1 (ch. 7: paying less is possible)
  maintain: boolean; // pay dike & field upkeep on tax day
  relief: boolean; // feed the peasants from the treasury if a famine comes
  neglectYears: number;
  warMonths: number; // work months fought over since the last harvest
  levyManMonths: number; // levy man-months in work months since the last harvest
  farmland: number; // times farmland was cleared
  built: ProjectKind[]; // finished: off the dashboard
  projects: Project[]; // running: on the dashboard
  nextProject: number;
  wallets: Wallets;
  manager: string; // who runs the treasury: 'li' or a family member's id
}

export interface DomainEvent { kind: string; text: string; data: Record<string, number | string> }
export interface Step { domain: Domain; events: DomainEvent[] }
export type Result = { ok: true; domain: Domain } | { ok: false; reason: string };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ev = (kind: string, text: string, data: DomainEvent['data'] = {}): DomainEvent => ({ kind, text, data });

function copy(d: Domain): Domain {
  return {
    ...d, arrears: { ...d.arrears }, built: [...d.built],
    projects: d.projects.map((p) => ({ ...p })), wallets: { ...d.wallets },
  };
}

/** Same numbering as calendar.dayIndex: days since Year 100, Month 1, Day 1. */
export const dayOf = (year: number, month: number, day: number) => ((year - 100) * 12 + (month - 1)) * 30 + (day - 1);

export function newDomain(o: { id: string; name: string; koku: number; crownAuthority: number } & Partial<Domain>): Domain {
  const army = armyFromLand(o.koku);
  return {
    taxRate: 0.5, population: o.koku, peasantLoyalty: PROVISIONAL.startLoyalty,
    standing: army.normal, levies: 0, payMon: DEFAULT_PAY_MON, arrears: { standing: 0, levies: 0 },
    totalWar: false, crownPaid: 1, maintain: true, relief: false,
    neglectYears: 0, warMonths: 0, levyManMonths: 0, farmland: 0,
    built: [], projects: [], nextProject: 1, wallets: { li: 0, unit: 0, treasury: 0 }, manager: 'li',
    ...o,
  };
}

// ---------- policy ----------
export function setTaxRate(d: Domain, rate: number): Domain {
  return { ...copy(d), taxRate: clamp(rate, TAX_MIN, TAX_MAX) };
}

/** Normal: standing + levies ≤ 200–250 per 10,000 koku. Total war: levies may double it (ch. 7). */
export function armyCap(d: Domain): { standing: number; total: number } {
  const a = armyFromLand(d.koku);
  return { standing: a.normal, total: d.totalWar ? a.totalWar : a.normal };
}

export function setStanding(d: Domain, n: number): Domain {
  const cap = armyCap(d);
  const standing = clamp(Math.floor(n), 0, cap.standing);
  return { ...copy(d), standing, levies: Math.min(d.levies, cap.total - standing) };
}

export function setLevies(d: Domain, n: number): Domain {
  const cap = armyCap(d);
  const levies = clamp(Math.floor(n), 0, Math.max(0, cap.total - d.standing));
  return { ...copy(d), levies, arrears: { ...d.arrears, levies: Math.min(d.arrears.levies, levies) } };
}

export function setTotalWar(d: Domain, on: boolean): Domain {
  const x = { ...copy(d), totalWar: on };
  return on ? x : setLevies(x, x.levies); // ending total war sends the extra levies home
}

/** Monthly upkeep per man (ch. 7: ~1 koku food per soldier per year + pay; levies cost food only). */
export function upkeepPerMonth(d: Domain): { standing: number; levy: number; total: number } {
  const standing = Math.round((d.payMon + MON_PER_KOKU) / 12);
  const levy = Math.round(MON_PER_KOKU / 12);
  return { standing, levy, total: standing * d.standing + levy * d.levies };
}

// ---------- wallets (ch. 7) ----------
/** Li may use every wallet; the treasury manager (family) may use the treasury only. */
export const canUse = (d: Domain, wallet: WalletId, by: string) => by === 'li' || (wallet === 'treasury' && by === d.manager);

export function setManager(d: Domain, who: string): Domain {
  return { ...copy(d), manager: who };
}

export function spend(d: Domain, wallet: WalletId, mon: number, by: string): Result {
  if (!canUse(d, wallet, by)) return { ok: false, reason: 'not allowed' };
  if (mon < 0 || d.wallets[wallet] < mon) return { ok: false, reason: 'not enough money' };
  const x = copy(d);
  x.wallets[wallet] -= mon;
  return { ok: true, domain: x };
}

export function transfer(d: Domain, from: WalletId, to: WalletId, mon: number, by: string): Result {
  if (!canUse(d, from, by) || !canUse(d, to, by)) return { ok: false, reason: 'not allowed' };
  const r = spend(d, from, mon, by);
  if (!r.ok) return r;
  r.domain.wallets[to] += mon;
  return r;
}

// ---------- projects ----------
const scale = (koku: number) => koku / 1000;

export function projectCost(d: Domain, kind: ProjectKind): { mon: number; workers: number; days: number } {
  const p = PROJECTS[kind];
  return { mon: Math.round(p.ryo * MON_PER_RYO * scale(d.koku)), workers: Math.max(1, Math.ceil(p.workers * scale(d.koku))), days: p.days };
}

/** Free hands for projects (PROVISIONAL share of the population, minus those already at work). */
export function labourFree(d: Domain): number {
  const busy = d.projects.reduce((s, p) => s + p.workers, 0);
  return Math.floor(d.population * PROVISIONAL.labourShare) - busy;
}

/** Pays the cost from the treasury now and stores a completion day (ch. 7). */
export function startProject(d: Domain, kind: ProjectKind, day: number, by = 'li'): Result {
  if (!canUse(d, 'treasury', by)) return { ok: false, reason: 'not allowed' };
  if (d.projects.some((p) => p.kind === kind)) return { ok: false, reason: 'already being built' };
  if (kind === 'farmland' ? d.farmland >= PROVISIONAL.farmlandMax : d.built.includes(kind)) return { ok: false, reason: 'already built' };
  const c = projectCost(d, kind);
  if (d.wallets.treasury < c.mon) return { ok: false, reason: 'not enough money' };
  if (labourFree(d) < c.workers) return { ok: false, reason: 'not enough workers' };
  const x = copy(d);
  x.wallets.treasury -= c.mon;
  x.projects.push({
    id: `p${x.nextProject}`, kind, costMon: c.mon, workers: c.workers, startDay: day, doneDay: day + c.days,
    addKoku: kind === 'farmland' ? Math.round(d.koku * 0.1) : 0,
  });
  x.nextProject += 1;
  return { ok: true, domain: x };
}

/** Finishes every project due by `day` (in start order) and takes it off the dashboard. */
export function completeProjects(d: Domain, day: number): Step {
  if (!d.projects.some((p) => p.doneDay <= day)) return { domain: d, events: [] };
  const x = copy(d);
  const events: DomainEvent[] = [];
  for (const p of d.projects.filter((q) => q.doneDay <= day)) {
    if (p.kind === 'farmland') { x.koku += p.addKoku; x.farmland += 1; }
    if (p.kind === 'shrine') x.peasantLoyalty = clamp(x.peasantLoyalty + PROVISIONAL.shrineLoyalty, 0, 100);
    if (p.kind !== 'farmland') x.built.push(p.kind);
    events.push(ev('project_done', `${PROJECTS[p.kind].name} finished: ${PROJECTS[p.kind].effect}.`, { kind: p.kind, id: p.id, day: p.doneDay }));
  }
  x.projects = x.projects.filter((p) => p.doneDay > day);
  return { domain: x, events };
}

/** Dashboard rows: running projects only (finished ones are gone). */
export function dashboardProjects(d: Domain, day: number): { id: string; name: string; daysLeft: number; workers: number }[] {
  return d.projects.map((p) => ({ id: p.id, name: PROJECTS[p.kind].name, daysLeft: Math.max(0, p.doneDay - day), workers: p.workers }));
}

// ---------- harvest, peasants ----------
/** The coming harvest from its causes (war, flood after neglect, levies away in work months). */
export function harvestOf(d: Domain): { harvest: number; war: number; flood: number; levies: number } {
  const warRate = d.built.includes('watchtower') ? PROVISIONAL.warLossPerMonth / 2 : PROVISIONAL.warLossPerMonth;
  const war = Math.round(d.koku * Math.min(1, d.warMonths * warRate));
  const flood = d.neglectYears >= PROVISIONAL.floodNeglectYears ? Math.round(d.koku * PROVISIONAL.floodLoss) : 0;
  const levies = Math.round(d.levyManMonths * PROVISIONAL.levyLossKoku);
  const weather = Math.round(d.koku * (d.weather ?? 0));
  return { harvest: Math.max(0, d.koku - war - flood - levies - weather), war, flood, levies };
}

export type Unrest = 'calm' | 'restless' | 'unrest' | 'uprising';

/** ch. 8 bands: < 60 suspicious, < 40 rebels. A garrison at the land duty holds them down unless desperate. */
export function unrest(d: Domain): Unrest {
  const l = d.peasantLoyalty;
  if (l >= PROVISIONAL.restless) return 'calm';
  if (l >= PROVISIONAL.rebel) return 'restless';
  if (l < PROVISIONAL.desperate || d.standing < armyFromLand(d.koku).dutyMin) return 'uprising';
  return 'unrest';
}

/** Tax day, end of month 9 (ch. 7, ch. 9). Fixed order: harvest → peasants' answer to the tax → Crown →
 *  upkeep of the land → food → sickness → people. */
export function taxDay(d: Domain): Step {
  const x = copy(d);
  const events: DomainEvent[] = [];
  const h = harvestOf(x);
  events.push(ev('harvest', `Harvest: ${h.harvest.toLocaleString('en-US')} of ${x.koku.toLocaleString('en-US')} koku.`, { harvest: h.harvest, koku: x.koku, war: h.war, flood: h.flood, levies: h.levies }));
  if (h.flood) events.push(ev('flood', 'The river breaks the old dikes and drowns the low fields.', { lost: h.flood, years: x.neglectYears }));
  if (h.harvest < x.koku * 0.8 && (h.war || h.levies)) events.push(ev('bad_harvest', 'Fields went unworked this year; the harvest is poor.', { war: h.war, levies: h.levies }));

  // tax and the peasants' answer (ch. 7: higher tax = lower loyalty → uprisings)
  const taxKoku = Math.round(h.harvest * x.taxRate);
  x.peasantLoyalty = clamp(x.peasantLoyalty + Math.round((0.5 - x.taxRate) * 100 * PROVISIONAL.taxLoyaltyPerPoint), 0, 100);
  const mood = unrest(x);
  const income = mood === 'uprising' ? 0 : taxKoku * MON_PER_KOKU;
  if (mood === 'uprising') events.push(ev('uprising', 'The villages rise. No rice reaches the storehouse this year.', { loyalty: x.peasantLoyalty, lost: taxKoku * MON_PER_KOKU }));
  else if (mood === 'unrest') events.push(ev('unrest', 'Sullen faces at the storehouse; only the garrison keeps the rice coming.', { loyalty: x.peasantLoyalty }));
  else if (mood === 'restless') events.push(ev('restless', 'The headmen bow lower than they need to. They are counting.', { loyalty: x.peasantLoyalty }));
  x.wallets.treasury += income;
  if (income) events.push(ev('tax', `Tax rice: ${taxKoku.toLocaleString('en-US')} koku (${Math.round(x.taxRate * 100)}%).`, { koku: taxKoku, mon: income }));

  // other income (ch. 7): market dues and tolls
  const other = (x.built.includes('market') ? ryo(x.koku * PROVISIONAL.marketIncome) : 0) + (x.built.includes('roads') ? ryo(x.koku * PROVISIONAL.roadTolls) : 0);
  if (other) { x.wallets.treasury += other; events.push(ev('trade', `Market dues and tolls: ${formatMon(other)}.`, { mon: other })); }

  // Crown (ch. 7, ch. 13c rule 6)
  const due = Math.round(income * crownShare(x.crownAuthority));
  const paid = Math.min(Math.round(due * clamp(x.crownPaid, 0, 1)), x.wallets.treasury);
  x.wallets.treasury -= paid;
  if (due) events.push(ev('crown', `Sent to the Crown: ${formatMon(paid)}.`, { due, paid }));
  if (paid < due) events.push(ev('crown_short', 'The Crown got less than its share. The governor notices.', { due, paid, short: due - paid }));

  // upkeep of the land; neglect builds toward a flood
  const upkeep = ryo(x.koku * PROVISIONAL.maintenancePerKoku);
  if (x.maintain && x.wallets.treasury >= upkeep) {
    x.wallets.treasury -= upkeep; x.neglectYears = 0;
    events.push(ev('maintenance', `Dikes and ditches repaired: ${formatMon(upkeep)}.`, { mon: upkeep }));
  } else {
    x.neglectYears += 1;
    events.push(ev('neglect', 'Nobody mends the dikes this year.', { years: x.neglectYears }));
  }

  // food: what the peasants keep after tax
  const kept = h.harvest - (mood === 'uprising' ? 0 : taxKoku);
  const need = Math.ceil(x.population * PROVISIONAL.famineLine);
  let famine = false;
  if (kept < need) {
    const cost = (need - kept) * MON_PER_KOKU;
    if (x.relief && x.wallets.treasury >= cost) {
      x.wallets.treasury -= cost;
      x.peasantLoyalty = clamp(x.peasantLoyalty + PROVISIONAL.reliefLoyalty, 0, 100);
      events.push(ev('relief', `Rice from the storehouse feeds the villages: ${formatMon(cost)}.`, { mon: cost }));
    } else {
      famine = true;
      x.population -= Math.round(x.population * PROVISIONAL.famineLoss);
      x.peasantLoyalty = clamp(x.peasantLoyalty + PROVISIONAL.famineLoyalty, 0, 100);
      events.push(ev('famine', 'Hunger in the villages before the snow.', { short: need - kept, population: x.population }));
    }
  }
  if (famine || x.population > x.koku * PROVISIONAL.overcrowded) {
    x.population -= Math.round(x.population * PROVISIONAL.diseaseLoss);
    x.peasantLoyalty = clamp(x.peasantLoyalty + PROVISIONAL.diseaseLoyalty, 0, 100);
    events.push(ev('disease', famine ? 'Sickness follows the hunger.' : 'Too many people on too little land: sickness spreads.', { population: x.population }));
  } else if (!famine) {
    x.population += Math.round(x.population * PROVISIONAL.growth);
  }

  x.warMonths = 0; x.levyManMonths = 0;
  return { domain: x, events };
}

// ---------- the month ----------
/** End of a month: projects → war and levies in work months → tax day (month 9) → upkeep and desertion. */
export function endMonth(d: Domain, year: number, month: number, war = false): Step {
  let { domain: x, events } = completeProjects(d, dayOf(year, month, 30));
  x = copy(x);
  events = [...events];
  if (WORK_MONTHS.includes(month)) {
    x.levyManMonths += x.levies;
    if (war) x.warMonths += 1;
  }
  if (month === TAX_MONTH) {
    const t = taxDay(x);
    x = t.domain; events.push(...t.events);
  }
  // upkeep: standing troops are paid first, then the levies are fed (fixed order)
  const u = upkeepPerMonth(x);
  const paidS = Math.min(x.standing, u.standing ? Math.floor(x.wallets.treasury / u.standing) : x.standing);
  x.wallets.treasury -= paidS * u.standing;
  const paidL = Math.min(x.levies, u.levy ? Math.floor(x.wallets.treasury / u.levy) : x.levies);
  x.wallets.treasury -= paidL * u.levy;
  const unpaid = { standing: x.standing - paidS, levies: x.levies - paidL };
  // ch. 7: unpaid soldiers desert, after PROVISIONAL grace months
  const g = PROVISIONAL.graceMonths;
  const desert = {
    standing: Math.min(unpaid.standing, Math.max(0, x.arrears.standing - (g - 1))),
    levies: Math.min(unpaid.levies, Math.max(0, x.arrears.levies - (g - 1))),
  };
  if (unpaid.standing + unpaid.levies > 0) {
    events.push(ev('unpaid', `${unpaid.standing + unpaid.levies} men went unpaid this month.`, { standing: unpaid.standing, levies: unpaid.levies }));
  }
  if (desert.standing + desert.levies > 0) {
    x.standing -= desert.standing; x.levies -= desert.levies;
    events.push(ev('desertion', `${desert.standing + desert.levies} unpaid men slipped away in the night.`, { standing: desert.standing, levies: desert.levies }));
  }
  // Men still unpaid carry over; next month they desert (after the grace months).
  x.arrears = { standing: unpaid.standing - desert.standing, levies: unpaid.levies - desert.levies };
  return { domain: x, events };
}

/** A whole year, month 1 → 12 (timeskips, tests). `warIn` = months the land is fought over. */
export function runYear(d: Domain, year: number, warIn: number[] = []): Step {
  let x = d;
  const events: DomainEvent[] = [];
  for (let m = 1; m <= 12; m++) {
    const s = endMonth(x, year, m, warIn.includes(m));
    x = s.domain;
    for (const e of s.events) events.push({ ...e, data: { ...e.data, month: m } });
  }
  return { domain: x, events };
}

// ---------- dashboard ----------
export function domainSummary(d: Domain, day: number) {
  const a = armyFromLand(d.koku);
  return {
    name: d.name, land: `${d.koku.toLocaleString('en-US')} koku (${landClass(d.koku)})`,
    liMoney: formatMon(d.wallets.li), unit: formatMon(d.wallets.unit), treasury: formatMon(d.wallets.treasury), manager: d.manager,
    tax: `${Math.round(d.taxRate * 100)}%`, peasants: unrest(d),
    army: { standing: d.standing, levies: d.levies, duty: a.dutyMin, cap: armyCap(d).total, belowDuty: d.standing < a.dutyMin },
    projects: dashboardProjects(d, day),
  };
}
