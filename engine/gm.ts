import { ageOn, dateFromIndex, dayIndex, formatDate, seasonKey } from './calendar';
import { ESCAPE_NEEDS, inService, MERIT_FOR_FREEDOM, PRICE_MON, raidIndexOn, raidOfficerOn } from './campaign';
import { DuelOutcome, DuelTemplate } from './content';
import { PLACES } from './data';
import { commitDrafts, has, li, met, replay, today } from './engine';
import { createWorld } from './data';
import { liHandInDeath } from './factcheck';
import { publicWorldText } from './atlas-public';
import { liLifeText } from './life';
import { fuseDrafts, fusesText, leverDrafts } from './fuses';
import { seedDrafts, seedsText } from './seeds';
import { storyWindow } from './recaps';
import { careerText, ceremonyDrafts, deedDrafts, promotionDrafts, serveDrafts, titleDrafts } from './gm-career';
import { stageDayCap, stageText } from './stages';
import { battleClearDrafts, battleStartDrafts, battleText } from './gm-battle';
import { domainMonthDrafts, domainOrderDrafts, domainText, landDrafts, projectDrafts } from './gm-domain';
import { growDrafts, roleDrafts, seasonGrowthDrafts } from './growth';
import { opinion, opinionLabel, relSnapshot } from './relations';
import { HEAL_DAYS, SEASON_TRAINING_CAP, WOUND_LABEL, growthGain, r3, rankLetter, rankScores } from './rules';
import { Draft, GameEvent, GameState, GmMemory, Part, PARTS, REL_FIELDS, RelField, STAT_KEYS, StatKey, Wound } from './types';

// Game Master mode (owner decision, Oct 7): Claude runs the world — any action, people with their own plans, the story
// moves scene by scene. The code is the memory and the referee: it keeps every person, promise, wound and coin as events
// (so nothing is forgotten and saves replay), and it checks every change Claude proposes against fixed limits.
// Fights are never decided by Claude: they run in the duel engine.

/** One scene from the Game Master (Claude's JSON answer). */
export interface GmTurn {
  /** The scene, in the third person (the story the player reads). */
  scene: string;
  /** One line for the story so far (memory). */
  summary: string;
  /** A short title for the scene header. */
  title?: string;
  /** Li's journal line, in his own voice ("I…"). */
  journal?: string;
  /** Days that pass before the NEXT scene starts (0 = same day). */
  days?: number;
  /** Part of the day the scene ends in. */
  part?: Part;
  /** Li goes to sleep at the end of the scene: the next scene is the next morning (the code sets it, not the prose). */
  sleeps?: boolean;
  /** Where Li is now (short place name). */
  place?: string;
  changes?: GmChange[];
  /** A fight that starts now: the code runs it, round by round, with the player. */
  fight?: GmFight;
  /** 3–4 things Li could do next. */
  suggestions?: string[];
  /** Time skip: something important happened or the target is reached, so the skip stops here. */
  stop?: boolean;
  /** Only routine happened: the story goes on by itself to the next moment that matters (pacing, owner Oct 12). */
  routine?: boolean;
  /** One short out-of-character line to the player (e.g. why a wish could not be granted). Shown apart from the scene. */
  gmNote?: string;
}

export interface GmFight {
  foe: string;
  /** Li's guess of the foe's warrior rank. */
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A';
  /** Short description Li sees ("Suiren levy with a spear"). */
  look: string;
  /** Officer rank, if the foe is an enemy officer (his head can count under the merit law). */
  officer?: 'Gochō' | 'Kogashira' | 'Gojū-gashira' | 'Hyakunin-gashira';
  /** Sticks and fists (worst: Hurt) or real weapons (worst: Badly wounded). */
  deadly: boolean;
  /** A spar or drill: the page simulates it unless the player takes over (owner, Oct 15). Never deadly. */
  spar?: boolean;
  /** An enemy of Kurogane, fought in Kurogane service, with witnesses (merit counts). */
  witnessedEnemy?: boolean;
  place?: string;
}

export type GmChange =
  | { kind: 'relation'; npc: string; field: RelField; delta: number; reason: string }
  | { kind: 'money'; amount: number; reason: string }
  | { kind: 'wound'; level: number; reason: string }
  | { kind: 'fatigue'; level: number }
  | { kind: 'train'; focus: string; days: number }
  | { kind: 'time'; days: number; part?: Part; reason: string }
  | { kind: 'lever'; fuse: string; toward: string; reason: string }
  | { kind: 'seed'; id: string; state: 'planted' | 'grown' | 'dead'; note?: string }
  | { kind: 'skill'; skill: string; delta: number }
  | { kind: 'memory'; npc: string; what: string; weight?: number }
  | { kind: 'person'; id: string; name: string; role: string; desc: string; goal: string; secret?: string; trust?: number; respect?: number; affection?: number; rivalry?: number }
  | { kind: 'agenda'; npc: string; goal: string; secret?: string }
  | { kind: 'thread'; id: string; text: string; open: boolean }
  | { kind: 'lore'; title: string; text: string }
  | { kind: 'knowledge'; key: string }
  | { kind: 'service'; reason: string }
  | { kind: 'dies'; npc: string; reason: string }
  | { kind: 'freedom'; route: 'merit' | 'head' | 'bought' | 'raizen' | 'escape' }
  /** Only in a fix ("Something's wrong"): a corrected fact line the memory keeps from now on. */
  | { kind: 'fact'; what: string; text: string }
  /** Career (engine/gm-career.ts): a deed with witnesses, a promotion when a post opens, serving another kingdom. */
  | { kind: 'deed'; deed: string; amount?: number; reason: string }
  | { kind: 'promotion'; reason: string; sponsor?: string }
  | { kind: 'ceremony'; sponsor?: string }
  | { kind: 'title'; title: string; reason: string }
  /** Other people grow and change (engine/growth.ts). */
  | { kind: 'grow'; npc: string; stat: string; reason: string; big?: boolean }
  | { kind: 'role'; npc: string; role: string }
  | { kind: 'serve'; kingdom: string }
  /** Armies meet (engine/gm-battle.ts): Claude sets the field, the code runs the phases with the player's orders. */
  | { kind: 'battle'; name: string; place?: string; sector?: string; ally: unknown[]; enemy: unknown[] }
  /** Li's land (engine/gm-domain.ts): a grant, a project, big orders. */
  | { kind: 'land'; koku: number; name?: string; reason?: string }
  | { kind: 'project'; project: string }
  | { kind: 'domain'; tax?: number; manager?: string; standing?: number; relief?: boolean; maintain?: boolean };

/** Claude's answer to the player's "Something's wrong" report. */
export interface GmFixProposal {
  /** Plain words to the player, out of character. */
  explanation: string;
  /** Corrections: the same kinds as a scene, plus "fact". Checked by the same referee. */
  changes: GmChange[];
  /** Scenes to take back (0 = none, at most 3), only when the last scene(s) broke the facts. */
  rewindScenes: number;
}

/** Knowledge keys Claude records when a long goal moves (the code gates some of them). */
export const GOAL_KEYS = {
  zone: 'shinken_no_ryu',
  name: 'said_hattori',
  lead: 'family_lead',
  alive: 'family_alive',
  found: 'family_found',
  lie: 'father_lie',
  truth: 'father_truth',
  killers: 'father_killers',
} as const;

// ---------- limits (the referee) ----------

export const GM_LIMITS = {
  relationDelta: 15,
  moneyGain: 2000,
  skillDelta: 1.5,
  maxWound: 3, // Badly wounded; Li is never killed (hidden rule)
  trainPerDay: 0.02, // same base as night training (Numbers §2), capped per season
} as const;

/** Warrior score Li guesses for each rank letter (Numbers §1 bands, middle of the band). */
const RANK_SCORE: Record<GmFight['rank'], number> = { F: 10, E: 22, D: 37, C: 52, B: 67, A: 82 };
const OFFICER_MERIT: Record<NonNullable<GmFight['officer']>, number> = { 'Gochō': 3, 'Kogashira': 3, 'Gojū-gashira': 10, 'Hyakunin-gashira': 10 };

