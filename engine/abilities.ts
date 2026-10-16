import { has, li } from './engine';
import { injuriesOf } from './engine';
import { rankLetter, rankScores } from './rules';
import { reputationMerit } from './reputation';
import { DuelMove } from './duel';
import { Character, Draft, GameState } from './types';

// Abilities, the Zone, style techniques, aura and general type (World Bible ch. 5, 10.5, 12b; VISIE §3–§4). Phase 6
// block C (audit gaps 5, 19), built Oct 17. Abilities are data records; limits and the rank+1 rule are enforced here.
// Every effect changes OPTIONS (Numbers §4: "abilities preferably change options"), never a hidden dice roll.
// PROVISIONAL numbers (owner kan terugdraaien) are marked.

export type AbilityKind = 'combat' | 'command' | 'political' | 'special';
export interface Ability { id: string; name: string; kind: AbilityKind; rank: string; mastery: number }

interface Spec {
  name: string; kind: AbilityKind; origin: 'common' | 'unique' | 'bloodline'; active: boolean; rank: string;
  effect: string; limit: string; cost: string; trigger: string; weakness: string; blockedBy: string[];
}

/** The abilities the code knows (WB ch. 5 table and ch. 10.5). */
export const ABILITIES: Record<string, Spec> = {
  zone: { name: 'Zone – SHINKEN NO RYŪ', kind: 'combat', origin: 'unique', active: true, rank: 'C', effect: "while it lasts, Li's choice beats his opponent's every round", limit: '1–5 rounds, 3–5 uses a battle, growing with mastery', cost: 'exhaustion when it ends (+2 fatigue)', trigger: 'a true near-death moment', weakness: 'a time limit: an enemy who stalls waits it out', blockedBy: [] },
  twin_demon_dance: { name: 'Twin Demon Dance', kind: 'combat', origin: 'bloodline', active: false, rank: 'C', effect: "Li's feint also beats a direct attack", limit: 'always on with two swords', cost: 'none', trigger: 'learned from someone who saw Hattori Takeshi fight, or from the notes kept with Hikari', weakness: 'needs two good arms', blockedBy: ['sword arm', 'shoulder'] },
  kage_no_yaiba: { name: 'Kage no Yaiba (Shadow Blade)', kind: 'combat', origin: 'bloodline', active: true, rank: 'B', effect: 'once a fight, an attack that goes through a counter', limit: 'once a fight', cost: 'none', trigger: 'needs the blade Kage in Li\'s hands', weakness: 'only with Kage', blockedBy: ['sword arm'] },
  zanshin: { name: 'Zanshin', kind: 'combat', origin: 'common', active: false, rank: 'D', effect: 'reading an opponent counts double (+10% a round watched, max +15%)', limit: 'always on', cost: 'none', trigger: 'long training with a master', weakness: 'none: only patience', blockedBy: [] },
  iron_wall: { name: 'Iron Wall', kind: 'command', origin: 'common', active: false, rank: 'D', effect: "Li's unit takes half the morale shock from losses", limit: 'always on in battle', cost: 'none', trigger: 'Kurogane drill under a strict commander', weakness: 'slow to move', blockedBy: [] },
  gale_march: { name: 'Gale March', kind: 'command', origin: 'unique', active: false, rank: 'C', effect: "Li's push hits twice as hard (+30% instead of +15%)", limit: 'always on in battle', cost: 'his unit tires faster when pushing', trigger: 'a victory won by speed', weakness: 'a strong defence blunts it', blockedBy: [] },
  silver_tongue: { name: 'Silver Tongue', kind: 'political', origin: 'common', active: false, rank: 'D', effect: 'court and house standing move up to ±15 a scene instead of ±10', limit: 'always on', cost: 'none', trigger: 'a negotiation won against a master', weakness: 'useless against a man who has decided', blockedBy: [] },
};

const LETTERS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
const li_ = (s: GameState) => li(s);
export const abilitiesOf = (c: Character): Ability[] => (c.abilities ?? []) as Ability[];
/** Li's abilities; a life from before the records that already woke the Zone (knowledge key) has it at mastery 1. */
export function liAbilities(s: GameState): Ability[] {
  const list = abilitiesOf(li(s));
  return s.knowledge.includes('shinken_no_ryu') && !list.some((a) => a.id === 'zone')
    ? [...list, { id: 'zone', name: ABILITIES.zone.name, kind: 'combat', rank: 'C', mastery: 1 }] : list;
}
export const hasAbility = (s: GameState, id: string, c: Character = li_(s)) => (c.id === s.liId ? liAbilities(s) : abilitiesOf(c)).some((a) => a.id === id)
  && !ABILITIES[id]?.blockedBy.some((area) => injuriesOf(s, c.id).includes(area));

