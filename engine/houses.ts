import { ageOn, dateFromIndex } from './calendar';
import { has, li, met, today } from './engine';
import { careerOf } from './gm-career';
import { rankLevel } from './career';
import { opinion } from './relations';
import { domainSummary } from './domain';
import { heirOf } from './family';
import { HIDDEN_PEOPLE, HOUSES, PEOPLE, PersonRow, WORLD_PLACES } from './world-people';
import { Character, Draft, GameState, House, StatKey } from './types';

// Houses and the world's people (World Bible ch. 2–3, 13c; Atlas §3–§5, §10). Phase 6 block B (audit gaps 1, 2, 8),
// built Oct 17; every number marked PROVISIONAL is a default the owner can change (owner kan terugdraaien).
// The world arrives as ONE recorded event (never in createWorld), so old saves replay exactly and get it on their next scene.

// ── Numbers (PROVISIONAL, Oct 17) ──
export const HOUSE_RULES = {
  /** Per scene, what Claude may move a house by (prestige, loyalty, cohesion); troops by this share. */
  delta: 10, troopShare: 0.1,
  /** Lifespans: 60–79 by a fixed hash of the id; never sooner than 4 years from Year 100. */
  lifeMin: 60, lifeSpread: 20, lifeAfterStart: 4,
  /** Yearly cohesion drift. */
  oldHead: 65, driftOld: -5, driftNoHeir: -5, driftCalm: 3, cohesionCap: 80,
  /** Succession costs cohesion; a child heir costs more. */
  succession: -10, regency: -15,
  /** Gekokujō: below this at the turn of a year, the house splits or a retainer takes it. */
  gekokujo: 25,
  /** A branch that breaks away takes its land; the main house is shaken back to this cohesion. */
  afterSplit: 50,
  /** Adoption: Li must be at least this rank and the head's opinion of him at least this. */
  adoptRank: 'hyakuningashira', adoptOpinion: 60,
  /** Li may found his own house from Sanbyakunin-shō with land. */
  foundRank: 'sanbyakuninsho',
  /** Marriage alliance: prestige for both, cohesion for both. */
  alliancePrestige: 5, allianceCohesion: 5,
  /** A hostage held: loyalty up while held; a hostage harmed: loyalty crashes. */
  hostageHeld: 15, hostageHarmed: -30,
} as const;

const LETTER: Record<string, number> = { F: 7, E: 22, D: 37, C: 52, B: 67, A: 82, S: 95 };
const hash = (x: string) => { let h = 7; for (const ch of x) h = (h * 31 + ch.charCodeAt(0)) % 100_003; return h; };
const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(x)));

/** "S B · C C · W D+" → stats (Numbers §1 read backwards: W = VAL and style, C = LEA, S = POL; INT from C and S). */
export function statsFromRanks(ranks: string, age: number): { stats: Record<StatKey, number>; mastery: number } {
  const v: Record<string, number> = {};
  for (const m of ranks.matchAll(/([WCS])\s*([FEDCBAS])([+-]?)/g)) v[m[1]] = LETTER[m[2]] + (m[3] === '+' ? 4 : m[3] === '-' ? -4 : 0);
  const base = age < 12 ? 6 : age < 16 ? 14 : 22;
  const C = v.C ?? base, S = v.S ?? base, W = v.W ?? base;
  return { stats: { LEA: C, VAL: W, INT: Math.max(C, S, base), POL: S }, mastery: W };
}