export const gmOn = (s: GameState) => (s.flags.gm_mode ?? 0) > 0;
/** Read-only view of the Game Master memory. Never creates it: only events do (engine.ts), so reading cannot change the
 * state (a fresh game read before its first scene must still match its own replay, or the save would not load). */
export function gmMem(s: GameState): GmMemory {
  return s.gm ?? { scenes: [], threads: [], lore: [], agendas: {}, duels: {}, suggestions: [] };
}

// ---------- what Claude knows: the people's own plans and the hidden truths ----------

/** Starting plans for the people around Li (World Atlas §4, World Bible ch. 10). Secrets are for the Game Master only. */
export const START_AGENDAS: Record<string, { goal: string; secret?: string }> = {
  raizen: { goal: 'Keep the Hagiwara contract, keep the band paid and alive, drink away the past.', secret: 'Served Suiren once and left in disgust after the murder of the general Hattori Takeshi. Bought Li at Kinza in Year 96 without knowing who he is. Has noticed the boy\'s footwork and cannot place it.' },
  gonza: { goal: 'Keep slaves in their place and squeeze coin out of the band.', secret: 'Sells band supplies (rice, arrows) on the side. Would hurt Li if he became a threat or found out.' },
  rokubei: { goal: 'Keep the ledger straight, the stores full and the slave papers safe in the iron box.' },
  hisame: { goal: 'Be left alone; stay useful to Raizen.', secret: 'A deserter from the Mist Valley shinobi. Has seen Li train with sticks at night and told no one.' },
  sukezo: { goal: 'Keep the boys alive and teach Li letters before he dies.', secret: 'Old and tired; knows a runaway is hunted; would help Li escape but not run himself.' },
  hachi: { goal: 'Survive Gonza; hopes his father comes back for him (sold in Ushio for a debt).', secret: 'Can die if the world turns cruel. Worships Li.' },
  sayo: { goal: 'Learn everything about the war her father fights; escape the boredom of the castle.', secret: 'Her father Lord Hagiwara smuggles rice to Suiren lords for profit; she half suspects it.' },
  kaname: { goal: 'Become a warrior and protect Sasabe, though everyone says girls cannot.' },
  daisuke: { goal: 'Prove he is the strongest boy on the river; will enlist the day Li does.' },
  ishizue: { goal: 'Hold Kōri fort; show the Hagiwara that mercenaries are dogs.' },
};

export const GM_SECRETS = [
  'Li is Li Hattori, son of Hattori Takeshi "the Twin Demon", the great Suiren general killed in Year 95. The official story blames Kurogane raiders; in truth three Suiren families (Shirasagi ordered it, Akabane set the trap, Kinugasa voted against and kept proof) had him killed. Akabane keeps his blade Kage.',
  'Li\'s mother Yuki and sisters Mei (now 15) and Kenjiko (now 5) are alive in Takane, guarded by Shiraiwa Yasutoki (white rock crest). They believe Li died in Year 95.',
  'Discovery (only if it happens in play): Li says the name Hattori · someone who saw Takeshi fight sees Li\'s two-sword footwork (Raizen, old Kurogane veterans) · the wooden dragon is seen by family or Shiraiwa · after 16, someone who knew Takeshi sees his face.',
  'Li\'s hidden gift: when he nearly dies, a state of total focus can wake (SHINKEN NO RYŪ). Never before a real near-death moment.',
  'Li cannot die. Never say so; let him be beaten, wounded, captured, saved by others.',
  'World: King Asagiri Tokinari of Kurogane turns 20 in Year 101, Month 3; the Chancellor fears it. The great canal is a Tatara plot to drain Kurogane. Suiren raids the Kurose every summer; Lord Hagiwara lost 2,000 men last year and hired the Red Crane band for three seasons.',
];

/** Fixed dates the world keeps, so Claude can weave them in (not scripts: Claude decides how they touch Li). */
export const WORLD_CLOCK: { day: number; what: string }[] = [
  { day: 35, what: 'Night: Suiren raiders cross the Kurose and burn part of Sasabe village (Kaname is in danger).' },
  { day: 90, what: 'Summer: the Hagiwara call a levy to hold the fords; Raizen lends his bearers. A slave in the levy is in Kurogane service: his deeds count under the merit law.' },
  { day: 97, what: 'Summer to autumn (Months 4–9), days 8 and 22: Suiren raids at the fords. Month 6 Day 22 a Suiren Gochō leads; Month 9 Day 22 a Suiren Kogashira.' },
  { day: 270, what: 'Autumn ends: Lord Hagiwara renews the band\'s contract for a year; winter quarters.' },
  { day: 420, what: 'Year 101, Month 3: King Tokinari turns 20 and rules alone. Court tension spreads even to the border.' },
];

// ---------- the memory Claude reads every turn ----------

const i = (x: number) => Math.floor(x);

function reasonsOf(s: GameState, npc: string): string[] {
  return s.relations[npc].mods.slice(-4).map((m) => `${m.reason} (${m.field} ${m.value > 0 ? '+' : ''}${m.value})`);
}

// ---------- long goals (replace fixed "promised moments": chances keep coming, nothing is forced) ----------

export interface GmGoal {
  n: number;
  title: string;
  done: boolean;
  /** Status for Claude (may name hidden things: Game Master memory only, never UI text). */
  status: string;
  /** Storylines Claude opened as chances toward this goal (thread ids goal<n>_…). */
  chances: { id: string; text: string; open: boolean; day: number }[];
}

const knows = (s: GameState, key: string) => s.knowledge.includes(key);

/** A deadly fight the code decided (blood), or merit from combat. */
function foughtForReal(s: GameState): boolean {
  if (has(s, 'merit_combat') > 0) return true;
  return s.events.some((e) => {
    const id = (e.data as { duelEnd?: string }).duelEnd;
    return e.type === 'story' && !!id && id.startsWith('gm_') && (s.gm?.duels[id]?.maxWound ?? 0) >= 3;
  });
}

/** Li's five long goals, with a status derived from the state wherever the code can tell. */
export function gmLongGoals(s: GameState): GmGoal[] {
  const c = li(s);
  const K = GOAL_KEYS;
  const fought = foughtForReal(s);
  const zone = knows(s, K.zone);
  const chances = (n: number) => (s.gm?.threads ?? []).filter((t) => t.id.startsWith(`goal${n}`));
  const family = knows(s, K.found) ? 'DONE: Li has found them.'
    : knows(s, K.alive) ? `Li knows they are alive. Next: find them (record "${K.found}").`
    : knows(s, K.lead) ? `Li has a lead that they may be alive. Next: proof that they live (record "${K.alive}").`
    : `No lead yet. ${c.status === 'slave' ? 'Plant an early LEAD during the slave years' : 'Bring a LEAD'} (a rumour, a crest, a traveller): a lead, never the full truth or where they are (record "${K.lead}").`;
  const father = knows(s, K.killers) ? 'DONE: Li knows the truth and the people behind it.'
    : knows(s, K.truth) ? `Li knows it was murder by people of his father's own side. Next: who (record "${K.killers}").`
    : knows(s, K.lie) ? `Li has heard the official story (Kurogane raiders). Next: the truth (record "${K.truth}").`
    : `Li knows only that his father, a soldier, was killed. Record "${K.lie}" when he hears the official story, "${K.truth}" when he learns it was murder, "${K.killers}" when he knows who.`;
  const goals: Omit<GmGoal, 'n' | 'chances'>[] = [
    { title: 'Breaking the chains (freedom)', done: c.status !== 'slave', status: c.status !== 'slave' ? `DONE: Li is free (${c.role}).` : 'OPEN: Li is a slave; the routes are under FREEDOM ROUTES.' },
    {
      title: 'Blood and the Zone', done: fought && zone,
      status: `First real battle: ${fought ? 'fought' : 'not yet (a deadly fight the code runs)'}. SHINKEN NO RYŪ (SECRET, Li's hidden gift): ${zone ? 'woken' : `asleep; it can wake only at a true near-death moment (Li badly wounded, near-death moments so far: ${has(s, 'near_death')}); when it truly wakes, record "${K.zone}"`}.`,
    },
    { title: 'The name', done: knows(s, K.name), status: knows(s, K.name) ? 'DONE: Li has said the name Hattori aloud; the fuse in HIDDEN TRUTHS is lit.' : `OPEN: the world has never heard "Hattori" from Li's own mouth. Only the player can make Li say it; when he does, record "${K.name}".` },
    { title: 'Home (his mother and sisters)', done: knows(s, K.found), status: family },
    { title: 'His father\'s death (the truth and the people behind it)', done: knows(s, K.killers), status: father },
  ];
  return goals.map((g, k) => ({ ...g, n: k + 1, chances: chances(k + 1) }));
}

