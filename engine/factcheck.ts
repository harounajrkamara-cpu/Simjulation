import { ageOn } from './calendar';
import { GameState } from './types';

// The Game Master's fact-check (owner vision Oct 10: errors are PREVENTED, not only reported). Before a scene is shown,
// the code compares it with the memory: the dead stay silent, known names are spelled right, Li's age and rank are right,
// and the story has no game words or "you". A scene with problems gets one rewrite (ai/gm.ts). Pure and deterministic.

export interface FactProblem { kind: 'dead' | 'name' | 'age' | 'rank' | 'mechanics' | 'person'; text: string }

/** Command ranks (World Bible ch. 4), so a wrong rank for Li can be caught. */
export const RANK_TITLES = ['Ashigaru', 'Gochō', 'Kogashira', 'Gojū-gashira', 'Hyakunin-gashira', 'Sanbyakunin-shō', 'Sennin-shō', 'Gosennin-shō', 'Taishō', 'Dai-Shōgun'];

const MECHANICS = /\b(VAL|LEA|INT|POL|stats?|dice|rolls?|rolled|hit points?|HP|XP|level(?:ed)? up|percent)\b|%/;
const NUMBER_WORDS: Record<string, number> = {
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
/** Verbs that mean a person is present and acting right now (a dead one cannot). */
const ACTS = 'says|said|asks|asked|answers|replies|whispers|shouts|laughs|smiles|grins|nods|walks|runs|turns|looks|stands|sits|grabs|hands|draws|spits|waves|calls|mutters|watches';

const outsideQuotes = (t: string) => t.replace(/"[^"]*"|“[^”]*”/g, '""');
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/);
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Word edges that understand ō and ū (a plain \b does not). Use with the u flag. */
const B = '(?<![\\p{L}\\p{N}_])';
const E = '(?![\\p{L}\\p{N}_])';

/** Edit distance, capped (cheap; only short words are compared). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
}

/** Check one scene's text against the memory. `extraNames` are names that are fine even if unknown (new people this scene). */
export function checkGmScene(s: GameState, text: string, extraNames: string[] = []): FactProblem[] {
  const problems: FactProblem[] = [];
  const story = text.normalize('NFC');
  const prose = outsideQuotes(story);
  const li = s.characters[s.liId];
  const people = Object.values(s.characters).filter((c) => c.id !== s.liId);

  // 1. The dead stay dead: a dead person named as speaking or acting now.
  for (const c of people.filter((p) => !p.alive)) {
    for (const part of new Set([c.name, ...c.name.split(/\s+/).filter((w) => w.length >= 4)])) {
      const acts = new RegExp(`\\b${esc(part)}\\b(?:\\s+\\w+){0,2}?\\s+(?:${ACTS})\\b`, 'u');
      const quoted = new RegExp(`"[^"]*,"\\s+${esc(part)}\\s+(?:${ACTS})\\b`, 'u');
      if (acts.test(prose) || quoted.test(story)) { problems.push({ kind: 'dead', text: `${c.name} is dead, but the scene has him or her speaking or acting.` }); break; }
    }
  }

  // 2. Known names spelled right: a capitalised word one or two letters away from a known name part.
  const known = new Set<string>(['Li', ...extraNames.flatMap((n) => n.split(/\s+/))]);
  for (const c of Object.values(s.characters)) for (const w of c.name.split(/\s+/)) known.add(w);
  const parts = [...known].filter((w) => w.length >= 5);
  const flagged = new Set<string>();
  for (const w of new Set(story.match(/(?<![\p{L}-])[A-ZŌŪ][\p{L}-]{3,}(?![\p{L}-])/gu) ?? [])) {
    if (known.has(w) || flagged.has(w)) continue;
    const near = parts.find((k) => Math.abs(k.length - w.length) <= 2 && distance(k.toLowerCase(), w.toLowerCase()) <= (k.length >= 7 ? 2 : 1));
    if (near) { flagged.add(w); problems.push({ kind: 'name', text: `"${w}" looks like a misspelling of ${near}.` }); }
  }

  // 3. Li's age, when the scene states it in a sentence about Li.
  const age = ageOn(li.born, s.date);
  for (const sen of sentences(prose)) {
    if (!/\bLi\b/.test(sen)) continue;
    const m = sen.match(/\b(\d{1,2}|[a-z]+)[- ]years?[- ]old\b/i) ?? sen.match(/\bLi,\s+(\d{1,2}),/);
    if (!m) continue;
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1].toLowerCase()];
    // Only a claim about Li himself: the sentence names no other known person.
    const others = people.some((c) => c.name.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`\\b${esc(w)}\\b`).test(sen)));
    if (n !== undefined && n !== age && !others) { problems.push({ kind: 'age', text: `Li is ${age}, not ${n}.` }); break; }
  }

  // 4. Li's rank and status, when the scene names them directly ("Li the Kogashira", "Kogashira Li", "Li, a free man").
  const rank = RANK_TITLES.find((r) => new RegExp(`${B}${esc(r)}${E}`, 'iu').test(li.role));
  for (const r of RANK_TITLES) {
    const said = new RegExp(`\\bLi,?\\s+(?:the|a|an)\\s+${esc(r)}${E}|${B}${esc(r)}\\s+Li\\b`, 'iu');
    if (said.test(prose) && r !== rank) { problems.push({ kind: 'rank', text: `Li is not a ${r} (he is ${li.status === 'slave' ? 'a slave' : li.role}).` }); break; }
  }
  if (li.status === 'slave' && /\bLi,?\s+(?:a|now a)\s+free\s+(?:man|boy)\b|\bLi\s+is\s+(?:now\s+)?free\b/i.test(prose)) {
    problems.push({ kind: 'rank', text: 'Li is still a slave: freedom comes only through a real route the code records.' });
  }

  // 5. The story stays a story: no game words, no "you" outside dialogue.
  if (MECHANICS.test(prose)) problems.push({ kind: 'mechanics', text: 'Game words (stats, dice, levels, percent) appear in the story text.' });
  if (/\b(you|your|yours|yourself)\b/i.test(prose)) problems.push({ kind: 'person', text: 'The story speaks to "you" outside dialogue; tell it in the third person.' });

  return problems;
}

/** One instruction for a single rewrite: the same events, these facts fixed. */
export function factFixPrompt(problems: FactProblem[]): string {
  return `Your last scene broke facts the memory holds. Write the same scene again (same events, same changes), fixing exactly these:\n${problems.map((p) => `- ${p.text}`).join('\n')}`;
}