function personOf(r: PersonRow): Character {
  const [id, name, age, ranks, role, , house, place, , , traits] = r;
  const { stats, mastery } = statsFromRanks(ranks, age);
  const young = age <= 20;
  const pot = (k: StatKey) => Math.min(99, young ? Math.max(stats[k] + 30, 70 + (hash(id + k) % 25)) : stats[k] + 5);
  // The Atlas age is the age on Year 100, Month 1, Day 1; the birthday comes later in the year.
  const month = 1 + (hash(id) % 12), day = 1 + (hash(id + "d") % 28);
  const born = { year: 100 - age - (month > 1 || day > 1 ? 1 : 0), month, day };
  return {
    id, name, born, role, status: /^(King|Queen|Crown Prince|Prince|Lord|Lady|Regent|Chancellor)/.test(name) || house ? 'noble' : 'free',
    stats, potential: { LEA: pot('LEA'), VAL: pot('VAL'), INT: pot('INT'), POL: pot('POL') },
    styles: mastery > 22 ? { sword: mastery } : {}, skills: {}, wound: 0, healDays: 0, fatigue: 0,
    traits: traits ? traits.split(/,\s*/) : [], location: place, alive: true, desc: role, publicRank: '?',
    house: house || undefined, world: true, lifespan: lifespanOf(id, age),
  };
}

/** PROVISIONAL: a hidden age of death, fixed by the id (no chance). The Tatara king's death is his fuse's, not age. */
export function lifespanOf(id: string, age: number): number | undefined {
  if (id === 'li') return undefined;
  if (id === 'tatara_shigekuni') return 999;
  return Math.max(HOUSE_RULES.lifeMin + (hash(id) % HOUSE_RULES.lifeSpread), age + HOUSE_RULES.lifeAfterStart);
}

/** The world's houses and people, once (a new life, or an old save on its next scene). */
export function worldDrafts(s: GameState): Draft[] {
  if (s.houses) return [];
  const houses: House[] = HOUSES.map((h) => ({ ...h, branches: h.branches ?? [], allies: h.allies ?? [] }));
  const people = PEOPLE.filter((r) => !s.characters[r[0]]).map(personOf);
  const agendas: Record<string, { goal: string; secret?: string }> = {};
  for (const r of PEOPLE) agendas[r[0]] = { goal: r[8], secret: r[9] };
  // The start cast joins its houses and gets lifespans too.
  const members: Record<string, { house?: string; lifespan?: number }> = {};
  for (const c of Object.values(s.characters)) {
    if (c.lifespan !== undefined || c.id === s.liId) continue;
    members[c.id] = { house: c.id === 'sayo' ? 'hagiwara' : c.id === 'ishizue' ? 'ishizue' : c.house, lifespan: lifespanOf(c.id, ageOn(c.born, { year: 100, month: 1, day: 1, part: 'morning' })) };
  }
  return [{ type: 'world', fact: 'The houses and lords of the land are set down', visible: false, data: { houses, people, agendas, members } }];
}

export const houses = (s: GameState): House[] => Object.values(s.houses ?? {});
export const houseOf = (s: GameState, id: string): House | undefined => s.houses?.[id];
const nameOf = (s: GameState, id?: string) => (id && s.characters[id] ? s.characters[id].name : '—');
const ageOfId = (s: GameState, id?: string) => (id && s.characters[id] ? ageOn(s.characters[id].born, s.date) : 0);
const houseDraft = (h: House, fact: string, visible = false, person?: Character, journal?: string): Draft =>
  ({ type: 'house', fact, visible, journal, data: { house: h, person } });

/** The kingdom Li is in now (the one he serves). */
const liKingdom = (s: GameState) => careerOf(s).kingdom;
/** Li hears of a house's news when it is of his own kingdom, or he knows its head. */
const newsFor = (s: GameState, h: House) => h.kingdom === liKingdom(s) || (h.head ? met(s, h.head) : false) || h.id === 'li';

// ── Succession (WB 13c rule 4: heirs take over) ──

/** Members of a house, alive, oldest first (fixed order: age, then id). */
const membersOf = (s: GameState, houseId: string, but?: string) => Object.values(s.characters)
  .filter((c) => c.alive && c.house === houseId && c.id !== but && c.id !== s.liId)
  .sort((a, b) => ageOn(b.born, s.date) - ageOn(a.born, s.date) || a.id.localeCompare(b.id));