function longGoalsText(s: GameState): string {
  const goals = gmLongGoals(s);
  const next = goals.find((g) => !g.done);
  const lines = goals.map((g) => {
    const last = g.chances.length ? Math.max(...g.chances.map((t) => t.day)) : undefined;
    const open = g.chances.filter((t) => t.open).map((t) => `[${t.id}] ${t.text}`);
    const ch = g.done ? '' : `\n   Chances: ${open.join(' · ') || 'none open'}${last === undefined ? ' (none offered yet)' : ` (last one opened ${today(s) - last} days ago)`}.`;
    return `${g.n}. ${g.title}${g === next ? '  ← NEXT' : ''}: ${g.status}${ch}`;
  });
  return `LONG GOALS (keep a CHANCE toward the NEXT open goal coming; the player can miss or lose it; a missed chance returns later in another form; nothing is guaranteed, nothing is forced. Track each chance as a storyline with id goal1_… to goal5_; record progress with the knowledge keys named here):\n${lines.join('\n')}`;
}

/** Corrections from the player's reports and rewinds: true from now on, they override the story so far. */
function correctionsText(s: GameState): string {
  const facts = new Map<string, string>();
  const reports: string[] = [];
  for (const e of s.events) {
    if (e.type !== 'correction') continue;
    const d = e.data as { what?: string; text?: string; rewind?: number; report?: string; explanation?: string; changed?: number };
    const when = formatDate(dateFromIndex(e.day, e.part));
    if (d.what) { facts.delete(d.what.toLowerCase()); facts.set(d.what.toLowerCase(), `${d.what}: ${d.text}`); }
    else if (d.rewind) reports.push(`${when}: the last ${d.rewind} scene(s) were taken back because they broke the facts (the player reported: "${d.report}"). Do not repeat that mistake.`);
    else if (d.report !== undefined) reports.push(`${when}: the player reported "${d.report}". ${d.changed ? 'Corrected' : 'Nothing changed'}: ${d.explanation}`);
  }
  if (!facts.size && !reports.length) return '';
  return [
    'CORRECTIONS (true now; they override anything above that disagrees):',
    ...[...facts.values()].slice(-20).map((x) => `- ${x}`),
    ...reports.slice(-6).map((x) => `- ${x}`),
  ].join('\n');
}

/** What the referee cut from the last scene, so Claude does not build on it. */
function refereeText(s: GameState): string {
  let k = s.events.length - 1;
  const notes: string[] = [];
  for (; k >= 0 && s.events[k].type !== 'scene'; k--) {
    const d = s.events[k].data as { gmNotes?: string[]; gmSecretNotes?: string[]; fix?: boolean };
    if (s.events[k].type === 'alert' && !d.fix) notes.unshift(...(d.gmNotes ?? []), ...(d.gmSecretNotes ?? []));
  }
  return notes.length ? `THE CODE CUT FROM YOUR LAST SCENE (it did not happen as written; build on what was recorded):\n${notes.map((x) => `- ${x}`).join('\n')}` : '';
}

/** Everything the Game Master needs, as one text. Hidden truths are marked SECRET: Claude must not reveal them. */
export function gmMemoryText(s: GameState): string {
  const c = li(s);
  const g = gmMem(s);
  const r = rankScores(c);
  const age = ageOn(c.born, s.date);
  const people = Object.keys(s.relations).filter((id) => met(s, id) && s.characters[id]).map((id) => {
    const p = s.characters[id];
    const v = relSnapshot(s.relations[id], today(s));
    const a = g.agendas[id] ?? START_AGENDAS[id];
    return [
      `- ${p.name} [id: ${id}] — ${p.role}${p.alive ? '' : ' (DEAD)'}, age ${ageOn(p.born, s.date)}, true strength ${rankLetter(rankScores(p).overall)} (SECRET: Li only guesses). ${p.desc} Traits: ${p.traits.join(', ') || '—'}. Where: ${PLACES[p.location] ?? p.location}.`,
      `  Toward Li: ${opinionLabel(opinion(s.relations[id], today(s)))} (trust ${i(v.trust)}, respect ${i(v.respect)}, affection ${i(v.affection)}, fear ${i(v.fear)}, rivalry ${i(v.rivalry)}). Recent reasons: ${reasonsOf(s, id).join('; ') || 'none'}.`,
      a ? `  Own plan: ${a.goal}${a.secret ? ` SECRET: ${a.secret}` : ''}` : '',
      ...s.memories.filter((m) => m.npc === id).slice(-3).map((m) => `  Remembers: ${m.what}`),
    ].filter(Boolean).join('\n');
  }).join('\n');
  const unmet = Object.keys(s.characters).filter((id) => id !== s.liId && !met(s, id) && s.characters[id].alive).map((id) => `- ${s.characters[id].name} [id: ${id}] — ${s.characters[id].role}. ${s.characters[id].desc}`).join('\n');
  // All chapter recaps, then the scenes after them in full (engine/recaps.ts): nothing falls out of Claude's view.
  const window = storyWindow(s);
  const story = window.scenes;
  const soon = WORLD_CLOCK.filter((w) => w.day >= today(s) - 2 && w.day <= today(s) + 60).map((w) => `- ${formatDate(dateFromIndex(w.day))}: ${w.what}`);
  const freedomRoutes = c.status === 'slave' ? [
    `Merit law: 30 merit in Kurogane service (now ${has(s, 'merit_service')}${inService(s) ? '' : '; Li is NOT in service yet'}) or the head of an enemy Kogashira or higher taken in service (only through a fight the code runs).`,
    `Buying: Raizen's price is 15 ryō = ${PRICE_MON} mon (Li has ${s.money} mon). Rokubei keeps the papers.`,
    'Raizen sets him free: needs Raizen\'s trust and respect both 85+.',
    'Escape: to Tatara over the Black Hills (no slavery there); hunted afterwards. Only in winter quarters (Months 10–12), and only when Li is fit and quiet enough (the code checks).',
  ] : ['Li is free.'];
  return [
    `DATE: ${formatDate(s.date)}  ·  PLACE: ${PLACES[c.location] ?? c.location}`,
    `LI: age ${age}, ${c.role} (${c.status}). Condition: ${WOUND_LABEL[c.wound]}${c.wound ? ` (${c.healDays} days to heal a step)` : ''}, fatigue ${c.fatigue}/3. Money ${s.money} mon. Warrior ${rankLetter(r.warrior)} (VAL ${c.stats.VAL.toFixed(1)}, two swords ${(c.styles.two_swords ?? 0).toFixed(1)}), Commander ${rankLetter(r.commander)}, Statesman ${rankLetter(r.statesman)}.`,
    `Skills: ${Object.entries(c.skills).map(([k, v]) => `${k} ${i(v)}`).join(', ')}. Traits: ${c.traits.join(', ')}.`,
    `Li's voice: quiet, watchful, stubborn; hides his anger; protective of the weak; fears fire at night. He must never say the name Hattori.`,
    `Merit: combat ${has(s, 'merit_combat')}, in Kurogane service ${has(s, 'merit_service')} of ${MERIT_FOR_FREEDOM}. In the Hagiwara levy: ${inService(s) ? 'yes' : 'no'}.`,
    careerText(s),
    stageText(s),
    publicWorldText(s),
    liLifeText(s),
    fusesText(s),
    seedsText(s),
    domainText(s),
    battleText(s),
    `What Li knows (keys): ${s.knowledge.join(', ')}.`,
    `FREEDOM ROUTES:\n${freedomRoutes.map((x) => `- ${x}`).join('\n')}`,
    longGoalsText(s),
    `PEOPLE LI KNOWS:\n${people || '(none)'}`,
    unmet ? `PEOPLE NEARBY LI HAS NOT MET YET:\n${unmet}` : '',
    `OPEN STORYLINES:\n${g.threads.filter((t) => t.open).map((t) => `- [${t.id}] ${t.text}`).join('\n') || '(none yet: start some)'}`,
    window.chapters.length ? `CHAPTERS SO FAR (written once, the story before the scenes below):\n${window.chapters.join('\n')}` : '',
    `STORY SO FAR${window.chapters.length ? ' (since the last chapter)' : ''}:\n${story.join('\n') || '(the story begins now)'}`,
    `LI'S LAST JOURNAL LINES:\n${s.journal.slice(-8).map((j) => `- ${j.text}`).join('\n') || '(none)'}`,
    correctionsText(s),
    refereeText(s),
    soon.length ? `WORLD CLOCK (fixed dates the world keeps; weave them in when they come):\n${soon.join('\n')}` : '',
    `HIDDEN TRUTHS (SECRET — never reveal them unless Li truly discovers them in play):\n${GM_SECRETS.map((x) => `- ${x}`).join('\n')}`,
  ].filter(Boolean).join('\n\n');
}

