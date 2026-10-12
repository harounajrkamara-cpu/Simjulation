// Career rules: military ranks, merit & promotion, pay & land, command capacity, power ranks, ability limits.
// Canon: World Bible ch. 3, 4, 5, 7, 8 · Numbers Sheet §1, §3, §6, §7. Pure and deterministic (ch. 12b): no randomness,
// no clock, ties broken by a fixed order. Self-contained so it can be wired in later without touching types.ts.
//
// "Twin brother" rule (birth vs merit): two brothers with the same stats have the same POWER rank (F–S, from stats only);
// their COMMAND rank (Ashigaru … Dai-Shōgun) can differ, because promotion reads merit, birth/status, a vacancy and a
// sponsor, never stats (WB ch. 4 "Promotion = merit + status + a free position", ch. 5 "Power Rank … separate from men
// commanded"). Too little LEA for the men he leads shows up as overload (Numbers §3), not as a blocked promotion.

// ───────────────────────────── Rank ladder (WB ch. 4) ─────────────────────────────

export type RankId =
  | 'ashigaru' | 'gocho' | 'kogashira' | 'gojugashira' | 'hyakuningashira'
  | 'sanbyakuninsho' | 'senninsho' | 'gosenninsho' | 'taisho' | 'daishogun';

export interface RankInfo {
  id: RankId;
  /** Japanese title as written in the World Bible. */
  title: string;
  /** English name, only where the World Bible gives one. */
  english?: string;
  /** Men commanded, as shown (WB ch. 4 table). */
  men: string;
  /** Fewest men of the rank's unit; Rule 1 compares the army against this. */
  min: number;
  /** Below 1,000 unit sizes are fixed; from 1,000 up the rank is a title with a range (ch. 4). */
  fixed: boolean;
}

/** 📝 Not in canon (ch. 4 only says "whole armies, up to ~200,000"): Rule 1 floor for a Dai-Shōgun, set at the top of
 * the Taishō band (10,000–50,000+). Owner question. */
export const DAI_SHOGUN_MIN_ARMY = 50_000;

export const RANKS: readonly RankInfo[] = [
  { id: 'ashigaru', title: 'Ashigaru', men: '–', min: 0, fixed: true },
  { id: 'gocho', title: 'Gochō', men: '5', min: 5, fixed: true },
  { id: 'kogashira', title: 'Kogashira', men: '10', min: 10, fixed: true },
  { id: 'gojugashira', title: 'Gojū-gashira', men: '50', min: 50, fixed: true },
  { id: 'hyakuningashira', title: 'Hyakunin-gashira', men: '100', min: 100, fixed: true },
  { id: 'sanbyakuninsho', title: 'Sanbyakunin-shō', men: '300', min: 300, fixed: true },
  { id: 'senninsho', title: 'Sennin-shō', men: '1,000–4,999', min: 1_000, fixed: false },
  { id: 'gosenninsho', title: 'Gosennin-shō', men: '5,000–9,999', min: 5_000, fixed: false },
  { id: 'taisho', title: 'Taishō', english: 'General', men: '10,000–50,000+', min: 10_000, fixed: false },
  { id: 'daishogun', title: 'Dai-Shōgun', english: 'Great General', men: 'whole armies', min: DAI_SHOGUN_MIN_ARMY, fixed: false },
];

export const RANK_IDS: readonly RankId[] = RANKS.map(r => r.id);

/** 0 = Ashigaru … 9 = Dai-Shōgun. */
export function rankLevel(id: RankId): number {
  return RANK_IDS.indexOf(id);
}

export function rankInfo(id: RankId): RankInfo {
  return RANKS[rankLevel(id)];
}

export function nextRank(id: RankId): RankId | null {
  return RANK_IDS[rankLevel(id) + 1] ?? null;
}