const GIVEN = ['Masanori', 'Yoshitaka', 'Harunobu', 'Tadashige', 'Nobutsuna', 'Kagenori', 'Sadayuki', 'Morotada'];
/** A new head when a house has nobody left: a cousin from a side branch (PROVISIONAL generic name, unmet). */
function cousin(s: GameState, h: House): Character {
  const id = `${h.id}_${GIVEN[hash(h.id + today(s)) % GIVEN.length].toLowerCase()}_${today(s)}`;
  const given = GIVEN[hash(h.id + today(s)) % GIVEN.length];
  return {
    id, name: `${h.name} ${given}`, born: { year: s.date.year - 34, month: 1, day: 1 }, role: `head of the ${h.name}, a cousin from a side branch`, status: 'noble',
    stats: { LEA: 40, VAL: 35, INT: 40, POL: 45 }, potential: { LEA: 50, VAL: 40, INT: 50, POL: 55 }, styles: {}, skills: {},
    wound: 0, healDays: 0, fatigue: 0, traits: [], location: (h.head && s.characters[h.head]?.location) || 'seikyo', alive: true, desc: `A cousin of the ${h.name} who took the house when no heir was left.`,
    publicRank: '?', house: h.id, world: true, lifespan: 70,
  };
}

/** A person died: if they led a house, the heir takes over (or the oldest of the blood, or a cousin). */
export function successionDrafts(s: GameState, dead: string): Draft[] {
  const out: Draft[] = [];
  for (const h of houses(s)) {
    if (h.fallen) continue;
    if (h.heir === dead) {
      const next = membersOf(s, h.id, dead).find((c) => c.id !== h.head);
      out.push(houseDraft({ ...h, heir: next?.id }, `${h.name}: a new heir, ${next?.name ?? 'none yet'}`, newsFor(s, h)));
      continue;
    }
    if (h.head !== dead || h.id === 'li') continue;
    const heir = h.heir && h.heir !== dead && s.characters[h.heir]?.alive ? s.characters[h.heir] : membersOf(s, h.id, dead)[0];
    let person: Character | undefined;
    const head = heir ?? (person = cousin(s, h));
    const child = ageOn(head.born, s.date) < 15;
    const nextHeir = membersOf(s, h.id, dead).find((c) => c.id !== head.id);
    const cohesion = clamp(h.cohesion + HOUSE_RULES.succession + (child || !heir ? HOUSE_RULES.regency : 0));
    out.push(houseDraft({ ...h, head: head.id, heir: nextHeir?.id, cohesion },
      `${head.name} now leads the ${h.name}${child ? ' (a child: the elders rule for him)' : ''}${heir ? '' : ' (no heir was left: a cousin takes the house)'}`, newsFor(s, h), person));
  }
  return out;
}

// ── Time: age, death of age, genpuku, the houses' year ──

/** Every month that ends: deaths of age and genpuku; every year that ends: the houses' cohesion and gekokujō. */
export function houseTimeDrafts(s: GameState, from: number, to: number): Draft[] {
  if (!s.houses) return [];
  const out: Draft[] = [];
  for (let k = from + 1; k <= to; k++) {
    if (k % 30 !== 0) continue;
    const date = dateFromIndex(k);
    for (const c of Object.values(s.characters)) {
      if (!c.alive) continue;
      const age = ageOn(c.born, date);
      if (c.lifespan !== undefined && c.id !== s.liId && age >= c.lifespan) {
        out.push({ type: 'status', fact: `${c.name} dies of old age`, visible: met(s, c.id) || (c.house ? newsFor(s, s.houses[c.house] ?? ({} as House)) : false), journal: met(s, c.id) ? `${c.name} is dead. Old age took him in the end.` : undefined, data: { char: c.id, status: c.status, role: c.role, alive: false } });
        // Succession reads the state as it is now: give it the dead man as dead.
        const was = c.alive; c.alive = false;
        out.push(...successionDrafts(s, c.id));
        c.alive = was;
        continue;
      }
      // Genpuku (WB ch. 4, GE 3b): a noble or free boy or girl of 15 comes of age; Li's is a legend moment when he is free.
      const key = `genpuku_${c.id}`;
      if (age >= 15 && !has(s, key) && (c.id === s.liId ? c.status !== 'slave' : (c.world || c.house || c.id.startsWith('child_')) && age <= 16)) {
        const isLi = c.id === s.liId;
        out.push({ type: 'flag', fact: isLi ? 'Li comes of age: his genpuku, his first grown man\'s name and topknot' : `${c.name} comes of age (genpuku)`, visible: isLi || met(s, c.id), journal: isLi ? 'Today I came of age. A grown man\'s topknot, and nobody owns it.' : undefined, data: { key, value: 1, genpuku: c.id } });
      }
    }
    if (k % 360 === 0) out.push(...houseYearDrafts(s));
  }
  return out;
}