// ---------- checking and recording a scene ----------

export interface GmResult {
  drafts: Draft[];
  /** Changes the code refused or cut down, with the reason (shown under "Why?" and sent back to Claude). */
  notes: string[];
  /** Refusals that name hidden things: sent back to Claude only, never shown to the player. */
  secretNotes?: string[];
  /** A fight the code has started. */
  duelId?: string;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const num = (x: unknown, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const str = (x: unknown, max = 600) => (typeof x === 'string' ? x.trim().slice(0, max) : '');
const slug = (x: string) => x.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);

/** Turn Claude's raw answer into a safe GmTurn (unknown fields dropped, text trimmed). */
export function parseGmTurn(raw: unknown): GmTurn | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const scene = str(o.scene, 6000);
  if (!scene) return undefined;
  const part = PARTS.includes(o.part as Part) ? (o.part as Part) : undefined;
  const f = o.fight as Record<string, unknown> | undefined;
  const ranks = ['F', 'E', 'D', 'C', 'B', 'A'];
  const officers = ['Gochō', 'Kogashira', 'Gojū-gashira', 'Hyakunin-gashira'];
  return {
    scene,
    summary: str(o.summary, 300) || scene.split(/(?<=\.)\s/)[0].slice(0, 300),
    title: str(o.title, 60) || undefined,
    journal: str(o.journal, 300) || undefined,
    days: num(o.days, 0),
    part,
    sleeps: o.sleeps === true || undefined,
    place: str(o.place, 80) || undefined,
    changes: Array.isArray(o.changes) ? (o.changes.filter((x) => x && typeof x === 'object') as GmChange[]).slice(0, 20) : [],
    fight: f && str(f.foe) ? {
      foe: str(f.foe, 80), rank: (ranks.includes(String(f.rank)) ? f.rank : 'E') as GmFight['rank'], look: str(f.look, 120) || str(f.foe, 80),
      officer: officers.includes(String(f.officer)) ? (f.officer as GmFight['officer']) : undefined,
      deadly: f.deadly !== false, spar: f.spar === true && f.deadly === false, witnessedEnemy: f.witnessedEnemy === true, place: str(f.place, 80) || undefined,
    } : undefined,
    suggestions: Array.isArray(o.suggestions) ? o.suggestions.map((x) => str(x, 120)).filter(Boolean).slice(0, 4) : [],
    stop: o.stop === true,
    routine: o.routine === true || undefined,
    gmNote: str(o.gmNote, 240) || undefined,
  };
}

/** Training over days, with the same growth rule and season cap as playing it (Numbers §2). */
function trainDrafts(s: GameState, focus: string, days: number): { drafts: Draft[]; note?: string } {
  const c = li(s);
  const isStat = STAT_KEYS.includes(focus as StatKey);
  const isStyle = !isStat && (focus in c.styles || /^[a-z_]{3,20}$/.test(focus));
  if (!isStat && !isStyle) return { drafts: [], note: `training "${focus}" is not a stat or a fighting style` };
  const kind = isStat ? 'stat' : 'style';
  const capKey = `${kind}:${focus}`;
  const current = isStat ? c.stats[focus as StatKey] : c.styles[focus] ?? 0;
  const potential = isStat ? c.potential[focus as StatKey] : c.potential.VAL;
  const age = ageOn(c.born, s.date);
  let gain = 0;
  for (let d = 0; d < days; d++) gain += growthGain(GM_LIMITS.trainPerDay, age, current + gain, potential);
  const left = Math.max(0, SEASON_TRAINING_CAP - (s.seasonGains[capKey] ?? 0));
  const capped = Math.min(gain, left);
  const amount = r3(capped);
  const note = capped < gain ? `training ${focus} hit the season cap (${SEASON_TRAINING_CAP} per season)` : undefined;
  if (amount <= 0) return { drafts: [], note };
  const data: Record<string, unknown> = isStat ? { char: c.id, stat: focus, amount, capKey } : { char: c.id, style: focus, amount, capKey };
  return { drafts: [{ type: kind, fact: `training ${focus} +${amount} over ${days} days`, visible: false, data }], note };
}

/** Check every change against the limits and turn the scene into events. Nothing here uses chance. */
export function checkGmTurn(s: GameState, t: GmTurn, said?: string): GmResult {
  const c = li(s);
  const notes: string[] = [];
  const secretNotes: string[] = [];
  const drafts: Draft[] = [];
  drafts.push(...battleClearDrafts(s)); // the aftermath has been told: clear the field
  drafts.push({ type: 'scene', fact: t.scene, visible: true, journal: t.journal, data: { summary: t.summary, title: t.title ?? null, suggestions: t.suggestions ?? [], said: said ?? null, gmNote: t.gmNote ?? null } });
  if (t.place) drafts.push({ type: 'place', fact: `Li is at ${t.place}`, visible: false, data: { char: c.id, place: t.place } });
  drafts.push(...checkChanges(s, t.changes ?? [], notes, secretNotes, said, false, `${t.title ?? ''}. ${t.scene}`));

  let duelId: string | undefined;
  if (t.fight) {
    duelId = `gm_${s.nextSeq}`;
    drafts.push(...gmDuelStart(s, duelId, t.fight, secretNotes, t.place));
  }
  return { drafts, notes, secretNotes, duelId };
}

/** The player's own words (this turn or any earlier scene) named Hattori: only then can Li have said it. */
const playerSaidName = (s: GameState, said?: string) => [said, ...s.events.filter((e) => e.type === 'scene').map((e) => (e.data as { said?: unknown }).said)]
  .some((x) => typeof x === 'string' && /hattori/i.test(splitWishes(x).action));

/** Words in (round brackets) are the player's wishes to the Game Master for the story; the rest is what Li does. */
export function splitWishes(said: string): { action: string; wishes: string[] } {
  const wishes: string[] = [];
  let action = '';
  let cur = '';
  let depth = 0;
  for (const ch of said) {
    if (ch === '(' || ch === '（') { if (depth++ === 0) { cur = ''; continue; } }
    else if ((ch === ')' || ch === '）') && depth > 0) { if (--depth === 0) { wishes.push(cur); continue; } }
    if (depth) cur += ch;
    else action += ch;
  }
  if (depth) wishes.push(cur);
  return {
    action: action.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim(),
    wishes: wishes.map((w) => w.replace(/\s+/g, ' ').trim()).filter(Boolean),
  };
}

