import { HEAL_DAYS, WOUND_LABEL, r3 } from './rules';
import { Wound } from './types';

// Duel engine (World Bible ch. 6a, Numbers Sheet §4 v0.3). Fully deterministic.

export type DuelMove = 'attack' | 'counter' | 'feint' | 'observe';
export const DUEL_MOVES: DuelMove[] = ['attack', 'counter', 'feint', 'observe'];

export const MOVE_LABEL: Record<DuelMove, string> = {
  attack: 'Attack — strike hard and direct',
  counter: 'Defend & counter — wait for his strike and punish it',
  feint: 'Feint — fake a strike to open his guard',
  observe: 'Observe — hold back and read him',
};

/** Choice clash (ch. 6a): counter beats attack · attack beats feint and observe · feint beats counter and observe · observe beats counter. */
const BEATS: Record<DuelMove, DuelMove[]> = {
  attack: ['feint', 'observe'],
  counter: ['attack'],
  feint: ['counter', 'observe'],
  observe: ['counter'],
};

export function clashWinner(a: DuelMove, b: DuelMove): 'a' | 'b' | null {
  if (BEATS[a].includes(b)) return 'a';
  if (BEATS[b].includes(a)) return 'b';
  return null;
}

export interface DuelFighter {
  id: string;
  name: string;
  val: number;
  mastery: number;
  wound: Wound;
  fatigue: number;
  /** Rounds spent observing the other (max 3 → +15%). */
  observed: number;
  history: DuelMove[];
  /** A permanent injury taken in this fight (Numbers §4: a Badly wounded hit with a gap above 100%). */
  injury?: string;
}

export interface DuelState {
  id: string;
  round: number;
  li: DuelFighter;
  foe: DuelFighter;
  /** Base preference of the opponent per move (personality, ch. 6a). */
  prefs: Record<DuelMove, number>;
  /** Li strikes first by surprise in round 1 (+30%). */
  surprise: boolean;
  /** Hint Li has learned about the foe's habits (shown after observing). */
  hint?: string;
  over: boolean;
  /** Where the fight happens and what Li thinks of the foe (fog of war). */
  place?: string;
  estimate?: string;
  result?: 'won' | 'lost' | 'draw' | 'fled' | 'yielded';
  /** Li's abilities in this fight (engine/abilities.ts): the Zone, the chosen techniques, aura. */
  zone?: { rounds: number; left: number; uses: number; used: number };
  liBonus?: Partial<Record<DuelMove, number>>;
  liAbilities?: string[];
  kageUsed?: boolean;
  /** Rounds the foe hesitates under Li's aura (he only watches). */
  foeHesitates?: number;
  /** The foe's abilities (a known person's records). */
  foeAbilities?: string[];
}

/** Li can enter the Zone now (he has it, it is not running, uses are left). */
export const canZone = (d: DuelState) => !!d.zone && d.zone.left === 0 && d.zone.used < d.zone.uses && !d.over;

/** SHINKEN NO RYŪ: the Zone starts; no round passes (the player then picks a move). */
export function activateZone(prev: DuelState): RoundResult {
  const d: DuelState = structuredClone(prev);
  if (!canZone(d)) return { state: d, lines: [] };
  d.zone = { ...d.zone!, left: d.zone!.rounds, used: d.zone!.used + 1 };
  return { state: d, lines: [`SHINKEN NO RYŪ. The world goes quiet and slow; Li sees every move before it comes (${d.zone.rounds} round${d.zone.rounds > 1 ? 's' : ''}).`] };
}

/** Style factor v0.3. */
export function styleFactor(mastery: number): number {
  if (mastery <= 20) return 0.8;
  if (mastery <= 40) return 1.0;
  if (mastery <= 60) return 1.15;
  if (mastery <= 80) return 1.3;
  return 1.45;
}

const CONDITION: Record<Wound, number> = { 0: 0, 1: -0.1, 2: -0.25, 3: -0.45, 4: -1 };

export function conditionFactor(f: DuelFighter): number {
  return Math.max(0.05, 1 + CONDITION[f.wound] - 0.05 * Math.min(3, f.fatigue));
}