/** The turn of a year: cohesion drifts with the head's age and the heir; below the line, gekokujō. */
function houseYearDrafts(s: GameState): Draft[] {
  const out: Draft[] = [];
  for (const h of houses(s)) {
    if (h.fallen || h.id === 'li') continue;
    const headAge = ageOfId(s, h.head);
    const heirOk = !!h.heir && s.characters[h.heir]?.alive && ageOfId(s, h.heir) >= 15;
    const drift = (headAge >= HOUSE_RULES.oldHead ? HOUSE_RULES.driftOld : 0) + (heirOk ? 0 : HOUSE_RULES.driftNoHeir);
    let cohesion = drift ? clamp(h.cohesion + drift) : Math.min(HOUSE_RULES.cohesionCap, h.cohesion + HOUSE_RULES.driftCalm);
    if (cohesion !== h.cohesion) out.push(houseDraft({ ...h, cohesion }, `${h.name} cohesion ${cohesion}`));
    if (cohesion >= HOUSE_RULES.gekokujo) continue;
    // Gekokujō (WB ch. 2 extra 1): the biggest branch breaks away with its land, or a retainer takes the house.
    const branch = [...h.branches].sort((a, b) => b.koku - a.koku || a.name.localeCompare(b.name))[0];
    if (branch) {
      const share = Math.min(0.4, branch.koku / Math.max(1, h.koku));
      const id = `${h.id}_${branch.name.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '')}`;
      const split: House = { id, name: branch.name, kingdom: h.kingdom, tier: h.tier === 'A' ? 'B' : 'C', land: `land torn from the ${h.name}`, koku: branch.koku, troops: Math.round(h.troops * share), prestige: clamp(h.prestige - 15), crownLoyalty: h.crownLoyalty, cohesion: 60, liege: h.liege, branches: [], allies: [] };
      cohesion = HOUSE_RULES.afterSplit;
      out.push(houseDraft(split, `Gekokujō: the ${branch.name} branch breaks away from the ${h.name}`, newsFor(s, h)));
      out.push(houseDraft({ ...h, koku: h.koku - branch.koku, troops: h.troops - split.troops, branches: h.branches.filter((b) => b !== branch), cohesion }, `${h.name} is weakened by the split`));
    } else {
      const person = cousin(s, h);
      person.role = `head of the ${h.name}, a retainer who seized the house`;
      person.desc = `A retainer who overthrew his lord and took the ${h.name}.`;
      out.push(houseDraft({ ...h, head: person.id, heir: undefined, prestige: clamp(h.prestige - 10), cohesion: HOUSE_RULES.afterSplit }, `Gekokujō: a retainer seizes the ${h.name}`, newsFor(s, h), person));
    }
  }
  return out;
}

// ── What Claude may propose (checked) ──

