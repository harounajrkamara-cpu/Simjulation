// Core data types. The engine owns every number; the narrator only gets facts (World Bible ch. 11, 12b).

export type StatKey = 'LEA' | 'VAL' | 'INT' | 'POL';
export const STAT_KEYS: StatKey[] = ['LEA', 'VAL', 'INT', 'POL'];

export type Part = 'morning' | 'afternoon' | 'evening' | 'night';
export const PARTS: Part[] = ['morning', 'afternoon', 'evening', 'night'];

export interface GameDate {
  year: number;
  month: number; // 1–12
  day: number; // 1–30
  part: Part;
}

/** Wound track (ch. 6a): 0 Fresh · 1 Hurt · 2 Wounded · 3 Badly wounded · 4 Down */
export type Wound = 0 | 1 | 2 | 3 | 4;

export interface Character {
  id: string;
  name: string;
  /** Year of birth in "Years of the Warring Kingdoms". */
  born: { year: number; month: number; day: number };
  role: string;
  status: 'slave' | 'free' | 'ronin' | 'noble';
  stats: Record<StatKey, number>;
  /** Hidden ceilings. Never shown for anyone but in the engine. */
  potential: Record<StatKey, number>;
  styles: Record<string, number>;
  skills: Record<string, number>;
  wound: Wound;
  /** Days left until the current wound step heals. */
  healDays: number;
  fatigue: number; // 0–3
  traits: string[];
  location: string;
  alive: boolean;
  /** Player-facing description (only what is openly known). */
  desc: string;
  /** Estimated rank text Li would see (fog of war, ch. 5). */
  publicRank?: string;
  /** The house this person belongs to (engine/houses.ts). */
  house?: string;
  /** One of the world's people from the Atlas (not met at the start; engine/houses.ts). */
  world?: boolean;
  /** Hidden age of a natural death (engine/houses.ts, PROVISIONAL). Undefined = never of age (Li). */
  lifespan?: number;
}

/** A family (World Bible ch. 2–3): what is tracked per house (ch. 3) and how it stands. engine/houses.ts. */
export interface House {
  id: string;
  name: string;
  kingdom: string;
  tier: 'royal' | 'A' | 'B' | 'C';
  land: string;
  koku: number;
  troops: number;
  /** 0–100: how great the name is. */
  prestige: number;
  /** 0–100: loyalty to its lord (the Crown, or its liege house). */
  crownLoyalty: number;
  /** 0–100: main house vs branches; low = split / gekokujō risk. */
  cohesion: number;
  head?: string;
  heir?: string;
  faction?: string;
  liege?: string;
  branches: { name: string; koku: number }[];
  allies: string[];
  hostage?: string;
  goal?: string;
  secret?: string;
  fallen?: boolean;
}

export type RelField = 'trust' | 'respect' | 'affection' | 'fear' | 'rivalry';
export const REL_FIELDS: RelField[] = ['trust', 'respect', 'affection', 'fear', 'rivalry'];

/** A change with a reason (ch. 8). fadeDays null = permanent. */
export interface Modifier {
  id: number;
  field: RelField;
  value: number;
  reason: string;
  startDay: number;
  fadeDays: number | null;
}

/** How one NPC sees Li (one direction). */
export interface Relation {
  base: Record<RelField, number>;
  mods: Modifier[];
  /** Conversation beats already heard. */
  heard: string[];
  lastTalkDay: number;
}

export interface Memory {
  id: number;
  npc: string;
  day: number;
  what: string;
  source: 'saw' | 'told' | 'rumour';
  certainty: number; // 0–100
  weight: number; // 0–100
  /** Story this memory is about. Only memories with a key can spread as rumours. */
  key?: string;
  /** Who told it (for told / rumour). */
  from?: string;
  /** How hearing it changes the hearer's view of Li (scaled by certainty, fades like a rumour). */
  rel?: { field: RelField; value: number };
  /** What Li can notice when it reaches someone he knows; {name} = the hearer. */
  sign?: string;
}

export interface JournalEntry {
  day: number;
  text: string;
}

