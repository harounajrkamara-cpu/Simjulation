import { GameState } from '../engine/types';
import { has } from '../engine/engine';
import { visibleOpinion } from '../engine/relations';
import { RANKS } from '../engine/career';
import { WORLD_START } from '../engine/world-public';
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
const COMMON = /^(?:Man|Men|Woman|Boy|Girl|Smith|Lord|Lady|Old|Young|Captain|Sergeant|Monk|Priest|Merchant|Farmer|Soldier|Guard|Cook|Archer|Stranger|Elder|Master)$/;
const escRe = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escHtml = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Everything a word can explain, only what Li knows (owner, Oct 12): encyclopedia entries, people he has met (as he
 * sees them), the ranks, and the kingdoms' public facts (goal Oct 17). [word pattern, title, text] */
function termsFor(s: GameState): [string, string, string][] {
  const out: [string, string, string][] = [];
  for (const e of knownEntries(s)) if (TERMS[e.id]) out.push([TERMS[e.id], e.title, e.text]);
  for (const id of Object.keys(s.relations)) {
    const p = s.characters[id];
    if (!p || id === s.liId || !has(s, `met_${id}`)) continue;
    const short = p.name.replace(/"[^"]*"/g, '').trim().split(/\s+/);
    const word = short[short.length - 1]; // how people are called: Raizen, Sukezō, Rokubei, Sayo
    // A name, not a common word ("the Old Man" must not tip every "Man"; review Oct 17).
    if (word.length >= 3 && /^\p{Lu}/u.test(word) && !COMMON.test(word)) out.push([escRe(word), p.name, `${p.role}${p.alive ? `. ${visibleOpinion(s, id)}` : '. Dead.'}`]);
  }
  for (const r of RANKS) if (r.id !== 'ashigaru') out.push([escRe(r.title), r.title, `${r.english ? `${r.english}: ` : ''}an officer of ${r.men} men.`]);
  for (const k of WORLD_START.kingdoms) out.push([escRe(k.name), `${k.name}, ${k.epithet}`, `Capital ${k.capital}. ${k.ruler}`]);
  return out;
}

/** Gold-underlined words with a short explanation, the first mention only, never inside another tip (tap works too). */
export function termify(html: string, s: GameState): string {
  let out = html;
  for (const [word, title, text] of termsFor(s)) {
    const re = new RegExp(`(^|[^\\p{L}>])(${word})(?![\\p{L}])`, 'u');
    // Only in plain text, never inside a tip that is already there.
    const parts = out.split(/(<span class="term"[\s\S]*?<\/span><\/span>)/);
    let done = false;
    out = parts.map((part) => (done || part.startsWith('<span class="term"') ? part : part.replace(re, (m, pre, w) => {
      done = true;
      return `${pre}<span class="term" tabindex="0">${w}<span class="tip" role="tooltip"><b>${escHtml(title)}</b> ${escHtml(text)}</span></span>`;
    }))).join('');
  }
  return out;
}

/**
 * The Help box (owner, Oct 11: "too many commands, make them buttons"). You only TYPE what Li does or a question;
 * everything else is a button, listed where it lives. [category, [name, what it does][]]
 */
export const COMMANDS: [string, [string, string][]][] = [
  ['You type only this', [
    ['A number', 'Pick one of the choices.'],
    ['I …', 'Anything Li does, in your own words: "I ask Sukezō about the fort".'],
  ]],
  ['Buttons under the story', [
    ['? Ask', 'Lost? Ask the guide anything ("what should I do now?"). Time does not move, and it never spoils.'],
    ['( ) Wish', 'Game Master mode: tell the storyteller how you want the STORY to feel ("make it a close fight"). Never changes numbers or rules.'],
    ['Wait a week', 'Let quiet days pass. Stops when something happens.'],
    ['Skip ahead', 'Game Master mode: jump to a moment you name.'],
    ["Something's wrong", 'The story forgot or broke something: fix it, or go back up to 3 scenes.'],
    ['Why?', 'Under a scene: the causes behind what happened.'],
  ]],
  ['The tabs', [
    ['Li', 'His health, skills, money and growth.'],
    ['People', 'Everyone Li knows and how they feel about him.'],
    ['Journal', 'The story so far and what happened lately.'],
    ['Map · Army · Encyclopedia', 'The land, the band, and what Li has learned.'],
  ]],
  ['The top bar', [
    ['Save file', 'Your three lives, copy or download a save.'],
    ['Narrator', 'Have the story read aloud.'],
    ['Storyteller', 'Claude or the plain chronicle.'],
    ['New life', 'Start again.'],
  ]],
];

export const HOW_TO_PLAY = [
  ['Choose or write', 'Pick a numbered choice, or write what Li does in your own words, as "I…". The story is told about Li.'],
  ['No dice', 'The world is fair: the same choice in the same moment gives the same result. Every result has a cause; "Why?" shows it.'],
  ['People remember', 'What Li does is seen, remembered and retold. Rumours change how people see him.'],
  ['Losing costs', 'Wounds, shame, chains, lost friends. Li can be beaten; think before a fight.'],
  ['Skip quiet days', 'Write "wait 7" to let a week pass in the usual routine. It stops when something happens.'],
  ['The tabs', 'Story · Map · Li · Army · People · Journal · Encyclopedia. A gold dot means something new.'],
];