/** Combat power per round (Numbers §4): VAL × style × condition × (1 + situational, capped ±50%). */
export function combatPower(f: DuelFighter, situational: number): number {
  const sit = Math.max(-0.5, Math.min(0.5, situational));
  return r3(f.val * styleFactor(f.mastery) * conditionFactor(f) * (1 + sit));
}

/** Opponent policy: personality + learning from Li's habits + its own state. Fixed tie order. */
export function foeMove(d: DuelState): DuelMove {
  const score: Record<DuelMove, number> = { ...d.prefs };
  const recent = d.li.history.slice(-3);
  for (const m of recent) {
    for (const answer of DUEL_MOVES) if (BEATS[answer].includes(m)) score[answer] += 1.5;
  }
  if (d.foe.wound >= 2) score.counter += 1;
  if (d.li.wound >= 2) score.attack += 1;
  // Avoid repeating the same move three times in a row.
  const last2 = d.foe.history.slice(-2);
  if (last2.length === 2 && last2[0] === last2[1]) score[last2[0]] -= 2;
  let best: DuelMove = 'attack';
  for (const m of DUEL_MOVES) if (score[m] > score[best]) best = m;
  return best;
}

export function habitHint(d: DuelState): string {
  const order = [...DUEL_MOVES].sort((a, b) => d.prefs[b] - d.prefs[a]);
  const top = order[0];
  const txt: Record<DuelMove, string> = {
    attack: 'He likes to strike first and hard.',
    counter: 'He waits for Li to come to him.',
    feint: 'He fakes before he strikes.',
    observe: 'He watches more than he fights.',
  };
  return `${txt[top]} He also changes his answer when Li repeats himself.`;
}

export interface RoundResult {
  state: DuelState;
  lines: string[];
}