export type EventType =
  | 'time'
  | 'story'
  | 'work'
  | 'stat'
  | 'style'
  | 'skill'
  | 'fatigue'
  | 'wound'
  | 'relation'
  | 'memory'
  | 'knowledge'
  | 'alert'
  | 'money'
  | 'flag'
  | 'heard'
  | 'rumour'
  | 'intent'
  | 'narration'
  | 'status'
  | 'duel'
  // Game Master mode (Claude runs the world, code keeps the memory and checks the numbers):
  | 'scene'
  | 'person'
  | 'place'
  | 'thread'
  | 'lore'
  // A fix after the player's "Something's wrong" report, or a rewind of broken scenes (text only; read back by engine/gm.ts):
  | 'correction'
  // A chapter recap, written once by the Game Master (engine/recaps.ts):
  | 'chapter'
  // A battle's state after its start or a phase (engine/gm-battle.ts); null data clears it:
  | 'battle'
  // Li's land after a grant, an order, a project or a month (engine/gm-domain.ts):
  | 'domain'
  // The world's houses and people arrive once (engine/houses.ts), and a house changes:
  | 'world'
  | 'house';

/** Append-only event (ch. 11 event sourcing). Every state change is an event. */
export interface GameEvent {
  seq: number;
  day: number;
  part: Part;
  type: EventType;
  /** Plain fact line for the narrator and the LOG. */
  fact: string;
  /** Shown to the player in the changes line. Hidden events stay in the engine. */
  visible: boolean;
  /** Line for Li's journal (RECAP), written only from what Li knows. */
  journal?: string;
  data: Record<string, unknown>;
}

/** An event before it gets its number and time (engine commit adds them). */
export type Draft = Omit<GameEvent, 'seq' | 'day' | 'part'>;

export interface GameState {
  version: 1;
  worldNumber: number;
  date: GameDate;
  liId: string;
  characters: Record<string, Character>;
  relations: Record<string, Relation>; // key = npc id (npc → Li)
  memories: Memory[];
  journal: JournalEntry[];
  knowledge: string[]; // facts Li knows (flags)
  flags: Record<string, number>;
  money: number; // Li's personal money in mon
  /** Training/study gains this season per stat or style (cap, Numbers §2). */
  seasonGains: Record<string, number>;
  seasonKey: string;
  events: GameEvent[];
  nextSeq: number;
  /** Active duel, if any (ch. 6a). */
  duel?: import('./duel').DuelState | null;
  /** A battle in progress or just ended (engine/battle.ts), kept by 'battle' events. */
  battle?: import('./battle').BattleState | null;
  /** Li's land (engine/domain.ts), kept by 'domain' events. */
  domain?: import('./domain').Domain | null;
  /** Game Master mode memory (kept by events, so saves replay it). */
  gm?: GmMemory;
  /** The world's houses (engine/houses.ts), kept by 'world' and 'house' events. */
  houses?: Record<string, House>;
}

/** What the Game Master (Claude) has added to the world. Code keeps it; Claude reads it back every turn. */
export interface GmMemory {
  /** Every scene's one-line summary: the story so far. */
  scenes: { day: number; text: string }[];
  /** Open and closed storylines. */
  threads: { id: string; text: string; open: boolean; day: number }[];
  /** Encyclopedia entries Li has learned in play. */
  lore: { title: string; text: string }[];
  /** People's own plans (public goal + hidden secret), by character id. */
  agendas: Record<string, { goal: string; secret?: string }>;
  /** Fights the Game Master started (duel templates by id). */
  duels: Record<string, import('./content').DuelTemplate>;
  /** What Li can do next, suggested by the last scene. */
  suggestions: string[];
  /** Chapter recaps (owner vision Oct 10): written once by Claude every ~20 scenes, never rewritten. `scenes` = scene count at its end. */
  chapters?: { title: string; text: string; from: number; to: number; scenes: number }[];
  /** Threat clocks (pacing director, owner Oct 16): a threat that comes due unless Li acts. engine/clocks.ts. */
  clocks?: ThreatClock[];
}

export interface ThreatClock {
  id: string;
  name: string;
  /** What happens when it is full ("Gonza catches Li alone: a fight the code runs"). */
  doom: string;
  size: number;
  filled: number;
  open: boolean;
  /** Day the code last ticked it by time. */
  ticked: number;
}

/** Canonical action (ch. 12b #1): what the engine resolves, stored with the event log. */
export interface Action {
  kind:
    | 'chores'
    | 'help_sukezo'
    | 'watch_drill'
    | 'eat_with'
    | 'lesson'
    | 'talk'
    | 'listen'
    | 'rest'
    | 'sleep'
    | 'train'
    | 'meet'
    | 'duel'
    | 'choose'
    | 'buy_freedom'
    | 'escape';
  target?: string; // npc id, or training focus
}

export interface Option {
  key: string; // "1", "2", …
  label: string;
  action: Action;
  test?: string; // e.g. "⚔️ VAL"
  risk?: string; // immediate risk only (ch. 11)
}
