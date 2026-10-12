import { dateFromIndex, formatDate } from './calendar';
import { li } from './engine';
import { Draft, GameState } from './types';

// Chapter recaps (owner vision Oct 10). Claude sees every chapter recap plus the last scenes in full, instead of a cut-off
// window: older story stays in Claude's view in short form. A recap is written once by Claude and never rewritten
// (append-only, like the RECAP rule of the old ChatGPT game). Pure: deciding, prompting and checking; asking is in ai/gm.ts.

/** Scenes per chapter. */
export const CHAPTER_SCENES = 20;
/** Scenes Claude always sees in full. */
export const RECENT_SCENES = 20;

const chaptersOf = (s: GameState) => s.gm?.chapters ?? [];
const scenesOf = (s: GameState) => s.gm?.scenes ?? [];

/** Scenes since the last chapter closed. */
export const openScenes = (s: GameState) => scenesOf(s).slice(chaptersOf(s).at(-1)?.scenes ?? 0);

/** A chapter closes after CHAPTER_SCENES scenes, or early (at least 5 scenes) when Li's status changed during it. */
export function chapterDue(s: GameState): boolean {
  const open = openScenes(s);
  if (open.length >= CHAPTER_SCENES) return true;
  if (open.length < 5) return false;
  const from = open[0].day;
  return s.events.some((e) => e.type === 'status' && e.day >= from && (e.data as { char?: string }).char === s.liId);
}

/** The story window for Claude's memory: all chapter recaps, then every scene after them (at least the last RECENT_SCENES). */
export function storyWindow(s: GameState): { chapters: string[]; scenes: string[] } {
  const all = scenesOf(s);
  const chapters = chaptersOf(s);
  const start = Math.max(0, Math.min(chapters.at(-1)?.scenes ?? 0, all.length - RECENT_SCENES));
  return {
    chapters: chapters.map((c, k) => `Chapter ${k + 1}, "${c.title}" (${formatDate(dateFromIndex(c.from))} to ${formatDate(dateFromIndex(c.to))}): ${c.text}`),
    scenes: all.slice(start).map((x) => `${formatDate(dateFromIndex(x.day))}: ${x.text}`),
  };
}

export const CHAPTER_RULES = `You are the Game Master of Sengoku Soldier, closing a chapter of Li's life. Write the chapter recap that will stand in the
memory for good (it is never rewritten). Use only what happened in the scenes below; invent nothing. Tell it in the third person,
120–200 words, like the opening of a new manga volume: what changed for Li, who matters now, what is still open. Do not reveal
anything Li does not know. Give it a short title (2–5 words).
ANSWER WITH JSON ONLY: {"title":"...","text":"..."}`;

/** The prompt for one chapter recap. */
export function chapterPrompt(s: GameState): string {
  const open = openScenes(s);
  const n = chaptersOf(s).length + 1;
  const from = open[0]?.day ?? 0;
  const journal = s.events.filter((e) => e.journal && e.day >= from).map((e) => `- ${e.journal}`).slice(-30);
  return [
    CHAPTER_RULES,
    `Chapter ${n}. Li is now ${li(s).status === 'slave' ? 'a slave' : li(s).role}.`,
    `THE SCENES OF THIS CHAPTER:\n${open.map((x) => `${formatDate(dateFromIndex(x.day))}: ${x.text}`).join('\n')}`,
    journal.length ? `LI'S JOURNAL IN THIS CHAPTER:\n${journal.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
}

const str = (x: unknown, max: number) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Claude's answer as a chapter event (or undefined when it is not usable). */
export function chapterDraft(s: GameState, raw: unknown): Draft | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = str(o.title, 60);
  const text = str(o.text, 1600);
  if (!title || text.split(' ').length < 20) return undefined;
  const from = openScenes(s)[0]?.day ?? 0;
  return { type: 'chapter', fact: `Chapter ${chaptersOf(s).length + 1}: ${title}`, visible: true, data: { title, text, from } };
}