/** What Li brings into a duel: the Zone (if woken), his chosen techniques for his style, his abilities, his aura. */
export function duelExtras(s: GameState, style: string, foeVal: number, foeMastery: number) {
  const z = liAbilities(s).find((a) => a.id === 'zone');
  const aura = auraDuel(s, foeVal, foeMastery);
  return {
    zone: z ? { rounds: zoneRounds(z.mastery), left: 0, uses: zoneUses(z.mastery), used: 0 } : undefined,
    liBonus: techBonuses(s, style),
    liAbilities: Object.keys(ABILITIES).filter((id) => hasAbility(s, id)),
    foeHesitates: aura.foeHesitates,
    liFatigue: aura.liFatigue,
  };
}

/** WB ch. 5: how many abilities an overall rank holds at most. */
const MAX_BY_RANK: Record<string, number> = { F: 0, E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
const letter = (score: number) => rankLetter(score).replace(/[+-]/, '');
const linkedScore = (c: Character, kind: AbilityKind) => { const r = rankScores(c); return kind === 'command' ? r.commander : kind === 'political' ? r.statesman : r.warrior; };

/** What a new ability needs beyond the general rules (its trigger, ch. 10.5). */
function triggerMet(s: GameState, id: string): string | null {
  const c = li_(s);
  if (id === 'zone') return has(s, 'near_death') ? null : 'the Zone wakes only at a true near-death moment';
  if (id === 'twin_demon_dance') {
    if ((c.styles.two_swords ?? 0) < 30) return 'the Twin Demon Dance needs two-sword mastery 30 first';
    const witnesses = ['raizen', 'tono_shigemasa', 'shiraiwa_yasutoki', 'akabane_gendayu'];
    return has(s, 'hikari_notes') || witnesses.some((w) => has(s, `met_${w}`) && (s.relations[w]?.base.trust ?? 0) >= 60) ? null : 'only someone who saw Hattori Takeshi fight (and trusts Li), or the notes kept with Hikari, can teach it';
  }
  if (id === 'kage_no_yaiba') return has(s, 'has_kage') ? null : 'Kage no Yaiba needs the blade Kage in Li\'s hands';
  return null;
}

/** {kind:"ability", id, reason, upgrade?}: Li gains an ability through an event, or one grows a rank (mastery 100 + a big event). */
export function abilityDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const c = li_(s);
  const id = String(x.id ?? '');
  const spec = ABILITIES[id];
  const why = String(x.reason ?? '').trim().slice(0, 140);
  if (!spec) { notes.push(`no ability "${id}" (known: ${Object.keys(ABILITIES).join(', ')})`); return []; }
  if (!why) { notes.push(`${spec.name} comes only through an event: give the reason`); return []; }
  const have = abilitiesOf(c).find((a) => a.id === id);
  if (x.upgrade) {
    if (!have) { notes.push(`Li does not have ${spec.name}`); return []; }
    if (have.mastery < 100) { notes.push(`${spec.name} grows a rank only at mastery 100 (now ${Math.floor(have.mastery)})`); return []; }
    const next = LETTERS[Math.min(6, LETTERS.indexOf(have.rank) + 1)];
    if (spec.origin === 'common' && LETTERS.indexOf(next) > LETTERS.indexOf(letter(linkedScore(c, spec.kind))) + 1) { notes.push(`${spec.name} cannot be more than one rank above Li's ${spec.kind} rank`); return []; }
    return [{ type: 'ability', fact: `${spec.name} grows: rank ${have.rank} → ${next}`, visible: true, data: { char: c.id, ability: { ...have, rank: next, mastery: 1 } } }];
  }
  if (have) { notes.push(`Li already has ${spec.name}`); return []; }
  const blocked = triggerMet(s, id);
  if (blocked) { notes.push(blocked); return []; }
  const overall = letter(rankScores(c).overall);
  const exempt = spec.origin !== 'common'; // bloodline and Li's unique ability: the prodigy rule (ch. 5) lets them come early
  if (!exempt && abilitiesOf(c).length >= MAX_BY_RANK[overall]) { notes.push(`at overall rank ${overall} Li can hold at most ${MAX_BY_RANK[overall]} abilities`); return []; }
  if (!exempt && LETTERS.indexOf(spec.rank) > LETTERS.indexOf(letter(linkedScore(c, spec.kind))) + 1) { notes.push(`${spec.name} (${spec.rank}) is more than one rank above Li's ${spec.kind} rank`); return []; }
  return [{ type: 'ability', fact: id === 'zone' ? 'SHINKEN NO RYŪ' : `Li gains an ability: ${spec.name}`, visible: true, journal: id === 'zone' ? 'Everything went quiet and slow. I could see every move before it came.' : `I have learned ${spec.name}.`, data: { char: c.id, ability: { id, name: spec.name, kind: spec.kind, rank: spec.rank, mastery: 1 } } }];
}

