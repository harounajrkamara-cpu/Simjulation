import { today } from './engine';
import { FactProblem } from './factcheck';
import { Draft, GameState, ThreatClock } from './types';

// Threat clocks (docs/PROPOSAL_PACING.md part C, owner approved Oct 16; Blades in the Dark's danger clocks, Dungeon World's
// fronts). Claude opens a threat; the CODE fills it with time, so a threat cannot wait forever ("Tonight… I can wait…"
// for weeks). When it is full, it is due: the next scene delivers it. Li feels it in the Li tab, never as numbers.

/** One step per 2 days by itself (owner, Oct 16: faster than the proposed 3). */
export const CLOCK_DAYS_PER_STEP = 2;
export const MAX_OPEN_CLOCKS = 3;

const clocks = (s: GameState) => s.gm?.clocks ?? [];
const open = (s: GameState) => clocks(s).filter((c) => c.open);
const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
const draft = (c: ThreatClock, fact: string): Draft => ({ type: 'thread', fact, visible: false, data: { clock: c } });

/** A clock change from the Game Master: open a threat, tick it once (the story gave cause), push it back, or close it. */
export function clockDrafts(s: GameState, x: { id?: unknown; name?: unknown; doom?: unknown; size?: unknown; tick?: unknown; back?: unknown; close?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const id = slug(String(x.id ?? x.name ?? ''));
  if (!id) { notes.push('a clock needs an id'); return []; }
  const c = clocks(s).find((y) => y.id === id);
  const why = String(x.reason ?? '').slice(0, 100);
  if (!c) {
    if (!x.name || !x.doom) { notes.push(`no clock "${id}": open one with a name and a doom`); return []; }
    if (open(s).length >= MAX_OPEN_CLOCKS) { notes.push(`already ${MAX_OPEN_CLOCKS} threats are open; close one first`); return []; }
    const size = Math.min(8, Math.max(3, Math.round(Number(x.size) || 4)));
    return [draft({ id, name: String(x.name).slice(0, 60), doom: String(x.doom).slice(0, 160), size, filled: 0, open: true, ticked: today(s) }, `threat opened: ${String(x.name).slice(0, 60)}`)];
  }
  if (!c.open) { notes.push(`the threat "${c.name}" is over`); return []; }
  if (x.close) return [draft({ ...c, open: false }, `threat closed: ${c.name}${why ? ` (${why})` : ''}`)];
  // At most one step either way per scene: Claude cannot fill a clock in one go, nor empty it.
  if (Number(x.back) > 0) return [draft({ ...c, filled: Math.max(0, c.filled - 1) }, `threat pushed back: ${c.name}${why ? ` (${why})` : ''}`)];
  if (Number(x.tick) > 0) return [draft({ ...c, filled: Math.min(c.size, c.filled + 1) }, `threat closer: ${c.name}${why ? ` (${why})` : ''}`)];
  return [];
}

/** Time passes up to `to`: every open clock fills one step per CLOCK_DAYS_PER_STEP days. */
export function clockTimeDrafts(s: GameState, to: number): Draft[] {
  return open(s).flatMap((c) => {
    const steps = Math.floor((to - c.ticked) / CLOCK_DAYS_PER_STEP);
    if (steps <= 0) return [];
    const filled = Math.min(c.size, c.filled + steps);
    return [draft({ ...c, filled, ticked: c.ticked + steps * CLOCK_DAYS_PER_STEP }, `${c.name}: ${filled}/${c.size}`)];
  });
}

/** For Claude's memory: the open threats, how close, and what is due now. */
export function clocksText(s: GameState): string {
  const list = open(s);
  const rule = `Open a threat that should come due with {"kind":"clock","id":"<id>","name":"<who wants what>","doom":"<what happens when it is full>","size":4}; the code fills it by itself (one step per ${CLOCK_DAYS_PER_STEP} days). You may add one step when the story gives cause ("tick":1) or take one back when Li acts against it ("back":1,"reason"). Close it with "close":true once it happened or is truly over. Max ${MAX_OPEN_CLOCKS} open.`;
  if (!list.length) return `THREATS: none open. ${rule}`;
  return `THREATS (show signs as they grow; never the numbers):\n${list.map((c) => `- [${c.id}] ${c.name}: ${c.filled}/${c.size}${c.filled >= c.size ? ` — DUE NOW: in this scene, ${c.doom}. Then close it.` : `. When full: ${c.doom}.`}`).join('\n')}\n${rule}`;
}

/** What Li feels about each open threat (the Li tab; owner: "as a feeling", never numbers). */
export function clockFeelings(s: GameState): string[] {
  return open(s).map((c) => {
    const f = c.filled / c.size;
    return `${c.name}: ${f >= 1 ? 'it is coming now' : f >= 0.5 ? 'it is getting close' : 'something is brewing'}`;
  });
}

/** A due threat that the scene neither delivers nor closes goes back once (soft, like pacing: a rewrite is shown). */
export function checkClocks(s: GameState, t: { fight?: unknown; changes?: { kind: string; id?: unknown; close?: unknown }[] }): FactProblem[] {
  // Asked once: only while no scene has followed the clock's last change (night review: a due clock Claude never closed
  // doubled every Claude call). After that the memory still says DUE NOW.
  const lastScene = s.events.map((e) => e.type).lastIndexOf('scene');
  const lastChange = (id: string) => s.events.map((e) => (e.data as { clock?: { id?: string } }).clock?.id === id).lastIndexOf(true);
  const due = open(s).filter((c) => c.filled >= c.size && lastChange(c.id) > lastScene);
  if (!due.length || t.fight) return [];
  const closed = new Set((t.changes ?? []).filter((c) => c.kind === 'clock' && c.close).map((c) => slug(String(c.id ?? ''))));
  const left = due.filter((c) => !closed.has(c.id));
  return left.length ? [{ kind: 'pacing', text: `The threat "${left[0].name}" is due: ${left[0].doom}. Let it happen in this scene (a fight starts with "fight"), then close it.` }] : [];
}