/** {kind:"house", house, prestige?, loyalty?, cohesion?, troops?, reason}: a house's fortunes move, ±10 a scene. */
export function houseChangeDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const h = houseOf(s, String(x.house ?? ''));
  if (!h) { notes.push(`no house "${String(x.house)}"`); return []; }
  const why = String(x.reason ?? '').trim().slice(0, 120);
  if (!why) { notes.push(`a change to the ${h.name} needs a reason`); return []; }
  const d = (v: unknown) => Math.max(-HOUSE_RULES.delta, Math.min(HOUSE_RULES.delta, Math.round(Number(v) || 0)));
  const troops = Math.round(Math.max(-HOUSE_RULES.troopShare, Math.min(HOUSE_RULES.troopShare, Number(x.troops) || 0)) * h.troops);
  const next: House = { ...h, prestige: clamp(h.prestige + d(x.prestige)), crownLoyalty: clamp(h.crownLoyalty + d(x.loyalty)), cohesion: clamp(h.cohesion + d(x.cohesion)), troops: Math.max(0, h.troops + troops) };
  if (JSON.stringify(next) === JSON.stringify(h)) return [];
  return [houseDraft(next, `${h.name}: ${why}`, newsFor(s, h))];
}

/** {kind:"alliance", a, b}: a marriage alliance between two houses (WB ch. 2 extra 3). "li" is Li's own house. */
export function allianceDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const a = houseOf(s, String(x.a ?? '')), b = houseOf(s, String(x.b ?? ''));
  if (!a || !b || a.id === b.id) { notes.push('an alliance needs two different houses'); return []; }
  if (a.allies.includes(b.id)) { notes.push(`the ${a.name} and the ${b.name} are already allied`); return []; }
  const up = (h: House, o: House): House => ({ ...h, allies: [...h.allies, o.id], prestige: clamp(h.prestige + HOUSE_RULES.alliancePrestige), cohesion: clamp(h.cohesion + HOUSE_RULES.allianceCohesion) });
  return [houseDraft(up(a, b), `A marriage binds the ${a.name} and the ${b.name}`, newsFor(s, a) || newsFor(s, b)), houseDraft(up(b, a), 'alliance')];
}

/** {kind:"hostage", house, npc, harmed?, released?}: a house gives a son or daughter as hostage (WB ch. 2 extra 2). */
export function hostageDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const h = houseOf(s, String(x.house ?? ''));
  if (!h) { notes.push(`no house "${String(x.house)}"`); return []; }
  if (x.harmed || x.released) {
    if (!h.hostage) { notes.push(`the ${h.name} has no hostage held`); return []; }
    const loy = x.harmed ? HOUSE_RULES.hostageHarmed : -HOUSE_RULES.hostageHeld;
    return [houseDraft({ ...h, hostage: undefined, crownLoyalty: clamp(h.crownLoyalty + loy) }, `${nameOf(s, h.hostage)} is ${x.harmed ? 'harmed: the ' + h.name + ' will not forgive it' : 'sent home'}`, newsFor(s, h))];
  }
  const npc = String(x.npc ?? '');
  if (s.characters[npc]?.house !== h.id || !s.characters[npc].alive) { notes.push(`a hostage must be a living member of the ${h.name}`); return []; }
  if (h.hostage) { notes.push(`the ${h.name} already has a hostage held`); return []; }
  return [houseDraft({ ...h, hostage: npc, crownLoyalty: clamp(h.crownLoyalty + HOUSE_RULES.hostageHeld) }, `The ${h.name} sends ${nameOf(s, npc)} as a hostage`, newsFor(s, h))];
}

