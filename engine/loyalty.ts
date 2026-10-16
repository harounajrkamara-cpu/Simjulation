import { has, li, met, today } from './engine';
import { clockDrafts, clocks } from './clocks';
import { loyalty, relSnapshot, FADE } from './relations';
import { careerOf } from './gm-career';
import { rankLevel } from './career';
import { spouseOf, childrenOf } from './family';
import { Draft, GameState } from './types';

// Loyalty, obedience and betrayal (World Bible ch. 8, Numbers §8), promises (Numbers §8, Game Experience ch. 5) and Li's
// dread. Built Oct 17 (owner: "build everything in one go"); PROVISIONAL numbers are marked, owner kan terugdraaien.

/** The people who serve under Li: their role says so (the Army tab uses the same rule). */
export const UNDER_LI = /\b(?:under Li|Li's (?:men|unit|army|officer|lieutenant|retainer|vassal|guard|second))\b/i;
export const underLi = (s: GameState): string[] =>
  Object.keys(s.characters).filter((id) => id !== s.liId && s.characters[id].alive && met(s, id) && s.relations[id] && UNDER_LI.test(s.characters[id].role));

/** PROVISIONAL (Oct 17): Li's authority over his own people grows with his rank: 20 at Ashigaru, +8 per rank. */
export const authority = (s: GameState) => Math.min(100, 20 + 8 * rankLevel(careerOf(s).rank));
/** PROVISIONAL (Oct 17): enforcement 40, +20 when Li holds land (guards, a hall), + half his dread. */
export const enforcement = (s: GameState) => Math.min(100, 40 + (s.domain ? 20 : 0) + Math.round(has(s, 'dread') / 2));

/** Li's own men went unpaid last month (his land could not pay them). */
const unpaid = (s: GameState) => !!s.domain && s.domain.arrears.standing + s.domain.arrears.levies > 0;

/** Numbers §8 loyalty with its modifiers: blood +15, oath +10, passed over −15, unpaid −20. */
export function loyaltyOf(s: GameState, id: string): number {
  const rel = s.relations[id];
  if (!rel) return 0;
  const blood = spouseOf(s) === id || childrenOf(s).includes(id) ? 15 : 0;
  const mods = blood + (has(s, `oath_${id}`) ? 10 : 0) - (has(s, `passed_${id}`) ? 15 : 0) - (unpaid(s) ? 20 : 0);
  return Math.max(0, Math.min(100, loyalty(rel, today(s)) + mods));
}

/** Numbers §8 obedience = 0.4 × authority + 0.4 × fear + 0.2 × enforcement. */
export function obedienceOf(s: GameState, id: string): number {
  const rel = s.relations[id];
  if (!rel) return 0;
  const fear = relSnapshot(rel, today(s)).fear;
  return Math.round(0.4 * authority(s) + 0.4 * fear + 0.2 * enforcement(s));
}

/** Numbers §8 table: what obedience and loyalty together mean. */
export function stance(loy: number, obe: number): string {
  if (obe >= 50 && loy >= 50) return 'a reliable core supporter';
  if (obe >= 50) return 'obeys while watched; may defect when a chance comes';
  if (loy >= 50) return 'may disobey an order, but stays personally committed';
  return 'a desertion or betrayal risk now';
}

/** PROVISIONAL (Oct 17) opportunity score: how much a disloyal man could gain by leaving Li now. */
export function opportunity(s: GameState): number {
  const lost = [...s.events].reverse().find((e) => e.type === 'story' && (e.data as { duelEnd?: string }).duelEnd);
  const lastLost = lost && (lost.data as { result?: string }).result !== 'won';
  const civilWar = Object.keys(s.flags).some((k) => k.startsWith('civil_war_') && s.flags[k] > 0);
  return 30 + (lastLost ? 20 : 0) + (li(s).wound >= 2 ? 20 : 0) + (civilWar ? 20 : 0) + (unpaid(s) ? 20 : 0);
}

/** Numbers §8 betrayal: loyalty < 40, opportunity ≥ 60, obedience < 50, all three. */
export const betrayalRisk = (s: GameState, id: string) => loyaltyOf(s, id) < 40 && obedienceOf(s, id) < 50 && opportunity(s) >= 60;

/** Each month that ends: a man who meets all three betrayal conditions starts to turn (a threat clock the code runs). */
export function betrayalDrafts(s: GameState, from: number, to: number): Draft[] {
  let monthEnds = 0;
  for (let k = from + 1; k <= to; k++) if (k % 30 === 0) monthEnds++;
  if (!monthEnds) return [];
  const out: Draft[] = [];
  const notes: string[] = [];
  for (const id of underLi(s)) {
    if (!betrayalRisk(s, id) || clocks(s).some((c) => c.id === `betray_${id}` && c.open)) continue;
    const name = s.characters[id].name;
    out.push(...clockDrafts(s, { id: `betray_${id}`, name: `${name} is thinking of leaving Li`, doom: `${name} betrays Li: deserts with his men, sells Li's plans, or opens a gate`, size: 4 }, notes));
  }
  return out;
}

// ── Promises (Numbers §8: kept → Trust +10; broken → Trust −25, half of it a permanent scar, the rest heals in 2 years) ──

const PROMISE_HEAL_DAYS = 720;
const slugOf = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
export const openPromises = (s: GameState) => (s.gm?.threads ?? []).filter((t) => t.open && t.id.startsWith('promise_'));

/** {kind:"promise", npc, text, outcome:"made"|"kept"|"broken"}: a promise is a tracked thread; keeping or breaking it is felt. */
export function promiseDrafts(s: GameState, x: { npc?: unknown; text?: unknown; outcome?: unknown }, notes: string[]): Draft[] {
  const npc = String(x.npc ?? '');
  const p = s.characters[npc];
  if (!p || !s.relations[npc]) { notes.push(`no person "${npc}" to promise to`); return []; }
  const outcome = String(x.outcome ?? 'made');
  if (outcome === 'made') {
    const text = String(x.text ?? '').trim().slice(0, 160);
    if (!text) { notes.push('a promise needs its words'); return []; }
    return [{ type: 'thread', fact: `Li promised ${p.name}: ${text}`, visible: true, journal: `I gave ${p.name} my word: ${text}`, data: { id: `promise_${npc}_${slugOf(text)}`, text: `Li promised ${p.name}: ${text}`, open: true } }];
  }
  const open = openPromises(s).find((t) => t.id.startsWith(`promise_${npc}_`) && (!x.text || t.text.toLowerCase().includes(String(x.text).toLowerCase().slice(0, 20))))
    ?? openPromises(s).find((t) => t.id.startsWith(`promise_${npc}_`));
  if (!open) { notes.push(`Li made no open promise to ${p.name}`); return []; }
  const close: Draft = { type: 'thread', fact: `${outcome === 'kept' ? 'kept' : 'broken'}: ${open.text}`, visible: false, data: { id: open.id, text: open.text, open: false } };
  if (outcome === 'kept') return [close, { type: 'relation', fact: `${p.name} trusts Li more: he kept his word`, visible: true, data: { npc, field: 'trust', value: 10, reason: 'a promise kept', fade: FADE.hardship } }];
  if (outcome === 'broken') return [close,
    { type: 'relation', fact: `${p.name} will not forget the broken promise`, visible: true, data: { npc, field: 'trust', value: -12.5, reason: 'a promise broken (scar)', fade: FADE.permanent } },
    { type: 'relation', fact: 'broken promise', visible: false, data: { npc, field: 'trust', value: -12.5, reason: 'a promise broken', fade: PROMISE_HEAL_DAYS } }];
  notes.push(`promise outcome "${outcome}" unknown (made, kept or broken)`);
  return [];
}

/** {kind:"cruelty", reason}: an act of cruelty Li becomes known for: Dread +5 in the world (Numbers §8). */
export function crueltyDrafts(s: GameState, x: { reason?: unknown }, notes: string[]): Draft[] {
  const why = String(x.reason ?? '').trim().slice(0, 120);
  if (!why) { notes.push('cruelty needs what Li did'); return []; }
  return [{ type: 'flag', fact: `Word spreads of Li's cruelty: ${why}`, visible: true, data: { key: 'dread', value: Math.min(100, has(s, 'dread') + 5) } }];
}

/** For Claude's memory: the people under Li and where they stand, open promises, Li's dread. */
export function loyaltyText(s: GameState): string {
  const ids = underLi(s);
  const lines = ids.map((id) => {
    const l = loyaltyOf(s, id), o = obedienceOf(s, id);
    return `- ${s.characters[id].name} [${id}]: loyalty ${l}, obedience ${o}: ${stance(l, o)}${betrayalRisk(s, id) ? ' (WOULD BETRAY NOW, if given the chance)' : ''}`;
  });
  const promises = openPromises(s).map((t) => `- ${t.text}`);
  const dread = has(s, 'dread');
  if (!lines.length && !promises.length && !dread) return '';
  return [
    lines.length ? `LI'S PEOPLE (loyalty = inner commitment, obedience = doing as told; the code decides betrayal):\n${lines.join('\n')}` : '',
    promises.length ? `LI'S OPEN PROMISES (record "promise" with outcome kept or broken when it happens; people remember):\n${promises.join('\n')}` : '',
    dread ? `Li's dread in the world: ${dread} (cruelty he is known for; people fear him more and obey more).` : '',
  ].filter(Boolean).join('\n');
}

/** For the People and Army tabs: a summary word, never the numbers (VISIE §4: loyalty shown as a summary). */
export function loyaltyLabel(s: GameState, id: string): string | undefined {
  if (!underLi(s).includes(id)) return undefined;
  const l = loyaltyOf(s, id);
  return l >= 75 ? 'devoted' : l >= 50 ? 'loyal' : l >= 40 ? 'wavering' : 'doubtful';
}