/** The referee for a list of changes (a scene's, or a fix's when `facts` is true). */
function checkChanges(s: GameState, changes: GmChange[], notes: string[], secretNotes: string[], said: string | undefined, facts: boolean, scene = ''): Draft[] {
  const c = li(s);
  const g = gmMem(s);
  const drafts: Draft[] = [];
  const known = (id: string) => !!s.characters[id] && id !== s.liId;
  const newPeople = new Set<string>();
  let deeds = 0;
  const pendingMerit: Record<string, number> = {};
  const grown = new Set<string>();
  // Land changes in one scene build on each other.
  let land = s.domain;
  const trackLand = (ds: Draft[]) => { for (const d of ds) if (d.type === 'domain') land = (d.data as { domain: GameState['domain'] }).domain; return ds; };
  const worstWound = Math.max(c.wound, ...changes.filter((x) => x && x.kind === 'wound').map((x) => Math.min(GM_LIMITS.maxWound, num((x as { level?: unknown }).level))));

  for (const ch of changes) {
    const x = ch as Record<string, unknown>;
    switch (ch.kind) {
      case 'person': {
        const id = slug(str(x.id) || str(x.name));
        if (!id || known(id) || newPeople.has(id)) { if (id && known(id) && !met(s, id)) drafts.push({ type: 'flag', fact: `met ${id}`, visible: false, data: { key: `met_${id}`, value: 1 } }); break; }
        newPeople.add(id);
        const base = { trust: clamp(num(x.trust, 40), 0, 80), respect: clamp(num(x.respect, 40), 0, 80), affection: clamp(num(x.affection, 40), 0, 80), fear: 0, rivalry: clamp(num(x.rivalry, 0), 0, 60) };
        // A person always has a name (one without blanked the People tab); fall back to the id, readable.
        const name = str(x.name, 60) || id.replace(/_/g, ' ').replace(/^\w/, (ch) => ch.toUpperCase());
        drafts.push({ type: 'person', fact: `Li meets ${name}`, visible: true, data: { id, name, role: str(x.role, 80), desc: str(x.desc, 300), goal: str(x.goal, 300), secret: str(x.secret, 300) || undefined, base, day: today(s) } });
        break;
      }
      case 'relation': {
        const npc = str(x.npc, 40);
        if (!known(npc) && !newPeople.has(npc)) { notes.push(`no person "${npc}" to change`); break; }
        if (!REL_FIELDS.includes(x.field as RelField)) { notes.push(`"${String(x.field)}" is not a feeling the code tracks`); break; }
        const d = clamp(Math.round(num(x.delta)), -GM_LIMITS.relationDelta, GM_LIMITS.relationDelta);
        if (d !== Math.round(num(x.delta))) notes.push(`${npc} ${String(x.field)} change cut to ${d} (limit ±${GM_LIMITS.relationDelta} per scene)`);
        if (!d) break;
        const reason = str(x.reason, 120) || 'Something Li did';
        drafts.push({ type: 'relation', fact: `${npc}: ${String(x.field)} ${d > 0 ? '+' : ''}${d} (${reason})`, visible: false, data: { npc, field: x.field, value: d, reason, fade: 1095 } });
        break;
      }
      case 'money': {
        const want = Math.round(num(x.amount));
        const amount = clamp(want, -s.money, GM_LIMITS.moneyGain);
        if (amount !== want) notes.push(want < 0 ? `Li has only ${s.money} mon` : `money gain cut to ${GM_LIMITS.moneyGain} mon per scene`);
        if (amount) drafts.push({ type: 'money', fact: `${amount > 0 ? 'Li gets' : 'Li pays'} ${Math.abs(amount)} mon (${str(x.reason, 100)})`, visible: true, data: { amount } });
        break;
      }
      case 'wound': {
        const level = clamp(Math.round(num(x.level)), 0, GM_LIMITS.maxWound) as Wound;
        if (num(x.level) > GM_LIMITS.maxWound) notes.push('the worst a scene can do to Li is Badly wounded');
        if (level !== c.wound) drafts.push({ type: 'wound', fact: `Li is ${WOUND_LABEL[level].toLowerCase()} (${str(x.reason, 100)})`, visible: true, data: { char: c.id, wound: level, healDays: HEAL_DAYS[level] } });
        if (level >= 3) drafts.push({ type: 'flag', fact: 'near-death', visible: false, data: { key: 'near_death', value: has(s, 'near_death') + 1 } });
        break;
      }
      case 'fatigue': {
        const v = clamp(Math.round(num(x.level)), 0, 3);
        if (v !== c.fatigue) drafts.push({ type: 'fatigue', fact: `Li fatigue → ${v}`, visible: true, data: { char: c.id, value: v } });
        break;
      }
      case 'train': {
        const days = clamp(Math.round(num(x.days, 1)), 1, 90);
        const r = trainDrafts(s, str(x.focus, 20), days);
        drafts.push(...r.drafts);
        if (r.note) notes.push(r.note);
        break;
      }
      case 'skill': {
        const key = slug(str(x.skill, 30));
        const d = clamp(num(x.delta), -GM_LIMITS.skillDelta, GM_LIMITS.skillDelta);
        if (d !== num(x.delta)) notes.push(`skill ${key} change cut to ${d} (limit ±${GM_LIMITS.skillDelta} per scene)`);
        if (key && d) drafts.push({ type: 'skill', fact: `skill ${key} ${d > 0 ? '+' : ''}${r3(d)}`, visible: false, data: { char: c.id, skill: key, amount: r3(d) } });
        break;
      }
      case 'memory': {
        const npc = str(x.npc, 40);
        if (!known(npc) && !newPeople.has(npc)) { notes.push(`no person "${npc}" to remember`); break; }
        drafts.push({ type: 'memory', fact: `${npc} remembers: ${str(x.what, 200)}`, visible: false, data: { npc, what: str(x.what, 200), source: 'saw', certainty: 100, weight: clamp(num(x.weight, 40), 0, 100) } });
        break;
      }
      case 'agenda': {
        const npc = str(x.npc, 40);
        if (known(npc) || newPeople.has(npc)) drafts.push({ type: 'thread', fact: `${npc} has a new plan`, visible: false, data: { agenda: { npc, goal: str(x.goal, 300), secret: str(x.secret, 300) || undefined } } });
        break;
      }
      case 'thread': {
        const id = slug(str(x.id) || str(x.text));
        if (id) drafts.push({ type: 'thread', fact: `${x.open === false ? 'closed' : 'open'}: ${str(x.text, 200)}`, visible: false, data: { id, text: str(x.text, 200), open: x.open !== false } });
        break;
      }
      case 'lore': {
        const title = str(x.title, 60);
        if (title && !g.lore.some((l) => l.title === title)) drafts.push({ type: 'lore', fact: `Li learns about ${title}`, visible: false, data: { title, text: str(x.text, 400) } });
        break;
      }
      case 'knowledge': {
        const key = slug(str(x.key, 40));
        if (key === GOAL_KEYS.zone && worstWound < 3) { secretNotes.push('SHINKEN NO RYŪ wakes only at a true near-death moment (Li is not badly wounded): not recorded'); break; }
        if (key === GOAL_KEYS.name && !playerSaidName(s, said)) { secretNotes.push('Li says the name Hattori only when the player writes it: not recorded'); break; }
        if (key && !s.knowledge.includes(key)) drafts.push({ type: 'knowledge', fact: `Li learns: ${key}`, visible: false, data: { key } });
        break;
      }
      case 'fact': {
        const what = str(x.what, 80);
        const text = str(x.text, 300);
        if (!facts) secretNotes.push('fact corrections come only from the player\'s report');
        else if (what && text) drafts.push({ type: 'correction', fact: `Correction: ${what}: ${text}`, visible: false, data: { what, text } });
        break;
      }
      case 'time': {
        // Only "Something's wrong" moves the clock this way ("Li slept but the day did not change"): forward only, never in a fight.
        if (!facts) { secretNotes.push('time moves with "days", "part" and "sleeps", not with a change'); break; }
        if ((s.duel && !s.duel.over) || (s.battle && !s.battle.over)) { notes.push('time cannot move during a fight'); break; }
        const part = PARTS.includes(x.part as Part) ? (x.part as Part) : undefined;
        drafts.push(...gmTimeDrafts(s, ...sceneTime(s, { days: clamp(Math.round(num(x.days)), 0, stageDayCap(s)), part })));
        break;
      }
      case 'lever':
        drafts.push(...leverDrafts(s, x, notes));
        break;
      case 'seed':
        drafts.push(...seedDrafts(s, x, notes));
        break;
      case 'service': {
        if (!inService(s)) drafts.push({ type: 'flag', fact: 'Li joins Kurogane service (the Hagiwara levy)', visible: true, data: { key: 'levy_service', value: 1 } });
        break;
      }
      case 'dies': {
        const npc = str(x.npc, 40);
        if (npc === s.liId) { notes.push('Li does not die'); break; }
        if (!known(npc) || !s.characters[npc].alive) break;
        // A death Li causes is a fight the code runs (it can end in a kill), never a story claim. Default deny
        // (engine/factcheck.ts liHandInDeath): Li in the scene or the reason, or the dead named in the player's words.
        if (liHandInDeath(s, npc, `${scene} ${str(x.reason, 100)}`, said ?? '')) {
          secretNotes.push(`${s.characters[npc].name} does not die by Li's hand in story text: a fight between them must be started with "fight" and decided by the code`);
          break;
        }
        drafts.push({ type: 'status', fact: `${s.characters[npc].name} dies (${str(x.reason, 100)})`, visible: true, data: { char: npc, status: s.characters[npc].status, role: s.characters[npc].role, alive: false } });
        break;
      }
      case 'freedom':
        drafts.push(...freedomCheck(s, String(x.route), notes));
        break;
      case 'deed':
        { const d = deedDrafts(s, x, deeds, notes, pendingMerit); if (d.length) deeds++; drafts.push(...d); }
        break;
      case 'promotion':
        drafts.push(...promotionDrafts(s, x, notes));
        break;
      case 'ceremony':
        drafts.push(...ceremonyDrafts(s, x, notes));
        break;
      case 'title':
        drafts.push(...titleDrafts(s, x, notes));
        break;
      case 'grow':
        drafts.push(...growDrafts(s, x, grown, notes));
        break;
      case 'role':
        drafts.push(...roleDrafts(s, x, notes));
        break;
      case 'serve':
        drafts.push(...serveDrafts(s, String(x.kingdom ?? ''), notes));
        break;
      case 'battle':
        drafts.push(...battleStartDrafts(s, x, notes));
        break;
      case 'land':
        drafts.push(...trackLand(landDrafts(s, x, notes, land)));
        break;
      case 'project':
        drafts.push(...trackLand(projectDrafts(s, x, notes, land)));
        break;
      case 'domain':
        drafts.push(...trackLand(domainOrderDrafts(s, x, notes, land)));
        break;
      default:
        notes.push(`unknown change "${String(x.kind)}" ignored`);
    }
  }
  return drafts;
}

