import { GameState, Modifier, REL_FIELDS, RelField, Relation } from './types';

// Relationships (World Bible ch. 8, Numbers §8). Values are how an NPC sees Li.

/** Decay classes (Numbers §8): days until a change is fully gone. null = permanent. */
export const FADE = {
  slight: 60,
  rumour: 30,
  humiliation: 270,
  hardship: 1095,
  permanent: null,
} as const;

export function modValueAt(m: Modifier, day: number): number {
  if (m.fadeDays === null) return m.value;
  const t = (day - m.startDay) / m.fadeDays;
  return m.value * Math.max(0, 1 - t);
}

export function relValue(rel: Relation, field: RelField, day: number): number {
  let v = rel.base[field];
  for (const m of rel.mods) if (m.field === field) v += modValueAt(m, day);
  return Math.max(0, Math.min(100, v));
}

export function relSnapshot(rel: Relation, day: number): Record<RelField, number> {
  const out = {} as Record<RelField, number>;
  for (const f of REL_FIELDS) out[f] = relValue(rel, f, day);
  return out;
}

/** Summary opinion −100…+100 (Numbers §8). */
export function opinion(rel: Relation, day: number): number {
  const v = relSnapshot(rel, day);
  const raw = ((v.trust - 50) + (v.respect - 50) + (v.affection - 50)) * 2 / 3
    - v.rivalry / 2 - Math.max(0, v.fear - 50) / 2;
  return Math.round(Math.max(-100, Math.min(100, raw)));
}

/** Loyalty (inner commitment), Numbers §8. Modifiers like oaths come later. */
export function loyalty(rel: Relation, day: number): number {
  const v = relSnapshot(rel, day);
  return Math.round(0.45 * v.trust + 0.30 * v.respect + 0.25 * v.affection);
}

export function opinionLabel(op: number): string {
  if (op >= 60) return 'would stand by Li';
  if (op >= 30) return 'likes Li';
  if (op >= 10) return 'friendly';
  if (op > -10) return 'indifferent';
  if (op > -30) return 'cold toward Li';
  if (op > -60) return 'dislikes Li';
  return 'hates Li';
}

/** What Li can read: exact-ish for people close to him, a rough estimate otherwise (ch. 8). */
export function visibleOpinion(state: GameState, npcId: string): string {
  const rel = state.relations[npcId];
  const day = currentDay(state);
  const op = opinion(rel, day);
  const v = relSnapshot(rel, day);
  const close = v.affection >= 70;
  const parts = [opinionLabel(op)];
  if (v.respect >= 60) parts.push('respects Li');
  if (v.rivalry >= 40) parts.push('sees Li as a rival');
  if (v.fear >= 40) parts.push('is wary of Li');
  const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
  const num = close ? sign(op) : `about ${sign(Math.round(op / 10) * 10)}`;
  return `${parts.join(', ')} (${num})`;
}

export function currentDay(state: GameState): number {
  const d = state.date;
  return ((d.year - 100) * 12 + (d.month - 1)) * 30 + (d.day - 1);
}
