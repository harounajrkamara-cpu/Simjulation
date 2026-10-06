import { GameState, GameEvent } from './types';

// The pacing director (Game Experience ch. 9 §2, World Bible ch. 12). Deterministic: phases are computed from the
// event log, never rolled. It only decides WHEN Li-local beats arrive; the world keeps its own dates.

export type Phase = 'build' | 'peak' | 'fade' | 'relax';

/** Minimum quiet days after a peak, by life stage (GE ch. 9 §2). */
export function relaxMinDays(s: GameState): number {
  return s.characters[s.liId].status === 'slave' ? 3 : 3;
}

/** A peak is a big moment: a fight, a story title moment, or a legend moment. */
export function isPeak(e: GameEvent): boolean {
  if (e.type === 'duel' && (e.data as { state?: { round?: number } }).state?.round === 0) return true;
  return e.type === 'story' && ['title', 'legend'].includes(String((e.data as { tier?: string }).tier ?? ''));
}

export function lastPeakDay(s: GameState): number | undefined {
  for (let i = s.events.length - 1; i >= 0; i--) if (isPeak(s.events[i])) return s.events[i].day;
  return undefined;
}

export function phase(s: GameState): Phase {
  if (s.duel && !s.duel.over) return 'peak';
  const peak = lastPeakDay(s);
  const today = ((s.date.year - 100) * 12 + (s.date.month - 1)) * 30 + (s.date.day - 1);
  if (peak === undefined) return 'build';
  const since = today - peak;
  if (since === 0) return 'peak';
  if (since === 1) return 'fade';
  if (since <= relaxMinDays(s)) return 'relax';
  return 'build';
}

/** True once the quiet days after the last peak have passed: non-urgent beats may come (late end of their window). */
export function restDone(s: GameState): boolean {
  return phase(s) === 'build';
}
