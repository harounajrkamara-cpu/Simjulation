import { today } from './engine';
import { FactProblem } from './factcheck';
import { GmTurn, sceneTime } from './gm';
import { GameState } from './types';

// The pacing director (docs/PROPOSAL_PACING.md, owner approved Oct 16). The referee stops what must not happen; this
// makes sure something DOES happen: a standoff ends, a waiting player is answered by the world, phrases are not repeated.
// Like Left 4 Dead's Director and PbtA's "when everyone looks to you, make a move". Pure: no chance, no Claude calls.

/** Still scenes before the memory warns; one more still scene is sent back once (owner, Oct 16). */
export const STALL_WARN = 2;

/** The player waits or obeys instead of choosing (owner's ford playtest: "just follow orders, I'm a slave"). */
const WAITING = /\b(?:wait|waits|waiting|say nothing|says nothing|stay silent|keep silent|stay quiet|follow(?:s)? (?:the |his )?orders?|obey|do what \w+ (?:says|asked|told)|i don'?t know|i do not know|stay where|keep listening|keep pressing)\b/i;
const scenes = (s: GameState) => s.events.filter((e) => e.type === 'scene');

/** Scenes in a row, up to now, in which time did not move and no fight or battle started. */
export function stillStreak(s: GameState): number {
  let n = 0;
  for (let k = s.events.length - 1; k >= 0; k--) {
    const e = s.events[k];
    if (e.type === 'duel' || (e.data as { duelEnd?: unknown; battle?: unknown }).duelEnd || (e.data as { battle?: unknown }).battle) break;
    if (e.type !== 'scene') continue;
    if (e.day !== today(s) || e.part !== s.date.part) break;
    n++;
  }
  return n;
}

/** The player's last inputs that only wait or obey, in a row (this turn first). */
export function waitingStreak(s: GameState, said?: string): number {
  const inputs = [said, ...scenes(s).reverse().map((e) => (e.data as { said?: unknown }).said)];
  let n = 0;
  for (const x of inputs) {
    if (typeof x !== 'string' || !WAITING.test(x)) break;
    n++;
  }
  return n;
}

const STOP = new Set('a an the and or but of to in on at by for with from into over under as is are was were be been his her he she it its they them their him li this that there then than not no so up out down one two'.split(' '));

/** Three-word phrases (two or more real words) used in two of the last three scenes: the tics to avoid. */
export function alreadySaid(s: GameState, max = 8): string[] {
  const seen = new Map<string, number>();
  for (const e of scenes(s).slice(-3)) {
    const words = e.fact.toLowerCase().replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
    const here = new Set<string>();
    for (let k = 0; k + 2 < words.length; k++) {
      const tri = words.slice(k, k + 3);
      if (tri.filter((w) => !STOP.has(w)).length >= 2) here.add(tri.join(' '));
    }
    here.forEach((p) => seen.set(p, (seen.get(p) ?? 0) + 1));
  }
  return [...seen].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, max).map(([p]) => p);
}

/** What the director tells Claude before this scene. */
export function pacingText(s: GameState, said?: string): string {
  const lines: string[] = [];
  const still = stillStreak(s);
  if (still >= STALL_WARN) lines.push(`THE SCENE IS STALLING: ${still} scenes without time passing. Make a hard move now: the threat strikes or withdraws, an order sends Li somewhere, the night ends ("part" or "days"), or a fight starts. Do not ask Li the same question again.`);
  if (waitingStreak(s, said) >= 2) lines.push('THE PLAYER IS WAITING OR OBEYING: the world acts now. Give Li a plain order and play it through ("routine": true), or move time on, or let the threat come. Do not hand him another question he cannot answer; a slave gets orders, not questions.');
  const tics = alreadySaid(s);
  if (tics.length) lines.push(`ALREADY SAID in the last scenes, do not repeat: ${tics.map((t) => `"${t}"`).join(', ')}. Describe people by what they do now, not the same marks again.`);
  return lines.length ? `PACING (the code's director):\n${lines.map((l) => `- ${l}`).join('\n')}` : '';
}

/** A scene that changes nothing after the warning goes back once ("pacing" problems are soft: a rewrite is then shown). */
export function checkPacing(s: GameState, t: GmTurn, said?: string): FactProblem[] {
  const [days, part] = sceneTime(s, t);
  const moves = days > 0 || (part !== undefined && part !== s.date.part) || !!t.fight || (t.changes ?? []).some((c) => c.kind === 'battle');
  if (moves) return [];
  if (stillStreak(s) >= STALL_WARN) return [{ kind: 'pacing', text: `This would be scene ${stillStreak(s) + 1} in a row without time passing. End the standoff: make a hard move, move time ("part" or "days"), or start the fight.` }];
  if (waitingStreak(s, said) >= 2 && !t.routine) return [{ kind: 'pacing', text: 'The player only waits or obeys. Do not hand back a question: give Li an order and play it through ("routine": true), or move time on.' }];
  return [];
}
