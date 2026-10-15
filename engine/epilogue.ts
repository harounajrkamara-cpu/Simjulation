import { ageOn } from './calendar';
import { rankLabel } from './career';
import { has, li } from './engine';
import { careerOf, titlesOf } from './gm-career';
import { childrenOf, spouseOf } from './family';
import { FACTIONS, memberOf } from './court';
import { FUSES } from './fuses';
import { Draft, GameState } from './types';

// The epilogue (Game Experience Bible ch. 9, decision 2: "play as long as you like; when Li retires (a player choice) or
// reaches old age (60+), an epilogue chapter tells what became of him, his people and the kingdoms. The epilogue never
// shows Li dying in play"). Built from the code's record; Claude may tell it, never invent beyond it. Goal Oct 17.

export const OLD_AGE = 60;
export const ended = (s: GameState) => has(s, 'epilogue') > 0;
/** Li may retire once he is free; at 60 the epilogue is offered by itself. */
export const canRetire = (s: GameState) => !ended(s) && li(s).status !== 'slave';
export const oldAge = (s: GameState) => !ended(s) && ageOn(li(s).born, s.date) >= OLD_AGE;

/** The facts the epilogue may use: only what the record holds. */
export function epilogueFacts(s: GameState): string[] {
  const c = li(s);
  const car = careerOf(s);
  const spouse = spouseOf(s);
  const kids = childrenOf(s).map((id) => s.characters[id]);
  const m = memberOf(s);
  const heard = FUSES.filter((f) => has(s, `news_${f.id}`)).map((f) => f.outcomes[has(s, `fuse_${f.id}`) - 1]?.news).filter(Boolean);
  const k = (key: string) => s.knowledge.includes(key);
  return [
    `Li, age ${ageOn(c.born, s.date)}, ${c.status === 'slave' ? 'still a slave' : `${rankLabel(car.rank)} of ${car.kingdom[0].toUpperCase()}${car.kingdom.slice(1)}`}.`,
    titlesOf(s).length ? `The world calls him: ${titlesOf(s).map((t) => `"${t}"`).join(', ')}.` : '',
    `Merit: combat ${car.merit.combat}, command ${car.merit.command}, political ${car.merit.political}.`,
    spouse ? `Married to ${s.characters[spouse].name}${s.characters[spouse].alive ? '' : ' (who died before him)'}.` : 'He never married.',
    kids.length ? `Children: ${kids.map((x) => `${x.name} (${x.role.replace("Li's ", '')})`).join(', ')}.` : '',
    has(s, 'land_koku') ? `Land: ${has(s, 'land_koku')} koku.` : '',
    m ? `At court he stood with ${FACTIONS.find((f) => f.id === m)!.name}.` : '',
    k('family_found') ? 'He found his mother and sisters.' : k('family_alive') ? 'He learned his family lived, but never reached them.' : k('family_lead') ? 'He followed a lead to his family that went cold.' : 'He never found his family.',
    k('father_killers') ? "He learned who had his father killed." : k('father_truth') ? 'He learned his father was murdered, but not by whom.' : "He never learned the truth of his father's death.",
    k('said_hattori') ? 'He spoke his true name, Hattori, aloud.' : 'He never spoke his true name.',
    ...heard.map((n) => `The world: ${n}`),
  ].filter(Boolean);
}

export const EPILOGUE_RULES = `You are the Game Master of Sengoku Soldier, closing Li's life story with its EPILOGUE. Tell, in 250–450 words, what became of
Li in his last years, of the people around him, and of the kingdoms, like the last pages of a historical chronicle. Use ONLY the facts
below; invent nothing that contradicts them, and add no new great deeds. Never show Li dying: he lives on beyond the last page.
Third person, past tense, grave and warm. Answer with JSON only: {"title":"2–5 words","text":"the epilogue"}.`;

export const epiloguePrompt = (s: GameState, why: 'retired' | 'old age') =>
  `${EPILOGUE_RULES}\n\nWhy the story ends: ${why === 'retired' ? 'Li chose to lay down his command and retire.' : 'Li has grown old.'}\n\nTHE FACTS:\n${epilogueFacts(s).map((f) => `- ${f}`).join('\n')}`;

/** Without Claude (or if Claude fails): the chronicle closes with the facts themselves. */
export function plainEpilogue(s: GameState, why: 'retired' | 'old age'): { title: string; text: string } {
  return { title: why === 'retired' ? 'The Sword Laid Down' : 'The Long Evening', text: epilogueFacts(s).join(' ') };
}

/** The epilogue is recorded once; the life is then complete (the page offers a new life). */
export function epilogueDrafts(s: GameState, e: { title?: unknown; text?: unknown }, why: 'retired' | 'old age'): Draft[] {
  if (ended(s)) return [];
  const fallback = plainEpilogue(s, why);
  const title = typeof e.title === 'string' && e.title.trim() ? e.title.trim().slice(0, 60) : fallback.title;
  const text = typeof e.text === 'string' && e.text.trim().length > 80 ? e.text.trim().slice(0, 4000) : fallback.text;
  return [
    { type: 'story', fact: text, visible: true, journal: 'Here the chronicle of Li ends.', data: { epilogueTitle: title, why } },
    { type: 'flag', fact: 'the epilogue is written', visible: false, data: { key: 'epilogue', value: 1 } },
  ];
}