/** Freedom only when a real route holds (World Bible 10.4). */
function freedomCheck(s: GameState, route: string, notes: string[]): Draft[] {
  const c = li(s);
  if (c.status !== 'slave') return [];
  const rv = (f: RelField) => relSnapshot(s.relations.raizen, today(s))[f];
  const free = (how: string, role: string, extra: Draft[] = []): Draft[] => [
    ...extra,
    { type: 'status', fact: 'Li is free', visible: true, data: { char: c.id, status: 'free', role } },
    { type: 'knowledge', fact: `freed: ${how}`, visible: false, data: { key: 'free' } },
    { type: 'knowledge', fact: 'stage 1 complete', visible: false, data: { key: 'stage1_complete' } },
  ];
  switch (route) {
    case 'merit':
      if (inService(s) && has(s, 'merit_service') >= MERIT_FOR_FREEDOM) return free('merit', 'a free youth, freed by the merit law');
      notes.push(`not free yet: the merit law needs ${MERIT_FOR_FREEDOM} merit in service (Li has ${has(s, 'merit_service')})`);
      return [];
    case 'head':
      if (has(s, 'kogashira_head') > 0) return free('head', 'a free youth, freed by an officer\'s head');
      notes.push('not free yet: no enemy Kogashira head taken in service (only a fight can do that)');
      return [];
    case 'bought':
      if (s.money >= PRICE_MON) return free('bought', 'a free youth who bought his own freedom', [{ type: 'money', fact: `Li pays ${PRICE_MON} mon for his freedom`, visible: true, data: { amount: -PRICE_MON } }]);
      notes.push(`not free yet: Li has ${s.money} of ${PRICE_MON} mon`);
      return [];
    case 'raizen':
      if (rv('trust') >= 85 && rv('respect') >= 85) return free('raizen', 'a free youth of the Red Crane camp');
      notes.push(`not free yet: Raizen's trust ${Math.floor(rv('trust'))} and respect ${Math.floor(rv('respect'))} must both reach 85`);
      return [];
    case 'escape': {
      // Owner decision (VISIE, Phase 2 #1): escape stays possible but only in winter quarters (Months 10–12), when the
      // band is idle and the watch is thin, and only when Li can make it (the classic chronicle's bar).
      if (s.date.month < 10) { notes.push('not free: a slave can only slip away in winter quarters (Months 10–12), when the band is idle and the watch is thin'); return []; }
      const lack = c.wound > ESCAPE_NEEDS.maxWound ? 'he is too badly hurt to run'
        : c.fatigue > ESCAPE_NEEDS.maxFatigue ? 'he is worn out before he starts'
        : (c.skills.stealth ?? 0) < ESCAPE_NEEDS.stealth ? 'he is not quiet enough yet to pass the sentries'
        : (c.skills.endurance ?? 0) < ESCAPE_NEEDS.endurance ? 'he could not outrun the band\'s hunters yet'
        : undefined;
      if (lack) { notes.push(`the escape fails: ${lack}`); return []; }
      return free('escape', 'a runaway, hunted by the Red Crane', [{ type: 'knowledge', fact: 'Li is hunted', visible: false, data: { key: 'hunted' } }]);
    }
    default:
      notes.push(`unknown freedom route "${route}"`);
      return [];
  }
}

const OFFICER_MEN: Record<NonNullable<GmFight['officer']>, number> = { 'Gochō': 5, 'Kogashira': 10, 'Gojū-gashira': 50, 'Hyakunin-gashira': 100 };

/**
 * What the code itself knows about a fight Claude starts (owner, Oct 12: "impossible things really cannot happen").
 * Claude's labels are only Li's guess: the foe's strength comes from the person's real numbers when he is someone the
 * code knows; officer rank, an enemy and witnesses count only where the code records a war (a raid on the ford today,
 * or a battle in progress) and the officer is on that record. Anything else is fought, but earns no merit or head.
 */
export function fightFacts(s: GameState, f: GmFight, scenePlace?: string) {
  const name = f.foe.toLowerCase();
  const person = Object.values(s.characters).find((p) => p.id !== s.liId && p.alive && (name.includes(p.name.toLowerCase()) || name.includes(p.id)));
  // A raid is at the ford: it counts only if Li is there (his recorded place, or this scene's place). Copilot QA, PR #5.
  const atFord = [PLACES[li(s).location] ?? li(s).location, scenePlace ?? ''].some((p) => /\b(ford|Kurose)\b/i.test(p));
  const raid = atFord ? raidIndexOn(today(s)) : undefined;
  const raidOfficer = raidOfficerOn(today(s));
  const battle = s.battle && !s.battle.over ? s.battle : undefined;
  const flags: string[] = []; // what this fight uses up (a raid has one officer and one fight that counts)
  let officer: GmFight['officer'];
  let foeName = f.foe;
  if (f.officer && !person && raid !== undefined && raidOfficer?.rank === f.officer && !has(s, `raid_officer_${raid}`)) {
    // Copilot review of PR #5: a label alone made a "farmhand" the raid's Kogashira. Now the fight IS against the
    // officer on the record (his name, his strength), and only once per raid.
    officer = f.officer;
    foeName = raidOfficer.name;
    flags.push(`raid_officer_${raid}`);
  } else if (f.officer && !person && battle?.units.some((u) => u.side === 'enemy' && !!u.commander && name.includes(u.commander.toLowerCase()) && u.men >= OFFICER_MEN[f.officer!])) officer = f.officer;
  const raidFight = raid !== undefined && !battle && !has(s, `raid_fight_${raid}`);
  const enemy = !!f.witnessedEnemy && !person && (!!battle || raidFight);
  if (enemy && raidFight) flags.push(`raid_fight_${raid}`);
  const strength = person ? { val: person.stats.VAL, mastery: Math.max(0, ...Object.values(person.styles)) }
    : officer && raidOfficer && foeName === raidOfficer.name ? { val: raidOfficer.val, mastery: raidOfficer.mastery }
    : { val: RANK_SCORE[f.rank] + 1, mastery: RANK_SCORE[f.rank] - 1 };
  const notes: string[] = [];
  if (f.officer && !officer) notes.push(`"${f.foe}" fights, but is not a ${f.officer} on the code's record (no raid or battle names him, or his fight is over): no officer merit or head`);
  else if (officer && foeName !== f.foe) notes.push(`the officer at the ford today is ${foeName}: the fight is against him`);
  if (f.witnessedEnemy && !enemy) notes.push(`"${f.foe}" is not an enemy in a war the code records now (or today's one fight that counts is over): no merit for this fight`);
  return { person, officer, foeName, strength, enemy, flags, notes };
}

