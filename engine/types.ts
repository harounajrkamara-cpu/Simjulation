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
  | 'duel';

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
    | 'buy_freedom';
  target?: string; // npc id, or training focus
}

export interface Option {
  key: string; // "1", "2", …
  label: string;
  action: Action;
  test?: string; // e.g. "⚔️ VAL"
  risk?: string; // immediate risk only (ch. 11)
}