// ── The Zone in a duel (VISIE §3: "Zone: 2 rounds left · 1 of 3 uses") ──

/** PROVISIONAL: rounds 1 + mastery/25 (1–5); uses a battle 3 + mastery/50 (3–5). */
export const zoneRounds = (mastery: number) => 1 + Math.floor(Math.min(100, mastery) / 25);
export const zoneUses = (mastery: number) => 3 + Math.floor(Math.min(100, mastery) / 50);

/** Mastery after a real fight in which the Zone was used: +2 a use (PROVISIONAL), real danger only. */
export function zoneGrowthDrafts(s: GameState, uses: number, deadly: boolean): Draft[] {
  const z = liAbilities(s).find((a) => a.id === 'zone');
  if (!z || !uses || !deadly) return [];
  return [{ type: 'ability', fact: `the Zone deepens (mastery ${Math.floor(z.mastery)} → ${Math.floor(Math.min(100, z.mastery + 2 * uses))})`, visible: false, data: { char: li_(s).id, ability: { ...z, mastery: Math.min(100, z.mastery + 2 * uses) } } }];
}

// ── Style techniques (WB ch. 5: at mastery 30/50/70/100, choose 1 of 2) ──

export const TECH_LEVELS = [30, 50, 70, 100] as const;
interface Tech { name: string; move: DuelMove; bonus: number; extra?: string }
const TWO_SWORDS: [Tech, Tech][] = [
  [{ name: 'Twin Fang', move: 'attack', bonus: 0.1 }, { name: 'Cross Guard', move: 'counter', bonus: 0.1 }],
  [{ name: 'Falling Leaves', move: 'feint', bonus: 0.1 }, { name: 'Still Water', move: 'observe', bonus: 0.1 }],
  [{ name: 'Storm of Blades', move: 'attack', bonus: 0.15 }, { name: 'Mirror Stance', move: 'counter', bonus: 0.15 }],
  [{ name: "Dragon's Coil", move: 'feint', bonus: 0.15 }, { name: 'Empty Sky', move: 'observe', bonus: 0.15 }],
];
const GENERIC: [Tech, Tech][] = [
  [{ name: 'Strong Strike', move: 'attack', bonus: 0.1 }, { name: 'Firm Guard', move: 'counter', bonus: 0.1 }],
  [{ name: 'Deceiver', move: 'feint', bonus: 0.1 }, { name: 'Patient Eye', move: 'observe', bonus: 0.1 }],
  [{ name: 'Crushing Blow', move: 'attack', bonus: 0.15 }, { name: 'Iron Guard', move: 'counter', bonus: 0.15 }],
  [{ name: 'Phantom Step', move: 'feint', bonus: 0.15 }, { name: 'Clear Mind', move: 'observe', bonus: 0.15 }],
];
export const techOptions = (style: string, level: number): [Tech, Tech] => (style === 'two_swords' ? TWO_SWORDS : GENERIC)[TECH_LEVELS.indexOf(level as 30)];
const techKey = (style: string, level: number) => `tech_${style}_${level}`;

/** Unlocks waiting for Li's choice. */
export function pendingTechniques(s: GameState): { style: string; level: number; options: [Tech, Tech] }[] {
  const c = li_(s);
  const out: { style: string; level: number; options: [Tech, Tech] }[] = [];
  for (const [style, m] of Object.entries(c.styles)) for (const level of TECH_LEVELS) if (m >= level && !has(s, techKey(style, level))) out.push({ style, level, options: techOptions(style, level) });
  return out;
}

/** The player chooses (pick 1 or 2). */
export function chooseTechniqueDrafts(s: GameState, style: string, level: number, pick: 1 | 2): Draft[] {
  if (!pendingTechniques(s).some((p) => p.style === style && p.level === level)) return [];
  const t = techOptions(style, level)[pick - 1];
  return [{ type: 'flag', fact: `Li's ${style.replace('_', ' ')} gains a technique: ${t.name}`, visible: true, journal: `I found a new way to move: ${t.name}.`, data: { key: techKey(style, level), value: pick } }];
}