/** {kind:"adopt", house}: a house with no grown heir adopts Li (WB ch. 2 extra 4: the rare route to a family name). */
export function adoptDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const h = houseOf(s, String(x.house ?? ''));
  const c = li(s);
  if (!h || h.id === 'li') { notes.push(`no house "${String(x.house)}"`); return []; }
  if (has(s, 'adopted')) { notes.push('Li already carries a house name'); return []; }
  if (c.status === 'slave') { notes.push('no house adopts a slave'); return []; }
  if (rankLevel(careerOf(s).rank) < rankLevel(HOUSE_RULES.adoptRank)) { notes.push('a house adopts only a proven officer (Hyakunin-gashira or higher)'); return []; }
  const heirOk = !!h.heir && s.characters[h.heir]?.alive && ageOfId(s, h.heir) >= 15;
  if (heirOk) { notes.push(`the ${h.name} has a grown heir; it does not adopt`); return []; }
  if (!h.head || !met(s, h.head) || !s.relations[h.head] || opinion(s.relations[h.head], today(s)) < HOUSE_RULES.adoptOpinion) { notes.push(`the head of the ${h.name} must know Li and think highly of him`); return []; }
  const k = houses(s).findIndex((y) => y.id === h.id) + 1;
  return [
    houseDraft({ ...h, heir: s.liId, cohesion: clamp(h.cohesion - 5) }, `The ${h.name} adopts Li as heir`, true, undefined, `Lord ${nameOf(s, h.head)} gave me his name. I am of the ${h.name} now.`),
    { type: 'status', fact: `Li becomes a son of the ${h.name}`, visible: true, data: { char: s.liId, status: 'noble', role: `adopted heir of the ${h.name}`, alive: true } },
    { type: 'flag', fact: 'adopted', visible: false, data: { key: 'adopted', value: k } },
  ];
}

/** {kind:"found_house", name}: Li founds his own house once he holds land as an officer (Stage 3 → his own name). */
export function foundHouseDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (s.houses?.li) { notes.push('Li\'s house already exists'); return []; }
  if (!s.domain) { notes.push('a house needs land first'); return []; }
  if (rankLevel(careerOf(s).rank) < rankLevel(HOUSE_RULES.foundRank)) { notes.push('Li founds a house from Sanbyakunin-shō'); return []; }
  const name = String(x.name ?? '').trim().slice(0, 30);
  if (!name) { notes.push('a house needs a name'); return []; }
  const v = domainSummary(s.domain, today(s));
  const h: House = { id: 'li', name, kingdom: liKingdom(s), tier: 'C', land: v.name, koku: s.domain.koku, troops: v.army.standing, prestige: 30, crownLoyalty: 80, cohesion: 70, head: s.liId, heir: heirOf(s), branches: [], allies: [] };
  return [houseDraft(h, `Li founds the house of ${name}`, true, undefined, `Today my name became a house: ${name}.`)];
}

// ── What Claude and the player see ──

const word = (v: number, w: [string, string, string]) => (v >= 65 ? w[0] : v >= 35 ? w[1] : w[2]);
export const cohesionWord = (v: number) => word(v, ['united', 'restless', 'divided']);
export const loyaltyWord = (v: number) => word(v, ['loyal', 'uncertain', 'disloyal']);
export const prestigeWord = (v: number) => word(v, ['great', 'respected', 'minor']);

function houseLine(s: GameState, h: House, full: boolean): string {
  const head = h.head ? `${nameOf(s, h.head)} (${ageOfId(s, h.head)}) [${h.head}]` : 'no head named';
  const family = membersOf(s, h.id).filter((c) => c.id !== h.head && c.id !== h.heir).map((c) => `${c.name} (${ageOn(c.born, s.date)}) [${c.id}]`);
  const heir = h.heir ? `${nameOf(s, h.heir)} [${h.heir}]${ageOfId(s, h.heir) < 15 ? ` (a child, ${ageOfId(s, h.heir)})` : ''}` : 'none';
  if (!full) return `- ${h.name} [${h.id}]: ${h.koku.toLocaleString('en')} koku, ~${h.troops.toLocaleString('en')} men; head ${head}.`;
  return `- House ${h.name} [${h.id}]${h.tier === 'royal' ? ' (royal)' : ''} — ${h.land}. ${h.koku.toLocaleString('en')} koku, ~${h.troops.toLocaleString('en')} men. Head ${head}; heir ${heir}.${family.length ? ` Family: ${family.join(', ')}.` : ''} `
    + `Prestige ${h.prestige} (${prestigeWord(h.prestige)}), loyalty ${h.crownLoyalty} (${loyaltyWord(h.crownLoyalty)}), cohesion ${h.cohesion} (${cohesionWord(h.cohesion)}${h.cohesion < HOUSE_RULES.gekokujo + 10 ? ': near a split' : ''}).`
    + `${h.allies.length ? ` Allied by marriage to ${h.allies.map((a) => s.houses?.[a]?.name ?? a).join(', ')}.` : ''}${h.hostage ? ` Hostage held: ${nameOf(s, h.hostage)}.` : ''}${h.goal ? ` Wants: ${h.goal}.` : ''}${h.secret && h.head && met(s, h.head) ? ` SECRET: ${h.secret}` : ''}`;
}

