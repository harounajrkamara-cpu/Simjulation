import { Draft, GameState } from './types';

// Reputation, separate per group (World Bible ch. 8: "soldiers · nobles · peasants · enemies. Titles/nicknames come from
// deeds and spread as rumours"; goal Oct 17, owner kan terugdraaien). Moved by what Li does, at most ±10 a scene with a
// reason (Claude proposes, the code clamps and records). It does not yet feed the promotion score: the scale of that term
// is an owner question (engine/career.ts, Numbers §6).

export const GROUPS = ['soldiers', 'nobles', 'peasants', 'enemies'] as const;
export type Group = (typeof GROUPS)[number];
export const REP_DELTA = 10;

const key = (g: Group) => `rep_${g}`;
/** Reputation 0..100 (enemies: how much they fear and know of him); 0 = unknown. */
export const reputation = (s: GameState, g: Group) => s.flags[key(g)] ?? 0;

export function reputationDrafts(s: GameState, x: { group?: unknown; delta?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const g = x.group as Group;
  if (!GROUPS.includes(g)) { notes.push(`no group "${String(x.group)}" (soldiers, nobles, peasants, enemies)`); return []; }
  const d = Math.max(-REP_DELTA, Math.min(REP_DELTA, Math.round(Number(x.delta) || 0)));
  if (!d) return [];
  const next = Math.max(0, Math.min(100, reputation(s, g) + d));
  return [{ type: 'flag', fact: `reputation among ${g}: ${d > 0 ? '+' : ''}${d} (${String(x.reason ?? '').slice(0, 80)})`, visible: false, data: { key: key(g), value: next } }];
}

const word = (g: Group, v: number) => g === 'enemies'
  ? (v >= 60 ? 'fear his name' : v >= 30 ? 'know his name' : v > 0 ? 'have heard of him' : 'do not know him')
  : (v >= 60 ? 'admire him' : v >= 30 ? 'speak well of him' : v > 0 ? 'have heard of him' : 'do not know him');

/** For Claude's memory. */
export function reputationText(s: GameState): string {
  return `REPUTATION (per group; change with {"kind":"reputation","group":"soldiers|nobles|peasants|enemies","delta":<-${REP_DELTA}..${REP_DELTA}>,"reason":"what they heard"}; people react to it): ${GROUPS.map((g) => `${g} ${word(g, reputation(s, g))} (${reputation(s, g)})`).join(' · ')}.`;
}

/** For the Li tab: words, never numbers. */
export const reputationLines = (s: GameState) => GROUPS.filter((g) => reputation(s, g) > 0).map((g) => `${g[0].toUpperCase()}${g.slice(1)} ${word(g, reputation(s, g))}.`);