/** Resolve one round. Pure: returns a new duel state and plain fact lines. */
export function duelRound(prev: DuelState, liMove: DuelMove): RoundResult {
  const d: DuelState = structuredClone(prev);
  const lines: string[] = [];
  // Aura (ch. 12b): a much weaker foe hesitates and only watches.
  const hesitates = (d.foeHesitates ?? 0) > 0;
  const fm = hesitates ? 'observe' : foeMove(d);
  if (hesitates) d.foeHesitates! -= 1;
  d.round += 1;
  d.li.history.push(liMove);
  d.foe.history.push(fm);
  lines.push(`Round ${d.round}: Li ${verb3(liMove)}; ${d.foe.name} ${verb3(fm)}.`);

  if (hesitates) lines.push(`${d.foe.name} hesitates under Li's presence.`);
  const has = (id: string) => (d.liAbilities ?? []).includes(id);
  const zoneOn = !!d.zone && d.zone.left > 0;
  let win = clashWinner(liMove, fm);
  // Abilities change the clash, never add hidden strength (Numbers §4).
  if (zoneOn) win = 'a';
  else if (has('twin_demon_dance') && liMove === 'feint' && fm === 'attack') { win = 'a'; lines.push('The Twin Demon Dance: the feint turns his attack aside.'); }
  else if (has('kage_no_yaiba') && !d.kageUsed && liMove === 'attack' && fm === 'counter') { win = 'a'; d.kageUsed = true; lines.push('Kage no Yaiba: the shadow blade goes through his guard.'); }
  if (zoneOn) {
    d.zone!.left -= 1;
    if (d.zone!.left === 0) { d.li.fatigue = Math.min(3, d.li.fatigue + 2); lines.push("The Zone breaks; Li's body pays for it."); }
  }
  const strike = ['attack', 'feint'].includes(liMove) || ['attack', 'feint'].includes(fm);
  let liSit = (win === 'a' ? 0.25 : win === 'b' ? -0.15 : 0) + (d.liBonus?.[liMove] ?? 0);
  let foeSit = win === 'b' ? 0.25 : win === 'a' ? -0.15 : 0;
  const liKnow = Math.min(0.15, Math.min(3, d.li.observed) * (has('zanshin') ? 0.1 : 0.05));
  const surprise = d.surprise && d.round === 1 ? 0.3 : 0;
  liSit += Math.max(liKnow, surprise);
  foeSit += Math.min(0.15, Math.min(3, d.foe.observed) * ((d.foeAbilities ?? []).includes('zanshin') ? 0.1 : 0.05));
  if (liMove === 'observe') {
    d.li.observed += 1;
    if (d.li.observed >= 1 && !d.hint) { d.hint = habitHint(d); lines.push(`Li reads him: ${d.hint}`); }
  }
  if (fm === 'observe') d.foe.observed += 1;
  if (win === 'a') lines.push('Li\'s choice beats his.');
  if (win === 'b') lines.push('His choice beats Li\'s.');

  if (!strike) {
    lines.push('Nobody commits. They circle each other.');
    return finish(d, lines);
  }
  const liCP = combatPower(d.li, liSit);
  const foeCP = combatPower(d.foe, foeSit);
  if (liCP === foeCP) {
    d.li.fatigue = Math.min(3, d.li.fatigue + 1);
    d.foe.fatigue = Math.min(3, d.foe.fatigue + 1);
    lines.push('Blade meets blade; neither gives. Both are tiring.');
    return finish(d, lines);
  }
  const liWins = liCP > foeCP;
  const loser = liWins ? d.foe : d.li;
  const g = (Math.max(liCP, foeCP) - Math.min(liCP, foeCP)) / Math.min(liCP, foeCP);
  let steps = 0;
  if (g < 0.1) loser.fatigue = Math.min(3, loser.fatigue + 1);
  else if (g < 0.3) steps = 1;
  else if (g < 0.6) steps = 2;
  else steps = 4;
  loser.wound = Math.min(4, loser.wound + steps) as Wound;
  const who = liWins ? d.foe.name : 'Li';
  if (steps === 0) lines.push(`${who} is pushed back and tires.`);
  else lines.push(`${who} is hit → ${WOUND_LABEL[loser.wound]}.`);
  // Numbers §4: only a Badly wounded result from a gap above 100% leaves a permanent injury; the area follows the attack.
  if (loser.wound >= 3 && g > 1 && !loser.injury) {
    loser.injury = INJURY_AREA[liWins ? liMove : fm];
    lines.push(`The blow goes deep: ${who === 'Li' ? 'Li\'s' : `${who}'s`} ${loser.injury} will never be the same.`);
  }
  return finish(d, lines);
}

/** Numbers §4 "the engine picks the body area from the attack type, in a fixed order". */
export const INJURY_AREA: Record<DuelMove, string> = { attack: 'sword arm', feint: 'leg', counter: 'side', observe: 'shoulder' };
/** PROVISIONAL (Oct 17, owner kan terugdraaien): what a permanent injury costs, in VAL. */
export const INJURY_VAL: Record<string, number> = { 'sword arm': -2, leg: -1, side: -1, shoulder: -1.5 };

function finish(d: DuelState, lines: string[]): RoundResult {
  if (d.foe.wound >= 4) { d.over = true; d.result = 'won'; }
  else if (d.li.wound >= 4) { d.over = true; d.result = 'lost'; }
  else if (d.round >= 10) { d.over = true; d.result = 'draw'; }
  return { state: d, lines };
}

function verb3(m: DuelMove): string {
  return { attack: 'attacks', counter: 'waits to counter', feint: 'feints', observe: 'holds back and watches' }[m];
}

/** "Simulate" choice (ch. 11): a simple, fixed policy for Li. */
export function autoMove(d: DuelState): DuelMove {
  if (d.round === 0) return d.surprise ? 'attack' : 'observe';
  const lastFoe = d.foe.history[d.foe.history.length - 1];
  const answer = DUEL_MOVES.find((m) => BEATS[m].includes(lastFoe));
  return answer ?? 'attack';
}

/** Healing days for Li's wound after a duel. */
export function healDaysFor(w: Wound): number {
  return HEAL_DAYS[w];
}
