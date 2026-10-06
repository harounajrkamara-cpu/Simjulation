import { GameState } from '../engine/types';
import { has } from '../engine/engine';
import { knownEntries } from './panels';

// Onboarding helpers (Game Experience ch. 8): GUIDE hints, example lines, nested tooltips, How to play.

export type Guidance = 'full' | 'light' | 'off';

export interface Hint { id: string; text: string; screen?: boolean; when: (s: GameState) => boolean }

/** One short line, once per life, never more than one at a time (ch. 8 §4). "screen" hints also show on Light. */
export const HINTS: Hint[] = [
  { id: 'duel', screen: true, text: 'A fight. Each round, pick a move: counter beats attack, attack beats feint and observe, feint beats counter. Observe to read him first.', when: (s) => !!s.duel && !s.duel.over },
  { id: 'options', text: 'Pick a numbered choice. Each one shows the skill it tests and any risk.', when: () => true },
  { id: 'write', text: 'You can also write what Li does, in your own words. Start with "I".', when: (s) => has(s, 'story_cook_tent') > 0 },
  { id: 'wait', screen: true, text: 'Quiet days can be skipped: write "wait 7" (or "wait 7 train" to train at night). It stops when something happens.', when: (s) => has(s, 'story_wait_lesson') > 0 },
  { id: 'rumour', text: 'Word spreads. People hear what Li does, and it changes how they see him.', when: (s) => s.events.some((e) => e.type === 'rumour') },
  { id: 'people', text: 'Li met someone new. The People tab shows how everyone seems to see him.', when: (s) => has(s, 'met_kaname') > 0 },
];

export function nextHint(s: GameState, guidance: Guidance, seen: Set<string>): Hint | undefined {
  if (guidance === 'off') return undefined;
  return HINTS.find((h) => !seen.has(h.id) && (guidance === 'full' || h.screen) && h.when(s));
}

/** Example lines under the write box (ch. 8 rule 5), in first person, fitting the part of the day. */
export function exampleLines(s: GameState): string[] {
  if (s.duel && !s.duel.over) return ['I wait for his swing and counter', 'I watch how he moves'];
  switch (s.date.part) {
    case 'evening': return ['I ask Sukezō where we are', 'I eat with Hachi', 'I listen at the soldiers\' fire'];
    case 'night': return ['I train with the sticks', 'I sleep'];
    default: return ['I help Sukezō with the wounded', 'I watch Raizen at the drill', 'I haul water'];
  }
}

const TERMS: Record<string, string> = {
  kurogane: 'Kurogane', kurose: 'Kurose', suiren: 'Suiren', red_crane: 'Red Crane', hagiwara: 'Hagiwara', kori: 'Kōri', sasabe: 'Sasabe', merit_law: 'merit law',
};

/** Gold-underlined terms with a short explanation, only for what Li has learned (ch. 8 §5). Works on escaped HTML. */
export function termify(html: string, s: GameState): string {
  let out = html;
  for (const e of knownEntries(s)) {
    const word = TERMS[e.id];
    if (!word) continue;
    const re = new RegExp(`(^|[^\\p{L}>])(${word})(?![\\p{L}])`, 'u');
    out = out.replace(re, (_m, pre, w) => `${pre}<span class="term" tabindex="0">${w}<span class="tip" role="tooltip"><b>${e.title}</b> ${e.text}</span></span>`);
  }
  return out;
}

export const HOW_TO_PLAY = [
  ['Choose or write', 'Pick a numbered choice, or write what Li does in your own words, as "I…". The story is told about Li.'],
  ['No dice', 'The world is fair: the same choice in the same moment gives the same result. Every result has a cause; "Why?" shows it.'],
  ['People remember', 'What Li does is seen, remembered and retold. Rumours change how people see him.'],
  ['Losing costs', 'Wounds, shame, chains, lost friends. Li can be beaten; think before a fight.'],
  ['Skip quiet days', 'Write "wait 7" to let a week pass in the usual routine. It stops when something happens.'],
  ['The tabs', 'Story · Map · Li · Army · People · Journal · Encyclopedia. A gold dot means something new.'],
];
