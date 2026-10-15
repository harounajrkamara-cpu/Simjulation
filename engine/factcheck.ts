import { ageOn } from './calendar';
import { GameState } from './types';

// The Game Master's fact-check (owner vision Oct 10: errors are PREVENTED, not only reported). Before a scene is shown,
// the code compares it with the memory: the dead stay silent, known names are spelled right, Li's age and rank are right,
// and the story has no game words or "you". A scene with problems gets one rewrite (ai/gm.ts). Pure and deterministic.

export interface FactProblem { kind: 'dead' | 'name' | 'age' | 'rank' | 'mechanics' | 'person' | 'fight' | 'pacing'; text: string }

/** Command ranks (World Bible ch. 4), so a wrong rank for Li can be caught. */
export const RANK_TITLES = ['Ashigaru', 'Gochō', 'Kogashira', 'Gojū-gashira', 'Hyakunin-gashira', 'Sanbyakunin-shō', 'Sennin-shō', 'Gosennin-shō', 'Taishō', 'Dai-Shōgun'];

const MECHANICS = /\b(VAL|LEA|INT|POL|stats?|dice|rolls?|rolled|hit points?|HP|XP|level(?:ed)? up|percent)\b|%/;
const NUMBER_WORDS: Record<string, number> = {
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
/** Verbs that mean a person is present and acting right now (a dead one cannot). */
const ACTS = 'says|said|asks|asked|answers|replies|whispers|shouts|laughs|smiles|grins|nods|walks|runs|turns|looks|stands|sits|grabs|hands|draws|spits|waves|calls|mutters|watches';

// Dialogue and thoughts: "…", “…”, ‘…’ (single curly quotes; an apostrophe is only ’) and *italic thoughts*.
const outsideQuotes = (t: string) => t.replace(/"[^"]*"|“[^”]*”|‘[^’]*’|\*[^*\n]+\*/g, '""');
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
/** A fight the duel engine ran ended since the last scene (its aftermath may tell the blows). */
const justFought = (s: GameState) => {
  const lastScene = [...s.events].reverse().find((e) => e.type === 'scene')?.seq ?? -1;
  return s.events.some((e) => e.seq > lastScene && e.type === 'story' && (e.data as { duelEnd?: string }).duelEnd);
};

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

  // 3b. Other known people's ages (owner playtest, Oct 12: Sayo was "fourteen", then "fifteen"; she is 13).
  for (const sen of sentences(prose)) {
    const m = sen.match(/\b(\d{1,2}|[a-z]+)[- ]years?[- ]old\b/i) ?? sen.match(/\bperhaps\s+(\d{1,2}|[a-z]+)\b/i);
    if (!m) continue;
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : NUMBER_WORDS[m[1].toLowerCase()];
    if (n === undefined) continue;
    const named = people.filter((c) => c.alive && c.name.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`${B}${esc(w)}${E}`, 'u').test(sen)));
    if (named.length !== 1 || /\bLi\b/.test(sen)) continue; // only a sentence clearly about one known person
    const real = ageOn(named[0].born, s.date);
    const thisYear = s.date.year - named[0].born.year; // the age the canon gives for this year (the birthday may still come)
    const off = n < real ? real - n : n > thisYear ? n - thisYear : 0;
    if (off >= 2 || (off === 1 && !/\b(perhaps|about|maybe|looks|seems)\b/i.test(sen))) { problems.push({ kind: 'age', text: `${named[0].name} is ${real === thisYear ? real : `${real} (${thisYear} this year)`}, not ${n}.` }); break; }
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

  // 5. No win the code did not decide (owner, Oct 11: a rank-F slave "won" a spar against Gonza in story text). Li may
  // beat or kill a known person only right after a fight the duel engine ran (a duelEnd since the last scene).
  if (!justFought(s)) {
    // Copilot QA (PR #5) found wordings that slipped through ("won the spar", "punches Gonza to the ground", "leaves
    // Gonza unable to rise"): the list now covers winning, felling and leaving someone beaten.
    // Every verb in the sentence is checked, not only the first ("Li sends Hachi a look and defeats Gonza").
    const WIN = /\b(kills|killed|slays|slew|beheads|cuts down|cut down|strikes down|struck down|knocks|knocked|punches|punched|throws|threw|floors|floored|pins|pinned|beats|beat|defeats|defeated|disarms|disarmed|bests|bested|overpowers|overpowered|wins|won|takes the head of|took the head of|poisons|poisoned|stabs|stabbed|strangles|strangled|drowns|drowned|leaves|left|drops|dropped|puts|put|sends|sent)\b/g;
    // The person must be the verb's object ("Li beats Gonza", "Li won the spar against Gonza"), not just named later in
    // the sentence: owner playtest v30 lost a calm horse scene to "Li puts Hachi to bed and lies down".
    // Plain verbs ("puts", "leaves", "knocks") also need a beaten-word in the same clause ("leaves Gonza unable to rise").
    const PLAIN = /^(?:knocks|knocked|punches|punched|throws|threw|pins|pinned|leaves|left|drops|dropped|puts|put|sends|sent)$/i;
    const hits = sentences(prose).flatMap((sen) => [...sen.matchAll(WIN)]
      .filter((m) => /\bLi\b[^.!?]{0,80}$/.test(sen.slice(0, m.index)))
      .map((m) => ({ verb: m[1], rest: sen.slice(m.index) })));
    for (const { verb, rest } of hits) {
      const foe = people.find((c) => c.alive && c.name.split(/\s+/).some((w) => {
        if (w.length < 3) return false;
        const obj = `^${esc(verb)}\\s+(?:the (?:spar|fight|duel|bout) (?:against|with)\\s+)?${B}${esc(w)}${E}(?!['’]s)`;
        if (!PLAIN.test(verb)) return new RegExp(obj, 'iu').test(rest);
        return new RegExp(`${obj}(?:(?! and )[^.!?,;]){0,30}?\\b(?:down|to the ground|into the dirt|in the dirt|in the mud|unable to rise|senseless|unconscious|helpless|on his back|sprawling|flat)\\b`, 'iu').test(rest);
      }));
      if (foe) { problems.push({ kind: 'fight', text: `The scene has Li beat ${foe.name}, but no fight decided that. An exchange of blows that matters is a fight the code runs: end the scene where the fight starts and set "fight".` }); break; }
    }
  }

  // 6. The story stays a story: no game words, no "you" outside dialogue.
  if (MECHANICS.test(prose)) problems.push({ kind: 'mechanics', text: 'Game words (stats, dice, levels, percent) appear in the story text.' });
  if (/\b(you|your|yours|yourself)\b/i.test(prose)) problems.push({ kind: 'person', text: 'The story speaks to "you" outside dialogue; tell it in the third person.' });

  return problems;
}