/** A fight the Game Master starts: the duel engine decides it, never Claude. */
function gmDuelStart(s: GameState, id: string, f: GmFight, notes: string[] = [], scenePlace?: string): Draft[] {
  const c = li(s);
  const facts = fightFacts(s, f, scenePlace);
  notes.push(...facts.notes);
  const foe = facts.foeName;
  const foeId = facts.person?.id ?? `gmfoe_${slug(foe)}`;
  // An officer's merit and head come only from a fight to the death (Copilot QA, PR #5: a practice win freed Li).
  const officerMerit = facts.officer && facts.enemy && f.deadly && inService(s) ? OFFICER_MERIT[facts.officer] : 0;
  const plainMerit = facts.enemy && f.deadly ? 1 : 0;
  const head = facts.officer && facts.officer !== 'Gochō' && facts.enemy && f.deadly && inService(s);
  const won: DuelOutcome = {
    fact: `${foe} goes down.`,
    journal: `I beat ${foe}.`,
    grow: 1.0,
    merit: officerMerit || plainMerit ? { amount: officerMerit || plainMerit, why: officerMerit ? `enemy ${facts.officer} head` : 'witnessed kill of an enemy' } : undefined,
    flag: head ? ['kogashira_head', 1] : undefined,
  };
  const t: DuelTemplate = {
    id,
    place: f.place ?? PLACES[c.location] ?? c.location,
    intro: `${foe} — ${f.look}.`,
    foe: { id: foeId, name: facts.person?.name ?? foe.replace(/^A /, 'the ').replace(/^An /, 'the '), val: facts.strength.val, mastery: facts.strength.mastery, wound: 0, fatigue: 0, estimate: `${f.look} · Warrior ${f.rank}?` },
    prefs: [{ attack: 3, counter: 1, feint: 1, observe: 0 }, { attack: 1, counter: 3, feint: 0, observe: 1 }, { attack: 1, counter: 1, feint: 3, observe: 0 }][s.nextSeq % 3],
    surprise: false,
    maxWound: f.deadly ? 3 : 1,
    fleeRisk: 'shame, and whatever he does next',
    fleeText: 'Li breaks away and runs.',
    yieldText: 'Li lowers his weapon.',
    outcomes: {
      won,
      lost: { fact: `${foe} beats Li.`, journal: `${foe} beat me.`, grow: 0.5 },
      draw: { fact: 'Neither of them can finish it.', journal: `My fight with ${foe} ended with no winner.`, grow: 0.5 },
      fled: { fact: 'Li runs from the fight.', journal: `I ran from ${foe}.`, grow: 0 },
      yielded: { fact: 'Li gives up the fight.', journal: `I gave up against ${foe}.`, grow: 0 },
    },
  };
  const mastery = Math.max(0, ...Object.values(c.styles));
  const state = {
    id, round: 0, over: false, surprise: false, prefs: { ...t.prefs }, place: t.place, estimate: t.foe.estimate,
    li: { id: c.id, name: 'Li', val: c.stats.VAL, mastery, wound: c.wound, fatigue: c.fatigue, observed: 0, history: [] },
    foe: { id: t.foe.id, name: t.foe.name, val: t.foe.val, mastery: t.foe.mastery, wound: 0, fatigue: 0, observed: 0, history: [] },
  };
  return [...facts.flags.map((k): Draft => ({ type: 'flag', fact: `${k} used`, visible: false, data: { key: k, value: 1 } })), { type: 'duel', fact: `fight begins: ${foe}`, visible: false, data: { state, template: t } }];
}

/** Time passes between scenes: healing, rest, the season (same healing as playing the days). */
export function gmTimeDrafts(s: GameState, days: number, part?: Part): Draft[] {
  const c = li(s);
  const max = stageDayCap(s);
  const n = clamp(Math.round(days), 0, max);
  const out: Draft[] = [];
  if (n > 0) {
    let wound = c.wound;
    let left = c.healDays;
    for (let d = 0; d < n && wound > 0; d++) {
      left -= 1;
      if (left <= 0) { wound = (wound - 1) as Wound; left = HEAL_DAYS[wound]; }
    }
    if (wound !== c.wound || left !== c.healDays) out.push({ type: 'wound', fact: wound < c.wound ? (wound === 0 ? 'Li\'s wound has healed' : 'Li\'s wound is better') : 'healing', visible: wound < c.wound, data: { char: c.id, wound, healDays: left } });
    if (c.fatigue > 0) out.push({ type: 'fatigue', fact: 'Li is rested', visible: false, data: { char: c.id, value: 0 } });
  }
  // Li's land runs on by itself through every month that ends in these days.
  out.push(...domainMonthDrafts(s, today(s), today(s) + n));
  // The world moves on (World Bible 13d): fuses fire on their days, and their news reaches Li by distance.
  out.push(...fuseDrafts(s, today(s) + n));
  // Everyone Li knows grows with the seasons too.
  out.push(...seasonGrowthDrafts(s, today(s), today(s) + n));
  // Time never runs backwards: a part earlier than now on the same day is ignored.
  const later = part && PARTS.indexOf(part) > PARTS.indexOf(s.date.part);
  const to = dateFromIndex(today(s) + n, n > 0 ? part ?? 'morning' : later ? part! : s.date.part);
  if (n > 0 || later) out.push({ type: 'time', fact: `time → ${to.year}/${to.month}/${to.day} ${to.part}`, visible: false, data: { to } });
  return out;
}

/** The longest skip one scene may make now (GE ch. 9 §6). */
export const gmDayCap = (s: GameState) => stageDayCap(s);

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, few: 3 };
const UNIT_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, season: 90, year: 360 };

/** Days left to a time-skip target the code can read ("until Li is 14", "until Year 101", "for 3 months"); undefined when only Claude can tell ("until the next battle"). */
export function skipDaysLeft(s: GameState, until: string, startDay: number): number | undefined {
  const t = until.toLowerCase();
  const age = t.match(/\b(?:is|turns?|aged?|ages)\s+(\d{1,2})\b/);
  if (age) {
    const b = li(s).born;
    return dayIndex({ year: b.year + Number(age[1]), month: b.month, day: b.day, part: 'morning' }) - today(s);
  }
  const year = t.match(/\byear\s+(\d{3})\b/);
  if (year) return dayIndex({ year: Number(year[1]), month: 1, day: 1, part: 'morning' }) - today(s);
  const dur = t.match(/\b(\d{1,3}|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|few)\s+(day|week|month|season|year)s?\b/);
  if (dur) return startDay + (NUMBER_WORDS[dur[1]] ?? Number(dur[1])) * UNIT_DAYS[dur[2]] - today(s);
  return undefined;
}

/** Record one scene: checked changes as events, then the time that passes (unless a fight starts now). */
export function gmApply(s: GameState, t: GmTurn, said?: string): GmResult & { events: import('./types').GameEvent[] } {
  const r = checkGmTurn(s, t, said);
  const events = commitDrafts(s, r.drafts);
  // No time passes while a battle is being fought: its phases are the clock.
  if (!r.duelId && !(s.battle && !s.battle.over)) events.push(...commitDrafts(s, gmTimeDrafts(s, ...sceneTime(s, t))));
  events.push(...commitDrafts(s, refereeDrafts(r.notes, r.secretNotes ?? [])));
  return { ...r, events };
}

