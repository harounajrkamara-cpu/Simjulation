import { formatDate } from './calendar';
import { has, li, met, today } from './engine';
import { visibleOpinion } from './relations';
import { changesLine, noticeable } from './render';
import { GameEvent, GameState } from './types';

// Timeskip summary (World Bible ch. 9, Game Experience ch. 3 overlay): what happened to Li, his people and the world
// during a WAIT, with the changes. Only what Li can know: journal lines, visible opinions, rumours, his own numbers.

export interface SkipMark {
  day: number;
  date: string;
  seen: Record<string, number>;
  views: Record<string, string>;
  counts: Record<string, number>;
  journal: number;
}

export interface SkipSummary {
  days: number;
  from: string;
  to: string;
  /** Why the skip stopped early (the story that interrupted it), if it did. */
  stopped?: string;
  li: string[];
  people: string[];
  world: string[];
  changes: string;
}

const COUNTS = ['chores_total', 'lessons', 'trained_nights', 'watched_drill'] as const;
const view = (s: GameState, id: string) => visibleOpinion(s, id).split(' (')[0];

/** Take before a skip. */
export function skipMark(s: GameState): SkipMark {
  const views: Record<string, string> = {};
  for (const id of Object.keys(s.relations)) if (met(s, id)) views[id] = view(s, id);
  const counts: Record<string, number> = {};
  for (const k of COUNTS) counts[k] = has(s, k);
  return { day: today(s), date: formatDate(s.date), seen: noticeable(s), views, counts, journal: s.journal.length };
}

/** Build after a skip, from the mark and the events the skip produced. */
export function skipSummary(s: GameState, m: SkipMark, events: GameEvent[], stopped?: string): SkipSummary {
  const d = (k: string) => has(s, k) - (m.counts[k] ?? 0);
  const times = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const routine = [
    d('chores_total') ? `worked ${times(d('chores_total'), 'shift', 'shifts')} in the camp` : '',
    d('lessons') ? `studied letters with Sukezō on ${times(d('lessons'), 'evening', 'evenings')}` : '',
    d('trained_nights') ? `trained in secret on ${times(d('trained_nights'), 'night', 'nights')}` : '',
  ].filter(Boolean);
  const liLines = routine.length ? [`Li ${routine.length > 1 ? `${routine.slice(0, -1).join(', ')} and ${routine.at(-1)}` : routine[0]}.`] : [];
  const journal = s.journal.slice(m.journal).map((j) => j.text);
  liLines.push(...journal.filter((t) => !t.startsWith('Rumour at the fire')));
  for (const e of events) if (e.type === 'alert' && e.visible && /Gonza/.test(e.fact)) liLines.push(e.fact);

  const people: string[] = [];
  for (const id of Object.keys(s.relations)) {
    if (!met(s, id)) continue;
    const name = s.characters[id].name;
    const now = view(s, id);
    if (!m.views[id]) people.push(`New: ${name} (${now}).`);
    else if (m.views[id] !== now) people.push(`${name}: ${m.views[id]} → ${now}.`);
  }
  for (const e of events) if (e.type === 'rumour' && e.visible) people.push(e.fact);

  const world = journal.filter((t) => t.startsWith('Rumour at the fire')).map((t) => t.replace('Rumour at the fire: ', 'At the fire: '));
  for (const e of events) {
    const id = String((e.data as { id?: string }).id ?? '');
    if (e.type === 'story' && /^(contract_|levy_call)/.test(id)) world.push(e.journal ?? e.fact);
  }

  return {
    days: today(s) - m.day,
    from: m.date,
    to: formatDate(s.date),
    stopped,
    li: [...new Set(liLines)],
    people: [...new Set(people)],
    world: [...new Set(world)],
    changes: changesLine(m.seen, noticeable(s)).replace(/^Changes: /, ''),
  };
}

/** Plain-text form for the terminal and chat mode. */
export function summaryText(x: SkipSummary): string {
  const block = (title: string, lines: string[]) => (lines.length ? [`${title}:`, ...lines.map((l) => `  · ${l}`)] : []);
  return [
    `== TIMESKIP · ${x.days} ${x.days === 1 ? 'day' : 'days'} ==`,
    `${x.from} → ${x.to}`,
    ...block('Li', x.li),
    ...block('His people', x.people),
    ...block('The world', x.world),
    x.changes ? `Changes: ${x.changes}` : 'No changes Li can notice.',
  ].join('\n');
}