/**
 * A scene that offers blows against a known person must start the fight (owner, Oct 11: the Gonza spar stayed story
 * text, so Claude decided it). Training alone, or blows against nobody the code knows, stays story.
 */
export function checkGmSuggestions(s: GameState, t: { suggestions?: string[]; fight?: unknown; scene?: string }): FactProblem[] {
  if (t.fight || (s.duel && !s.duel.over)) return [];
  const BLOW = /\b(strike|strikes|hit|slash|thrust|stab|cut at|attack|lunge|feint|parry|block|spar with|fight)\b/i;
  const people = Object.values(s.characters).filter((c) => c.id !== s.liId && c.alive);
  // Li resisting blows is a fight too (owner playtest v30: Li slipped Gonza's strap three times in story text). A known
  // person must be in the scene; a punishment Li takes without resisting stays story.
  const prose = outsideQuotes(t.scene ?? '');
  const DODGE = /\bLi\b[^.!?]{0,60}?\b(?:dodges|dodged|slips|slipped|ducks|ducked|sidesteps|sidestepped|parries|parried|blocks|blocked|evades|evaded|twists free|hits back|strikes back)\b[^.!?]{0,40}?\b(?:blow|blows|lash|lashes|strap|fist|fists|punch|punches|swing|swings|strike|kick|kicks|grab|stick|blade|sword|spear|cut)\b/i;
  const foe = people.find((c) => c.name.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`${B}${esc(w)}${E}`, 'iu').test(prose)));
  if (foe && !justFought(s) && sentences(prose).some((x) => DODGE.test(x))) return [{ kind: 'fight', text: `The scene has Li dodging or blocking blows, but no fight was started. When someone attacks Li and he resists, that is a fight the code runs: stop at the first blow and set "fight" ("deadly" false unless it is to the death). If Li takes a punishment without resisting, he does not dodge or block.` }];
  for (const line of (t.suggestions ?? []).filter((x) => BLOW.test(x))) {
    const foe = people.find((c) => c.name.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`${B}${esc(w)}${E}`, 'iu').test(line)));
    if (foe) return [{ kind: 'fight', text: `The choices offer blows against ${foe.name} ("${line}"), but no fight was started. An exchange of blows that matters is a fight the code runs: set "fight" (deadly false for practice) and end the scene where it starts.` }];
  }
  return [];
}

/**
 * Who caused a story death is decided by the code, not by a word list (owner's runtime QA Oct 15: "the boy tips
 * powder", "smothers", "arranges for a camp follower" all killed Raizen). Default deny: a "dies" change is cleared of
 * Li's hand only when Li is nowhere in the scene or the reason, and the player's words this turn do not name the dead.
 * A death Li causes is a fight the code runs. shortcut: a scene that calls Li only "he" is not caught; a "by" field
 * with the killer recorded by the code would close it.
 */
export function liHandInDeath(s: GameState, npc: string, text: string, said = ''): boolean {
  const named = s.characters[npc].name.split(/\s+/).some((w) => w.length >= 3 && new RegExp(`${B}${esc(w)}${E}`, 'iu').test(said));
  return /\b(?:Li|Li's|the boy|the slave)\b/i.test(text) || named;
}

/** Story deaths the code cannot clear of Li's hand go back for one rewrite; a rewrite that keeps one is never shown. */
export function checkGmDeaths(s: GameState, t: { scene: string; title?: string; changes?: { kind: string; npc?: unknown; reason?: unknown }[] }, said?: string): FactProblem[] {
  const text = `${t.title ?? ''}. ${t.scene}`;
  return (t.changes ?? []).flatMap((c) => {
    const npc = String(c.npc ?? '');
    const p = c.kind === 'dies' && npc !== s.liId ? s.characters[npc] : undefined;
    if (!p?.alive || !liHandInDeath(s, npc, `${text} ${String(c.reason ?? '')}`, said)) return [];
    return [{ kind: 'fight' as const, text: `${p.name} dies in a scene where Li is present or the player named ${p.name}. The code cannot tell that Li had no hand in it. Either ${p.name} does not die now (drop the "dies" change and the death from the scene), or a fight between them starts with "fight" and the code decides it.` }];
  });
}

/** One instruction for a single rewrite: the same events, these facts fixed. */
export function factFixPrompt(problems: FactProblem[]): string {
  return `Your last scene broke facts the memory holds. Write the same scene again (same events, same changes), fixing exactly these:\n${problems.map((p) => `- ${p.text}`).join('\n')}`;
}
