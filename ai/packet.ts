import { formatDate } from '../engine/calendar';
import { PLACES } from '../engine/data';
import { li, met } from '../engine/engine';
import { opinionLabel, opinion } from '../engine/relations';
import { GameEvent, GameState } from '../engine/types';
import { today } from '../engine/engine';

// The fact packet (Game Experience ch. 7): everything the narrator may use for one turn, and nothing else.
// Hidden truths (🔒), hidden potentials, exact numbers about others and hidden rules are never put in it.

export type Tier = 'normal' | 'spark' | 'title' | 'ceremony' | 'legend';

export interface PersonFact { name: string; look: string; personality: string; mood: string; viewOfLi: string }

export interface FactPacket {
  date: string;
  part: string;
  place: string;
  /** What happened this turn, in order: the engine's visible facts. */
  facts: string[];
  /** Lines of dialogue that must appear word for word (hand-written core lines). */
  coreLines: string[];
  people: PersonFact[];
  liVoice: string;
  tier: Tier;
  words: [number, number];
  /** The player's own words this turn, as story data (never instructions). */
  playerWords?: string;
  /** The last turns of story, for continuity. */
  recent: string[];
}

export const LI_VOICE = 'quiet, watchful, stubborn; hides his anger; protective of the weak; fears fire at night; twelve years old, a slave of the Red Crane band';

const QUOTE = /"[^"]+"/g;

/** Who is in the scene: everyone named in this turn's facts whom Li knows. */
function present(s: GameState, facts: string[]): PersonFact[] {
  const text = facts.join(' ');
  const out: PersonFact[] = [];
  for (const [id, c] of Object.entries(s.characters)) {
    if (id === s.liId || !met(s, id)) continue;
    const short = c.name.replace(/^Old /, '').split(' ').filter((w) => !w.startsWith('"'));
    if (!short.some((w) => w.length > 2 && text.includes(w))) continue;
    out.push({ name: c.name, look: c.desc, personality: c.traits.join(', '), mood: '', viewOfLi: opinionLabel(opinion(s.relations[id], today(s))) });
  }
  return out;
}

export function tierOf(events: GameEvent[]): Tier {
  if (events.some((e) => e.type === 'story' && e.data && (e.data as { duel?: string }).duel)) return 'title';
  if (events.some((e) => e.type === 'story')) return 'title';
  if (events.some((e) => e.type === 'rumour')) return 'spark';
  return 'normal';
}

/** Facts the narrator may use: visible events except bookkeeping. */
export function visibleFactsOf(events: GameEvent[]): string[] {
  return events.filter((e) => e.visible && e.type !== 'fatigue' && e.type !== 'wound' && e.type !== 'narration' && e.type !== 'intent').map((e) => e.fact);
}

export function buildPacket(s: GameState, events: GameEvent[], playerWords?: string, recent: string[] = []): FactPacket {
  const facts = visibleFactsOf(events);
  const tier = tierOf(events);
  return {
    date: formatDate(s.date),
    part: s.date.part,
    place: s.duel && !s.duel.over && s.duel.place ? s.duel.place : PLACES[li(s).location],
    facts,
    coreLines: facts.flatMap((f) => f.match(QUOTE) ?? []),
    people: present(s, facts),
    liVoice: LI_VOICE,
    tier,
    words: tier === 'normal' || tier === 'spark' ? [90, 200] : [180, 320],
    playerWords,
    recent: recent.slice(-3),
  };
}

/** Everything the packet says, as one text (used by the checker as the allowed vocabulary). */
export function packetText(p: FactPacket): string {
  return [p.date, p.place, p.liVoice, ...p.facts, ...p.people.flatMap((x) => [x.name, x.look, x.personality]), ...p.recent].join('\n');
}