/** 1234567 → "1,234,567" (no locale, so the text is the same everywhere). */
export function fmtMen(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "Hyakunin-gashira (100)" · "Sennin-shō (1,000–4,999)" · with men for a ranged rank: "Sennin-shō (2,400)" · "Ashigaru". */
export function rankLabel(id: RankId, men?: number): string {
  const r = rankInfo(id);
  if (id === 'ashigaru') return r.title;
  return `${r.title} (${men !== undefined && !r.fixed ? fmtMen(men) : r.men})`;
}

const fold = (s: string) => s.normalize('NFD').replace(/\([^)]*\)/g, '').replace(/[^A-Za-z]/g, '').toLowerCase();

/** Reads a title the way people type it ("Hyakunin-gashira", "gocho", "Dai-Shogun", "Great General"). */
export function rankFromTitle(text: string): RankId | null {
  const t = fold(text);
  for (const r of RANKS) if (fold(r.title) === t || r.id === t || (r.english && fold(r.english) === t)) return r.id;
  return null;
}

// ───────────── Rule 1 & Rule 2 (WB ch. 4) ─────────────

/** Rule 1: nobody can outrank the army they serve. Highest rank whose smallest unit fits in the army. */
export function maxRankForArmy(armyMen: number): RankId {
  let best: RankId = 'ashigaru';
  for (const r of RANKS) if (r.min <= armyMen) best = r.id;
  return best;
}

export function canHoldRank(id: RankId, armyMen: number): boolean {
  return rankLevel(id) <= rankLevel(maxRankForArmy(armyMen));
}

export type Service = 'crown' | 'family';

/** Rule 2: Crown service counts higher than family service at the same rank (only at the same rank). */
export function precedence(id: RankId, service: Service): number {
  return rankLevel(id) * 2 + (service === 'crown' ? 1 : 0);
}

/** > 0: a stands above b · 0: equal standing. */
export function compareStanding(a: { rank: RankId; service: Service }, b: { rank: RankId; service: Service }): number {
  return precedence(a.rank, a.service) - precedence(b.rank, b.service);
}