/** Li's chosen techniques for a style: +bonus to a move (capped with all situational modifiers at ±50%, Numbers §4). */
export function techBonuses(s: GameState, style: string): Partial<Record<DuelMove, number>> {
  const out: Partial<Record<DuelMove, number>> = {};
  if (style === 'two_swords' && injuriesOf(s, li_(s).id).includes('sword arm')) return out; // ch. 5: injuries block two-sword techniques
  for (const level of TECH_LEVELS) {
    const pick = has(s, techKey(style, level));
    if (!pick) continue;
    const t = techOptions(style, level)[pick - 1];
    out[t.move] = Math.max(out[t.move] ?? 0, t.bonus);
  }
  return out;
}
export const chosenTechniques = (s: GameState) => Object.keys(li_(s).styles).flatMap((style) =>
  TECH_LEVELS.filter((l) => has(s, techKey(style, l))).map((l) => techOptions(style, l)[has(s, techKey(style, l)) - 1].name));

// ── Aura (WB ch. 5, ch. 12b: morale and the opponent's choices only) and general type ──

/** PROVISIONAL: aura = overall rank score + a fifth of soldiers' and nobles' regard. */
export const auraScore = (c: Character, s?: GameState) => rankScores(c).overall + (s && c.id === s.liId ? reputationMerit(s) / 5 : 0);
export const auraWord = (score: number) => (score >= 90 ? 'overwhelming' : score >= 75 ? 'strong' : score >= 60 ? 'felt by all' : score >= 45 ? 'felt by some' : 'faint');
const bandOf = (score: number) => Math.min(6, Math.floor(Math.max(0, score) / 15));

/** Aura in a duel: an opponent 2+ ranks below hesitates (watches) for a round, 3+ for two; a much stronger foe weighs on Li (+1 fatigue). */
export function auraDuel(s: GameState, foeVal: number, foeMastery: number): { foeHesitates: number; liFatigue: number } {
  const liBand = bandOf(auraScore(li_(s), s));
  const foeBand = bandOf((foeVal + foeMastery) / 2);
  const gap = liBand - foeBand;
  return { foeHesitates: gap >= 3 ? 2 : gap >= 2 ? 1 : 0, liFatigue: gap <= -2 ? 1 : 0 };
}

/** Aura in a battle: enemy units in Li's sector lose morale when his aura is 2+ ranks above their commander's (−10, −15 at 3+). */
export function auraBattleShock(s: GameState, enemyLea: number): number {
  const gap = bandOf(auraScore(li_(s), s)) - bandOf(enemyLea);
  return gap >= 3 ? -15 : gap >= 2 ? -10 : 0;
}

/** WB ch. 5 general type, read from how he thinks (PROVISIONAL: LEA vs INT by 10 or more). */
export function generalType(c: Character): 'Instinctual' | 'Intellectual' | 'Balanced' {
  return c.stats.INT >= c.stats.LEA + 10 ? 'Intellectual' : c.stats.LEA >= c.stats.INT + 10 ? 'Instinctual' : 'Balanced';
}

/** For Claude's memory and the Li tab. */
export function abilitiesText(s: GameState): string {
  const c = li_(s);
  const ab = liAbilities(s).map((a) => {
    const sp = ABILITIES[a.id];
    const blocked = sp && !hasAbility(s, a.id) ? ' (BLOCKED by an injury)' : '';
    return `- ${a.name} (rank ${a.rank}, mastery ${Math.floor(a.mastery)}): ${sp?.effect ?? ''}. Limit: ${sp?.limit}. Cost: ${sp?.cost}. Weakness: ${sp?.weakness}.${blocked}`;
  });
  const tech = chosenTechniques(s);
  const pend = pendingTechniques(s);
  return [
    `LI'S ABILITIES (the code runs them in fights; give a new one only with {"kind":"ability","id":"<${Object.keys(ABILITIES).join('|')}>","reason":"the event"}): ${ab.length ? `\n${ab.join('\n')}` : 'none yet.'}`,
    tech.length ? `Techniques Li has chosen: ${tech.join(', ')}.` : '',
    pend.length ? `A new technique is waiting for the player's choice in the Li tab (${pend.map((p) => `${p.style.replace('_', ' ')} ${p.level}`).join(', ')}).` : '',
    `Li's aura: ${auraWord(auraScore(c, s))} (it moves morale and makes weaker foes hesitate; never strength). General type: ${generalType(c)}.`,
  ].filter(Boolean).join('\n');
}

/** Silver Tongue: court and house standing move ±15 a scene instead of ±10. */
export const influenceCap = (s: GameState, base: number) => (hasAbility(s, 'silver_tongue') ? base + 5 : base);