/** For Claude's memory: the houses of Li's kingdom in full, the others in one line each, and the world's people. */
export function housesText(s: GameState): string {
  if (!s.houses) return '';
  const k = liKingdom(s);
  const own = houses(s).filter((h) => h.kingdom === k && !h.fallen);
  const other = houses(s).filter((h) => h.kingdom !== k && !h.fallen && h.tier !== 'C');
  const people = Object.values(s.characters).filter((c) => c.world && c.alive && !met(s, c.id) && !HIDDEN_PEOPLE.has(c.id)
    && (PEOPLE.find((r) => r[0] === c.id)?.[5] === k || ageOn(c.born, s.date) <= 25));
  const placeOf = (c: Character) => WORLD_PLACES[c.location] ?? c.location;
  return [
    `THE HOUSES OF ${k.toUpperCase()} (the code keeps them: land, men, prestige, loyalty to their lord, cohesion; heads and heirs are real people who age and die). Move one with {"kind":"house"}; marriages between houses {"kind":"alliance"}; hostages {"kind":"hostage"}:`,
    ...own.map((h) => houseLine(s, h, true)),
    `OTHER KINGDOMS' HOUSES (one line each; full when Li serves there):`,
    ...other.map((h) => houseLine(s, h, false)),
    `PEOPLE OF THE WORLD Li has not met (real people with ids: use the id with "person" when Li meets one; never invent a new name for them):`,
    ...people.map((c) => `- ${c.name} [${c.id}], ${ageOn(c.born, s.date)}, ${c.role}${c.house ? ` (House ${s.houses?.[c.house]?.name ?? c.house})` : ''}; at ${placeOf(c)}.`),
    has(s, 'adopted') ? `Li is an adopted son of House ${houses(s)[has(s, 'adopted') - 1]?.name}.` : '',
    s.houses.li ? `LI'S OWN HOUSE: ${houseLine(s, s.houses.li, true).slice(2)}` : (s.domain && rankLevel(careerOf(s).rank) >= rankLevel(HOUSE_RULES.foundRank) ? 'Li holds land: he may found his own house ({"kind":"found_house","name":"..."}) when the story gets there.' : ''),
  ].filter(Boolean).join('\n');
}

/** For the Encyclopedia: houses Li can know (his kingdom's, those whose people he has met, his own), no secrets. */
export function knownHouses(s: GameState): { name: string; kingdom: string; land: string; head: string; heir: string; men: string; standing: string }[] {
  if (!s.houses) return [];
  const k = liKingdom(s);
  const metHouse = new Set(Object.values(s.characters).filter((c) => c.house && met(s, c.id)).map((c) => c.house!));
  return houses(s).filter((h) => !h.fallen && (h.kingdom === k || metHouse.has(h.id) || h.id === 'li')).map((h) => ({
    name: h.name, kingdom: h.kingdom, land: h.land, head: h.head ? nameOf(s, h.head) : '—', heir: h.heir ? nameOf(s, h.heir) : '—',
    men: `about ${(Math.round(h.troops / 500) * 500 || h.troops).toLocaleString('en')} men`, standing: `${prestigeWord(h.prestige)}, ${cohesionWord(h.cohesion)}`,
  }));
}