/**
 * When the next scene starts, from what Claude says explicitly (owner, Oct 11: "I went to sleep and it stayed day 1"): Li
 * sleeps, or the scene ends in a part of the day that is already past ("morning" after an evening): the next day. Never
 * guessed from the prose.
 */
export function sceneTime(s: GameState, t: Pick<GmTurn, 'days' | 'part' | 'sleeps'>): [number, Part | undefined] {
  const days = Math.max(0, Math.round(t.days ?? 0));
  if (days > 0) return [days, t.part];
  if (t.sleeps) return [1, 'morning'];
  if (t.part && PARTS.indexOf(t.part) < PARTS.indexOf(s.date.part)) return [1, t.part];
  return [0, t.part];
}

/** The referee's notes as one hidden alert (the secret ones only in data, for Claude). */
function refereeDrafts(notes: string[], secretNotes: string[], extra: Record<string, unknown> = {}): Draft[] {
  if (!notes.length && !secretNotes.length) return [];
  return [{ type: 'alert', fact: notes.length ? `The rules held: ${notes.join('; ')}.` : 'The rules held.', visible: false, data: { gmNotes: notes, ...(secretNotes.length ? { gmSecretNotes: secretNotes } : {}), ...extra } }];
}

// ---------- "Something's wrong": fixes and rewinds (Ironman stays: fair losses and bad choices are never undone) ----------

/** Turn Claude's raw fix answer into a safe proposal; the rewind is capped (≤ 3, never across a fight the code decided). */
export function parseGmFix(raw: unknown, s: GameState): GmFixProposal | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  let explanation = str(o.explanation, 800);
  if (!explanation) return undefined;
  const changes = Array.isArray(o.changes) ? (o.changes.filter((x) => x && typeof x === 'object' && typeof (x as { kind?: unknown }).kind === 'string') as GmChange[]).slice(0, 12) : [];
  const want = clamp(Math.floor(num(o.rewindScenes)), 0, 3);
  const rewindScenes = Math.min(want, gmRewindLimit(s.events));
  if (rewindScenes < want && rewindScenes < s.events.filter((e) => e.type === 'scene').length) explanation += ' A fight is never taken back: the story can only go back to the scene after it.';
  return { explanation, changes, rewindScenes };
}

/** Record a fix: checked corrections (reason "Correction: …") and a visible note. Does not rewind: do that first (gmRewind). */
export function gmApplyFix(s: GameState, p: GmFixProposal, report: string): GameEvent[] {
  const notes: string[] = [];
  const secretNotes: string[] = [];
  const corr = (x: string) => (/^correction:/i.test(x) ? x : `Correction: ${x}`);
  const changes = (p.changes ?? []).filter((x) => x && typeof x === 'object').map((x) => {
    const r = (x as { reason?: unknown }).reason;
    return (typeof r === 'string' && r.trim() ? { ...x, reason: corr(r.trim()) } : x) as GmChange;
  });
  const fixes = checkChanges(s, changes, notes, secretNotes, undefined, true).map((d) => ({ ...d, fact: corr(d.fact), data: { ...d.data, correction: true } }));
  const explanation = str(p.explanation, 800) || 'The memory was checked.';
  const changed = fixes.length + Math.max(0, Math.floor(num(p.rewindScenes)));
  const note: Draft = {
    type: 'correction', visible: true,
    fact: changed ? `Correction: ${explanation}` : `Report checked, nothing changed: ${explanation}`,
    data: { report: str(report, 300), explanation, changed },
  };
  return commitDrafts(s, [note, ...fixes, ...refereeDrafts(notes, secretNotes, { fix: true })]);
}

const sceneIndexes = (events: GameEvent[]) => events.flatMap((e, k) => (e.type === 'scene' ? [k] : []));

/** The event log without the last N scenes (everything from the Nth-last scene event on is removed). */
export function gmRewindEvents(events: GameEvent[], scenes: number): GameEvent[] {
  const n = Math.max(0, Math.floor(scenes));
  const idx = sceneIndexes(events);
  if (!n || !idx.length) return events.slice();
  return events.slice(0, idx[Math.max(0, idx.length - n)]);
}

/** How many of the last scenes can be taken back without undoing a fight the code decided (Ironman). */
export function gmRewindLimit(events: GameEvent[], max = 3): number {
  const idx = sceneIndexes(events);
  let n = 0;
  for (let k = idx.length - 1; k >= 0 && n < max; k--, n++) {
    if (events.slice(idx[k]).some((e) => e.type === 'story' && (e.data as { duelEnd?: string }).duelEnd)) break;
  }
  return n;
}

/** The record a rewind leaves: append it (commitDrafts) to the rewound game so the rewind itself is logged. */
export function gmRewindNote(report: string, scenes: number): Draft {
  const n = Math.max(0, Math.floor(scenes));
  return {
    type: 'correction', visible: true,
    fact: `Correction: the last ${n === 1 ? 'scene was' : `${n} scenes were`} taken back because ${n === 1 ? 'it' : 'they'} broke the facts.`,
    data: { rewind: n, report: str(report, 300) },
  };
}

/** Take back the last N scenes (capped by gmRewindLimit) and log it: returns the rebuilt game (the old one is unchanged). */
export function gmRewind(s: GameState, scenes: number, report: string): GameState {
  const n = Math.min(Math.max(0, Math.floor(scenes)), gmRewindLimit(s.events));
  if (!n) return s;
  const back = replay(s.worldNumber, gmRewindEvents(s.events, n));
  commitDrafts(back, [gmRewindNote(report, n)]);
  return back;
}

/** The last scenes in full with what the code recorded after each (for a fix: Claude compares them with the report). */
export function gmRecentScenes(s: GameState, n = 3): string {
  const idx = sceneIndexes(s.events).slice(-n);
  return idx.map((start, k) => {
    const end = k + 1 < idx.length ? idx[k + 1] : s.events.length;
    const e = s.events[start];
    const d = e.data as { title?: string | null; said?: string | null };
    const rec = s.events.slice(start + 1, end).filter((x) => !['time', 'duel', 'work'].includes(x.type)).slice(0, 30).map((x) => x.fact);
    return [
      `SCENE ${k - idx.length} (${formatDate(dateFromIndex(e.day, e.part))}${d.title ? `, "${d.title}"` : ''})${k === idx.length - 1 ? ' — the newest' : ''}`,
      d.said ? `The player wrote: ${d.said}` : '',
      e.fact,
      `Recorded by the code: ${rec.join('; ') || 'nothing'}`,
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

/** A new life in Game Master mode: the same world, no fixed story beats; Claude opens the first scene. */
export function startGmGame(worldNumber = 1): GameState {
  const s = createWorld(worldNumber);
  commitDrafts(s, [{ type: 'flag', fact: 'Game Master mode', visible: false, data: { key: 'gm_mode', value: 1 } }]);
  return s;
}

/** After a fight the code ran: what happened, for Claude to tell (the result is fixed, not Claude's to change). */
export function lastFightResult(s: GameState): string | undefined {
  const e = [...s.events].reverse().find((x) => x.type === 'story' && (x.data as { duelEnd?: string }).duelEnd);
  if (!e) return undefined;
  const d = e.data as { duelEnd: string; result: string };
  if (!d.duelEnd.startsWith('gm_') || s.gm?.scenes.length && s.events.some((x) => x.seq > e.seq && x.type === 'scene')) return undefined;
  const t = s.gm?.duels[d.duelEnd];
  const c = li(s);
  return `THE FIGHT IS OVER (decided by the code, round by round, with the player's moves): against ${t?.foe.name ?? 'the foe'}, Li ${d.result === 'won' ? 'WON' : d.result === 'lost' ? 'LOST' : d.result === 'draw' ? 'fought to a DRAW' : d.result === 'fled' ? 'RAN' : 'GAVE UP'}. Li is now ${WOUND_LABEL[c.wound]}. Tell what happens right after, true to this result.`;
}

export { dayIndex, seasonKey };
