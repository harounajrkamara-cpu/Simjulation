import { ageOn, dateFromIndex } from './calendar';
import { met } from './engine';
import { SEASON_TRAINING_CAP, growthGain, r3 } from './rules';
import { Draft, GameState, STAT_KEYS, StatKey } from './types';

// Everyone grows (owner vision Oct 10): the people Li knows age and change with their lives, not only Li. Each season
// the code gives them the growth of the life they lead (the same formula and cap as Li's training, Numbers §2), and
// Claude may propose growth for what they truly did (a battle survived, a duel won), checked here. Pure.

/** What a person's life trains, read from their role. */
export function lifeStat(role: string): StatKey {
  const r = role.toLowerCase();
  if (/(lord|lady|daughter|son of|noble|steward|merchant|official|chancellor|regent|minister|headman)/.test(r)) return 'POL';
  if (/(commander|general|captain|officer|gashira|shō|taishō|leader)/.test(r)) return 'LEA';
  if (/(scholar|monk|medic|cook|quartermaster|scribe|teacher|engineer)/.test(r)) return 'INT';
  return 'VAL';
}

/** Days of the season a person spends on their craft (half of it: the rest is life). */
const SEASON_PRACTICE_DAYS = 45;
const DAILY = 0.02;

/** Every season boundary crossed between two days: growth for everyone Li has met, and VAL's decline with age. */
export function seasonGrowthDrafts(s: GameState, from: number, to: number): Draft[] {
  const out: Draft[] = [];
  for (let k = from + 1; k <= to; k++) {
    if (k % 90 !== 0) continue; // the first day of a season
    const date = dateFromIndex(k);
    for (const c of Object.values(s.characters)) {
      if (c.id === s.liId || !c.alive || !met(s, c.id)) continue;
      const age = ageOn(c.born, date);
      const stat = lifeStat(c.role);
      const gain = r3(Math.min(SEASON_TRAINING_CAP, growthGain(DAILY * SEASON_PRACTICE_DAYS, age, c.stats[stat], c.potential[stat])));
      if (gain > 0) out.push({ type: 'stat', fact: `${c.name} grows (${stat} +${gain})`, visible: false, data: { char: c.id, stat, amount: gain } });
      // Numbers §2: VAL −0.5 a year after 45, −1 after 55 (a quarter of it each season).
      const decline = age > 55 ? -0.25 : age > 45 ? -0.125 : 0;
      if (decline && c.stats.VAL > 1) out.push({ type: 'stat', fact: `${c.name} slows with age`, visible: false, data: { char: c.id, stat: 'VAL', amount: decline } });
    }
  }
  return out;
}

/** Claude's proposal: a person grew from something they truly did. At most one per person per scene, sized like Li's deeds. */
export function growDrafts(s: GameState, x: Record<string, unknown>, done: Set<string>, notes: string[]): Draft[] {
  const id = String(x.npc ?? '');
  const c = s.characters[id];
  const stat = String(x.stat ?? '') as StatKey;
  const reason = typeof x.reason === 'string' ? x.reason.trim().slice(0, 160) : '';
  if (!c || id === s.liId) { notes.push(`grow: unknown person "${id}"`); return []; }
  if (!STAT_KEYS.includes(stat)) { notes.push(`grow: unknown stat "${stat}"`); return []; }
  if (!reason) { notes.push(`grow: ${c.name} needs a reason (what they did)`); return []; }
  if (done.has(id)) { notes.push(`grow: ${c.name} grows once per scene`); return []; }
  done.add(id);
  // Numbers §2 base gains: a real fight survived 0.4, a duel or battle won 1.0 (the bigger only when Claude says "big").
  const base = x.big === true ? 1.0 : 0.4;
  const gain = r3(growthGain(base, ageOn(c.born, s.date), c.stats[stat], c.potential[stat]));
  return gain > 0 ? [{ type: 'stat', fact: `${c.name} grows: ${reason}`, visible: false, data: { char: id, stat, amount: gain } }] : [];
}

/** A new role or rank for someone (promoted, retired, sold, made a lord): what Li would hear. */
export function roleDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const id = String(x.npc ?? '');
  const c = s.characters[id];
  const role = typeof x.role === 'string' ? x.role.trim().slice(0, 80) : '';
  if (!c || id === s.liId || !role) { notes.push('role: needs a known person and the new role'); return []; }
  if (role === c.role) return [];
  return [{ type: 'status', fact: `${c.name} is now ${role}`, visible: met(s, id), data: { char: id, status: c.status, role } }];
}