/** Reward ceremony order (ch. 4 "in rank order"): highest standing first, then id (fixed tie-break). */
export function ceremonyOrder<T extends { id: string; rank: RankId; service: Service }>(people: readonly T[]): T[] {
  return [...people].sort((a, b) => compareStanding(b, a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// ───────────── Birth, status & the social barrier (WB ch. 3, 7, 8 · Numbers §6) ─────────────

/** Social class by birth, high → low (ch. 3). */
export type Birth = 'royal' | 'noble' | 'samurai' | 'commoner' | 'outcast';
export const BIRTH_ORDER: readonly Birth[] = ['royal', 'noble', 'samurai', 'commoner', 'outcast'];
/** Legal status now: free, enslaved, or freed (an ex-slave). */
export type Bond = 'free' | 'slave' | 'freed';

/** "Low-born or ex-slaves" (Numbers §6): commoners, outcasts, slaves and freed slaves. */
export function isLowBorn(birth: Birth, bond: Bond = 'free'): boolean {
  return birth === 'commoner' || birth === 'outcast' || bond !== 'free';
}

export type KingdomId = 'kurogane' | 'suiren' | 'hayate' | 'ushio' | 'takane' | 'tatara' | 'kitakaze';

/** Numbers §6: multiplier on the merit needed by low-born or ex-slaves, by the kingdom served. */
export const SOCIAL_BARRIER: Record<KingdomId, number> = {
  kurogane: 1.0, kitakaze: 1.0, hayate: 1.25, takane: 1.25, ushio: 1.5, tatara: 1.25, suiren: 2.0,
};

export function barrierFactor(kingdom: KingdomId, birth: Birth, bond: Bond = 'free'): number {
  return isLowBorn(birth, bond) ? SOCIAL_BARRIER[kingdom] : 1;
}

/** Reason text of the ch. 8 opinion modifier. Its size and fading are not in the Numbers Sheet (owner question). */
export const LOW_BORN_REASON = 'Low-born';

/** WB ch. 8: nobles get a "low-born" opinion modifier toward commoners and ex-slaves; deeds can outweigh it. */
export function lowBornModifierApplies(viewer: Birth, target: Birth, targetBond: Bond = 'free'): boolean {
  return (viewer === 'noble' || viewer === 'royal') && isLowBorn(target, targetBond);
}

// ───────────── Merit per deed (Numbers §6) ─────────────

export type MeritKind = 'combat' | 'command' | 'political';
export interface MeritLedger { combat: number; command: number; political: number }
export const NO_MERIT: MeritLedger = { combat: 0, command: 0, political: 0 };

/** Numbers §6 combat merit by the enemy's rank: an ashigaru killed (witnessed) or an officer's head. */
export const HEAD_MERIT: Record<RankId, number> = {
  ashigaru: 1, gocho: 3, kogashira: 3, gojugashira: 10, hyakuningashira: 10,
  sanbyakuninsho: 25, senninsho: 60, gosenninsho: 120, taisho: 250,
  daishogun: 250, // 📝 not in the table; counted as a Taishō head (owner question)
};

export type CombatDeed = 'standard' | 'first_over_wall' | 'saved_officer' | 'scouting';
/** Numbers §6 other combat deeds. */
export const COMBAT_DEED_MERIT: Record<CombatDeed, number> = { standard: 20, first_over_wall: 15, saved_officer: 10, scouting: 3 };

export type CommandDeed = 'objective' | 'won' | 'low_losses' | 'withdrawal' | 'steady_morale' | 'supply_kept' | 'disobeyed_paid_off' | 'disobeyed_failed';
/** Numbers §6 command merit, × the unit's size class. */
export const COMMAND_DEED_MERIT: Record<CommandDeed, number> = {
  objective: 5, won: 3, low_losses: 2, withdrawal: 3, steady_morale: 1, supply_kept: 1, disobeyed_paid_off: 3, disobeyed_failed: -3,
};

export type PoliticalDeed = 'negotiation' | 'intelligence' | 'governance' | 'civilians';
/** Numbers §6 political merit ranges; governance is 5 per season. */
export const POLITICAL_MERIT: Record<PoliticalDeed, readonly [number, number]> = {
  negotiation: [5, 30], intelligence: [5, 20], governance: [5, 5], civilians: [3, 10],
};

/** Numbers §6 size class: 5-man 1 · 10 2 · 50 3 · 100 4 · 300 5 · 1,000 6 · 5,000 7 · 10,000+ 8 (fewer than 5 men: 1, nobody: 0). */
export function sizeClass(men: number): number {
  const steps = [10_000, 5_000, 1_000, 300, 100, 50, 10, 5];
  for (let i = 0; i < steps.length; i++) if (men >= steps[i]) return 8 - i;
  return men > 0 ? 1 : 0;
}

/** Size class of a rank's own unit (Dai-Shōgun counts as 10,000+). */
export function sizeClassOfRank(id: RankId): number {
  return Math.min(rankLevel(id), 8);
}

export type Deed = (
  | { kind: 'kill'; foe: RankId }
  | { kind: CombatDeed }
  | { kind: 'command'; deed: CommandDeed; unit: RankId | number }
  | { kind: 'political'; deed: PoliticalDeed; amount: number }
) & {
  /** Merit counts only when confirmed after the battle by witnesses, reports or the head count (Numbers §6). Default true. */
  confirmed?: boolean;
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Merit for one deed. A proposed political amount is clamped into its canon range (the code checks every number). */
export function meritOf(d: Deed): { kind: MeritKind; amount: number } {
  const ok = d.confirmed !== false;
  switch (d.kind) {
    case 'kill': return { kind: 'combat', amount: ok ? HEAD_MERIT[d.foe] : 0 };
    case 'command': {
      const cls = typeof d.unit === 'number' ? sizeClass(d.unit) : sizeClassOfRank(d.unit);
      return { kind: 'command', amount: ok ? COMMAND_DEED_MERIT[d.deed] * cls : 0 };
    }
    case 'political': {
      const [lo, hi] = POLITICAL_MERIT[d.deed];
      return { kind: 'political', amount: ok ? Math.round(clamp(d.amount, lo, hi)) : 0 };
    }
    default: return { kind: 'combat', amount: ok ? COMBAT_DEED_MERIT[d.kind] : 0 };
  }
}

/** Career merit is never reset after a promotion (Numbers §6). Returns a new ledger. */
export function addMerit(ledger: MeritLedger, deeds: readonly Deed[]): MeritLedger {
  const out = { ...ledger };
  for (const d of deeds) {
    const m = meritOf(d);
    out[m.kind] += m.amount;
  }
  return out;
}

// ───────────── Promotion (Numbers §6) ─────────────

/** Numbers §6 weights [combat w₁, command w₂, political/reputation/sponsor w₃] by the TARGET rank. */
export function promotionWeights(target: RankId): readonly [number, number, number] {
  const lvl = rankLevel(target);
  if (lvl <= rankLevel('kogashira')) return [0.6, 0.3, 0.1];
  if (lvl <= rankLevel('hyakuningashira')) return [0.35, 0.5, 0.15];
  if (lvl <= rankLevel('senninsho')) return [0.15, 0.6, 0.25];
  if (lvl <= rankLevel('taisho')) return [0.05, 0.55, 0.4];
  return [0.05, 0.45, 0.5];
}

/** Numbers §6 promotion thresholds (career score needed to reach each rank). */
export const PROMOTION_THRESHOLD: Record<RankId, number> = {
  ashigaru: 0, gocho: 15, kogashira: 40, gojugashira: 100, hyakuningashira: 220,
  sanbyakuninsho: 450, senninsho: 900, gosenninsho: 1_800, taisho: 3_500, daishogun: 7_000,
};

const r3 = (x: number) => Math.round(x * 1000) / 1000;

/** Score = combat × w₁ + command × w₂ + (political + reputation + sponsor) × w₃, rounded to 3 decimals. */
export function promotionScore(m: MeritLedger, target: RankId, reputation = 0, sponsor = 0): number {
  const [w1, w2, w3] = promotionWeights(target);
  return r3(m.combat * w1 + m.command * w2 + (m.political + reputation + sponsor) * w3);
}

/** Score needed for the target rank after the social barrier. */
export function meritNeeded(target: RankId, kingdom: KingdomId, birth: Birth, bond: Bond = 'free'): number {
  return r3(PROMOTION_THRESHOLD[target] * barrierFactor(kingdom, birth, bond));
}

/** From Sanbyakunin-shō up a sponsor is needed: a superior with opinion ≥ +40 (Numbers §6). */
export const SPONSOR_FROM: RankId = 'sanbyakuninsho';
export const SPONSOR_MIN_OPINION = 40;

export interface PromotionCase {
  rank: RankId;
  merit: MeritLedger;
  /** Reputation and sponsor terms of w₃, already in merit points (their scale is an owner question). */
  reputation?: number;
  sponsor?: number;
  birth: Birth;
  bond?: Bond;
  kingdom: KingdomId;
  /** Men in the army he serves (Rule 1). */
  armyMen: number;
  vacancy: boolean;
  /** Best opinion (−100 … +100) a superior holds of him. */
  sponsorOpinion?: number;
  /** A slave's owner agrees to release him. */
  ownerReleases?: boolean;
}

export type BlockCode = 'top' | 'owner' | 'merit' | 'barrier' | 'army' | 'vacancy' | 'sponsor';
export interface PromotionBlock { code: BlockCode; reason: string }
export interface PromotionCheck {
  ok: boolean;
  target: RankId | null;
  score: number;
  /** Threshold after the barrier, and before it. */
  needed: number;
  baseNeeded: number;
  blocks: PromotionBlock[];
}

/** One step up. The barrier is shown, not hidden: every block carries the reason Li sees (Numbers §6). */
export function checkPromotion(c: PromotionCase): PromotionCheck {
  const target = nextRank(c.rank);
  if (!target) return { ok: false, target: null, score: 0, needed: 0, baseNeeded: 0, blocks: [{ code: 'top', reason: 'there is no higher rank' }] };
  const bond = c.bond ?? 'free';
  const score = promotionScore(c.merit, target, c.reputation, c.sponsor);
  const baseNeeded = PROMOTION_THRESHOLD[target];
  const needed = meritNeeded(target, c.kingdom, c.birth, bond);
  const blocks: PromotionBlock[] = [];
  if (bond === 'slave' && !c.ownerReleases) blocks.push({ code: 'owner', reason: 'your owner refuses to release you' });
  if (score < baseNeeded) blocks.push({ code: 'merit', reason: 'not enough merit yet' });
  else if (score < needed) blocks.push({ code: 'barrier', reason: 'the elders reject a low-born' });
  if (!canHoldRank(target, c.armyMen)) blocks.push({ code: 'army', reason: `the army you serve is too small for a ${rankInfo(target).title}` });
  if (!c.vacancy) blocks.push({ code: 'vacancy', reason: 'no free position' });
  if (rankLevel(target) >= rankLevel(SPONSOR_FROM) && (c.sponsorOpinion ?? -Infinity) < SPONSOR_MIN_OPINION) blocks.push({ code: 'sponsor', reason: 'a sponsor is required' });
  return { ok: blocks.length === 0, target, score, needed, baseNeeded, blocks };
}

/** A vacancy is filled best merit first (Numbers §6); ties go to the higher birth, then the lower id. */
export function fillVacancy(cands: readonly (PromotionCase & { id: string })[]): { winner: string | null; order: string[]; passedOver: { id: string; reason: string }[] } {
  const checked = cands.map(c => ({ c, chk: checkPromotion({ ...c, vacancy: true }) })).filter(x => x.chk.ok);
  checked.sort((a, b) => b.chk.score - a.chk.score
    || BIRTH_ORDER.indexOf(a.c.birth) - BIRTH_ORDER.indexOf(b.c.birth)
    || (a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : 0));
  const order = checked.map(x => x.c.id);
  const top = checked[0]?.c;
  const passedOver = checked.slice(1).map(({ c }) => ({
    id: c.id,
    reason: top && !isLowBorn(top.birth, top.bond) && (top.birth === 'noble' || top.birth === 'royal') && isLowBorn(c.birth, c.bond)
      ? 'a noble candidate has priority'
      : 'a candidate with more merit was chosen',
  }));
  return { winner: top?.id ?? null, order, passedOver };
}

/** Numbers §6 freedom through merit (Kurogane law): a witnessed head of Kogashira or higher, or 30 combat + command
 * merit, in official Kurogane service. Kurogane pays the owner 10 ryō. */
export const FREEDOM_MERIT = 30;
export const FREEDOM_OWNER_PAY_RYO = 10;
export function freedomByMerit(c: { kuroganeService: boolean; witnessedHeads: readonly RankId[]; combatPlusCommand: number }): { free: boolean; route: 'head' | 'merit' | null; ownerPaidRyo: number } {
  if (!c.kuroganeService) return { free: false, route: null, ownerPaidRyo: 0 };
  if (c.witnessedHeads.some(h => rankLevel(h) >= rankLevel('kogashira'))) return { free: true, route: 'head', ownerPaidRyo: FREEDOM_OWNER_PAY_RYO };
  if (c.combatPlusCommand >= FREEDOM_MERIT) return { free: true, route: 'merit', ownerPaidRyo: FREEDOM_OWNER_PAY_RYO };
  return { free: false, route: null, ownerPaidRyo: 0 };
}

// ───────────── Pay, rewards & land (WB ch. 7 · Numbers §7) ─────────────

/** WB ch. 7 pay per year in ryō (Ashigaru also gets food and basic gear). Slaves get no pay. */
export const PAY_RYO: Partial<Record<RankId, readonly [number, number]>> = {
  ashigaru: [2, 3], gocho: [4, 6], kogashira: [4, 6], gojugashira: [10, 15], hyakuningashira: [25, 40],
};

/** Numbers §7 land granted (koku per year), Crown or family service; null = no upper limit ("100,000+"). */
export const LAND_KOKU: Partial<Record<RankId, readonly [number, number | null]>> = {
  sanbyakuninsho: [300, 300], senninsho: [2_000, 5_000], gosenninsho: [10_000, 20_000], taisho: [30_000, 100_000], daishogun: [100_000, null],
};

export interface RankIncome {
  payRyo: readonly [number, number] | null;
  landKoku: readonly [number, number | null] | null;
  foodAndGear: boolean;
}

/** From Sanbyakunin-shō up: land (a village, later a district) instead of only pay (WB ch. 7). */
export function rankIncome(id: RankId, bond: Bond = 'free'): RankIncome {
  if (bond === 'slave') return { payRyo: null, landKoku: null, foodAndGear: false };
  return { payRyo: PAY_RYO[id] ?? null, landKoku: LAND_KOKU[id] ?? null, foodAndGear: id === 'ashigaru' };
}

/** Checks a proposed yearly pay: clamped into the rank's range; 0 for slaves or ranks paid in land. */
export function checkPay(id: RankId, proposedRyo: number, bond: Bond = 'free'): number {
  const p = rankIncome(id, bond).payRyo;
  return p ? clamp(proposedRyo, p[0], p[1]) : 0;
}

/** Checks a proposed land grant: clamped into the rank's range; 0 below Sanbyakunin-shō. */
export function checkLandGrant(id: RankId, proposedKoku: number): number {
  const l = LAND_KOKU[id];
  return l ? clamp(proposedKoku, l[0], l[1] ?? Infinity) : 0;
}

/** Numbers §7 game conversion: 1 koku = 1 ryō = 1,000 mon. */
export const MON_PER_RYO = 1_000;

/** Numbers §7 ceremony reward: 0.1 ryō (100 mon) per merit point earned in that campaign. Slaves get none. */
export function ceremonyRewardMon(campaignMerit: number, bond: Bond = 'free'): number {
  return bond === 'slave' ? 0 : Math.max(0, Math.round(campaignMerit * 100));
}

/** Numbers §7 land income: harvest × tax rate (40–60%), arriving at the end of Month 9. In ryō. */
export function landIncomeRyo(harvestKoku: number, taxRate: number): number {
  return r3(harvestKoku * clamp(taxRate, 0.4, 0.6));
}

/** Numbers §7 land duty: 2–2.5 armed men per 100 koku, as whole men [fewest, most]. */
export function landDutyMen(koku: number): readonly [number, number] {
  const lo = Math.ceil(r3(koku * 2 / 100));
  return [lo, Math.max(lo, Math.floor(r3(koku * 2.5 / 100)))];
}

/** Numbers §7 cost of the duty men per year in ryō: each ~1 koku food + 2–3 ryō pay. */
export function dutyUpkeepRyo(men: number, payPerMan: number): number {
  return r3(men * (1 + clamp(payPerMan, 2, 3)));
}

// ───────────── Command capacity (Numbers §3, WB ch. 5 + 12b) ─────────────

/** C = 10^(1 + LEA ÷ 25) men (exact; LEA 0: 10 · 25: 100 · 50: 1,000 · 75: 10,000 · 100: 100,000). */
export function capacity(lea: number): number {
  return 10 ** (1 + lea / 25);
}

/** Players only see a broad label, never the exact capacity (Numbers §3). */
export function capacityLabel(lea: number): string {
  if (lea < 15) return 'handles a few';
  if (lea < 30) return 'small unit';
  if (lea < 45) return 'company';
  if (lea < 60) return 'battalion';
  if (lea < 75) return 'large formation';
  if (lea < 90) return 'army';
  return 'great army';
}

/** A commander, the men he leads directly, and his sub-commanders. */
export interface CommandNode { lea: number; direct: number; subs?: readonly CommandNode[] }

export function totalMen(n: CommandNode): number {
  return n.direct + (n.subs ?? []).reduce((s, x) => s + totalMen(x), 0);
}

/** Delegation (v0.3): load = direct men + 20% of the men under each sub-commander who is not overloaded himself;
 * under an overloaded one, all his men count. */
export const DELEGATED_SHARE = 0.2;
export function commandLoad(n: CommandNode): number {
  let load = n.direct;
  for (const s of n.subs ?? []) load += overloadOf(commandLoad(s), s.lea) > 1 ? totalMen(s) : DELEGATED_SHARE * totalMen(s);
  return r3(load);
}

/** o = load ÷ C. */
export function overloadOf(load: number, lea: number): number {
  return load / capacity(lea);
}

/** +1 order-delay step per doubling above capacity (o = 2 → 1, o = 4 → 2). */
export function orderDelaySteps(o: number): number {
  return o > 1 ? Math.floor(Math.log2(o) + 1e-9) : 0;
}

/** Morale losses × (1 + 0.5 × log₂ o) when o > 1: gradual, no jump at a band edge (ch. 12b). */
export function moraleLossFactor(o: number): number {
  return o > 1 ? 1 + 0.5 * Math.log2(o) : 1;
}

export function commandStrain(n: CommandNode): { capacity: number; load: number; overload: number; overloaded: boolean; delaySteps: number; moraleFactor: number } {
  const load = commandLoad(n);
  const o = overloadOf(load, n.lea);
  return { capacity: capacity(n.lea), load, overload: o, overloaded: o > 1, delaySteps: orderDelaySteps(o), moraleFactor: moraleLossFactor(o) };
}

// ───────────── Power ranks F–S (Numbers §1, WB ch. 5) ─────────────

export type Letter = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export const LETTERS: readonly Letter[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
/** Band floors: F 0 · E 15 · D 30 · C 45 · B 60 · A 75 · S 90 (S runs to 100). */
export const BAND_MIN: readonly number[] = [0, 15, 30, 45, 60, 75, 90];

export interface PowerRank { letter: Letter; sign: '+' | '-' | ''; label: string; step: number }

/** Letter plus ± for the top/bottom third of the band (S: 90–93 −, 94–96, 97–100 +). */
export function powerRank(score: number): PowerRank {
  const s = clamp(score, 0, 100);
  let step = 0;
  for (let i = 0; i < BAND_MIN.length; i++) if (s >= BAND_MIN[i]) step = i;
  const lo = BAND_MIN[step];
  const width = (BAND_MIN[step + 1] ?? 100) - lo;
  const sign = (s - lo) * 3 < width ? '-' : (s - lo) * 3 >= 2 * width ? '+' : '';
  const letter = LETTERS[step];
  return { letter, sign, label: letter + sign, step };
}

export type Side = 'warrior' | 'commander' | 'statesman';
export interface Stats4 { LEA: number; VAL: number; INT: number; POL: number }
export interface PowerScores { warrior: number; commander: number; statesman: number; overall: number; side: Side }

/** Numbers §1: Warrior = (VAL + best style) ÷ 2 · Commander = (LEA + INT) ÷ 2 · Statesman = (POL + INT) ÷ 2 · Overall = highest
 * (ties: warrior → commander → statesman). Reads stats only, never birth or rank. */
export function powerScores(stats: Stats4, styles: Readonly<Record<string, number>> | number = 0): PowerScores {
  const best = typeof styles === 'number' ? styles : Math.max(0, ...Object.values(styles));
  const warrior = (stats.VAL + best) / 2;
  const commander = (stats.LEA + stats.INT) / 2;
  const statesman = (stats.POL + stats.INT) / 2;
  const overall = Math.max(warrior, commander, statesman);
  const side: Side = warrior === overall ? 'warrior' : commander === overall ? 'commander' : 'statesman';
  return { warrior, commander, statesman, overall, side };
}

/** "B+ (Warrior B+ / Commander C / Statesman D-)"; signs = false gives "B (Warrior B / …)". */
export function powerLabel(p: PowerScores, signs = true): string {
  const l = (x: number) => (signs ? powerRank(x).label : powerRank(x).letter);
  return `${l(p.overall)} (Warrior ${l(p.warrior)} / Commander ${l(p.commander)} / Statesman ${l(p.statesman)})`;
}

/** Both ranks side by side, as the dashboard shows them (twin-brother rule: one from stats, one from career). */
export function dashboardRanks(stats: Stats4, styles: Readonly<Record<string, number>>, rank: RankId, men?: number): { power: string; command: string } {
  return { power: powerLabel(powerScores(stats, styles)), command: rankLabel(rank, men) };
}

// ───────────── Abilities: count by Overall Rank and the rank+1 rule (WB ch. 5) ─────────────

export type AbilityType = 'combat' | 'command' | 'political' | 'special';
export interface AbilityRec {
  id: string;
  rank: Letter;
  type: AbilityType;
  /** Linked sub-rank; required for 'special' (set per ability). */
  side?: Side;
  /** Bloodline/legendary exception: may exceed the rank limit (but starts at very low mastery). */
  bloodline?: boolean;
}

const TYPE_SIDE: Record<Exclude<AbilityType, 'special'>, Side> = { combat: 'warrior', command: 'commander', political: 'statesman' };

export function abilitySide(a: AbilityRec): Side | null {
  return a.type === 'special' ? a.side ?? null : TYPE_SIDE[a.type];
}

/** An ability can be at most one step above its linked sub-rank (S stays S). */
export function abilityRankCap(sub: Letter): Letter {
  return LETTERS[Math.min(LETTERS.indexOf(sub) + 1, LETTERS.length - 1)];
}

export function checkAbilityRank(a: AbilityRec, p: PowerScores): { ok: boolean; cap: Letter | null; reason?: string } {
  const side = abilitySide(a);
  if (!side) return { ok: false, cap: null, reason: `${a.id}: a special ability needs a linked sub-rank` };
  const cap = abilityRankCap(powerRank(p[side]).letter);
  if (a.bloodline || LETTERS.indexOf(a.rank) <= LETTERS.indexOf(cap)) return { ok: true, cap };
  return { ok: false, cap, reason: `${a.id}: rank ${a.rank} is above ${cap} (one step above its ${side} rank)` };
}

export interface AbilityExpectation { expected: readonly [number, number]; max: number; topAtLeast?: Letter; kind: string }

/** WB ch. 5 ability count by Overall Rank. `max` is the hard limit (at the maximum a new one replaces or merges);
 * `expected` and `topAtLeast` are expectations only (abilities come from events, not rank-ups). */
export const ABILITY_COUNT: Record<Letter, AbilityExpectation> = {
  F: { expected: [0, 0], max: 0, kind: '–' },
  E: { expected: [0, 0], max: 0, kind: '–' },
  D: { expected: [0, 0], max: 1, kind: 'near-death / extreme training only' },
  C: { expected: [1, 1], max: 2, kind: 'usually a common technique' },
  B: { expected: [2, 2], max: 3, kind: 'first unique ability likely' },
  A: { expected: [2, 4], max: 4, topAtLeast: 'B', kind: 'mostly unique' },
  S: { expected: [3, 5], max: 5, topAtLeast: 'A', kind: 'S-rank abilities only for the very top' },
};

export function checkAbilities(list: readonly AbilityRec[], p: PowerScores): { ok: boolean; max: number; problems: string[]; asExpected: boolean } {
  const exp = ABILITY_COUNT[powerRank(p.overall).letter];
  const problems: string[] = [];
  if (list.length > exp.max) problems.push(`${list.length} abilities, at most ${exp.max} at Overall ${powerRank(p.overall).letter}: replace or merge`);
  for (const a of list) {
    const r = checkAbilityRank(a, p);
    if (!r.ok && r.reason) problems.push(r.reason);
  }
  const inCount = list.length >= exp.expected[0] && list.length <= exp.expected[1];
  const top = exp.topAtLeast;
  const hasTop = !top || list.some(a => LETTERS.indexOf(a.rank) >= LETTERS.indexOf(top));
  return { ok: problems.length === 0, max: exp.max, problems, asExpected: inCount && hasTop };
}

/** Room for one more ability without replacing or merging. */
export function canGainAbility(list: readonly AbilityRec[], p: PowerScores): boolean {
  return list.length < ABILITY_COUNT[powerRank(p.overall).letter].max;
}
