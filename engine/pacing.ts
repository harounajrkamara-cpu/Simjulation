import { has, li, met, today } from './engine';
import { FUSES, liKingdom } from './fuses';
import { relSnapshot } from './relations';
import { fits, SEEDS } from './seeds';
import { FactProblem } from './factcheck';
import { GmTurn, sceneTime } from './gm';
import { GameEvent, GameState } from './types';

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
  // Places are names, not tics (night Oct 16: "the horse lines" was listed): they are cut out before counting, and a
  // phrase never runs across a sentence or a cut.
  const PLACE = /\b(?:horse lines?|cook ?fire|soldiers' fire|fodder store|drill field|kōri|kurose|red crane|ford|camp|fort|tent|river|stables?|palisade)\b/gu;
  const seen = new Map<string, number>();
  for (const e of scenes(s).slice(-3)) {
    const here = new Set<string>();
    for (const part of e.fact.toLowerCase().replace(PLACE, '|').split(/[.!?;:,|"“”]/)) {
      const words = part.replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
      for (let k = 0; k + 2 < words.length; k++) {
        const tri = words.slice(k, k + 3);
        if (tri.filter((w) => !STOP.has(w)).length >= 2) here.add(tri.join(' '));
      }
    }
    here.forEach((p) => seen.set(p, (seen.get(p) ?? 0) + 1));
  }
  return [...seen].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, max).map(([p]) => p);
}

/** A scene that turns nothing (McKee): no "turns", no change, no fight, no time passed. It plays as routine (owner, Oct 16). */
export function nonEvent(t: Pick<GmTurn, 'turns' | 'changes' | 'fight'>, events: GameEvent[]): boolean {
  return !t.turns?.trim() && !(t.changes ?? []).length && !t.fight && !events.some((e) => e.type === 'time');
}

/** A big moment since the scene before the newest one: a fight ended, Li's or someone's status changed (death, promotion,
 * freedom), or a battle is over. After it the player gets one calm scene (owner, Oct 16; the L4D Director's relax). */
export function afterPeak(s: GameState): boolean {
  const idx = s.events.flatMap((e, k) => (e.type === 'scene' ? [k] : []));
  const from = idx.length >= 2 ? idx[idx.length - 2] : 0;
  return !!s.battle?.over || s.events.slice(from).some((e) => e.type === 'status' || !!(e.data as { duelEnd?: unknown }).duelEnd);
}

/** The player's last plan in his own words, for the montage ("his usual work and routine" if none). */
export function lastPlan(s: GameState): string {
  for (const e of scenes(s).reverse()) {
    const said = (e.data as { said?: unknown }).said;
    if (typeof said !== 'string' || !said.trim()) continue;
    return said.replace(/^\(Time skip [^)]*\)\s*/i, '').trim() || 'his usual work and routine';
  }
  return 'his usual work and routine';
}

/** How much a moment weighs, so Claude gives detail where it is due (Wang et al. 2023: LLMs over-describe minor events
 * and skip key ones). */
export function momentWeight(s: GameState): 'big' | 'scene' {
  const lastFight = s.events.slice(-40).some((e) => !!(e.data as { duelEnd?: unknown }).duelEnd);
  const due = (s.gm?.clocks ?? []).some((c) => c.open && c.filled >= c.size);
  return lastFight || due || afterPeak(s) ? 'big' : 'scene';
}

/** Days without a moment that mattered: since the last scene that turned something and was not routine, or a fight. */
export function quietDays(s: GameState): number {
  for (let k = s.events.length - 1; k >= 0; k--) {
    const e = s.events[k];
    const d = e.data as { routine?: unknown; turns?: unknown; duelEnd?: unknown };
    if (e.type === 'duel' || d.duelEnd || e.type === 'status' || (e.type === 'scene' && !d.routine && d.turns)) return today(s) - e.day;
  }
  return today(s);
}

/** Stories in motion (story sifting, Ryan 2018 / Winnow 2021): what is unfolding near Li, from the code's own record.
 * The montage stops at these, or at danger; everything else may pass. */
export function storiesInMotion(s: GameState): string[] {
  const out: string[] = [];
  for (const c of (s.gm?.clocks ?? []).filter((x) => x.open)) out.push(`threat: ${c.name} (${c.filled}/${c.size})`);
  for (const [id, rel] of Object.entries(s.relations)) {
    const p = s.characters[id];
    if (!p?.alive || !met(s, id)) continue;
    const v = relSnapshot(rel, today(s));
    if (v.rivalry >= 40) out.push(`grudge: ${p.name} (rivalry ${Math.round(v.rivalry)})`);
    else if (v.trust >= 70 && v.respect >= 70) out.push(`bond: ${p.name} (trust ${Math.round(v.trust)}, respect ${Math.round(v.respect)})`);
  }
  for (const x of SEEDS.filter((y) => [1, 2].includes(has(s, `seed_${y.id}`)))) out.push(`seed in play: ${x.name}`);
  for (const f of FUSES.filter((y) => !has(s, `fuse_${y.id}`) && y.day - today(s) <= 30 && y.day >= today(s) && y.kingdom === liKingdom(s))) out.push(`world event near: ${f.name} (in ${f.day - today(s)} days)`);
  return out.slice(0, 8);
}

/** After QUIET_DAYS calm days the world pushes one thing in (L4D Director, RimWorld): not while Li is wounded or right
 * after a big moment (RimWorld weighs recent wounds and deaths). Picked by fixed rules, never by chance. */
export const QUIET_DAYS = 5;
export function quietPush(s: GameState): string | undefined {
  if (quietDays(s) < QUIET_DAYS || li(s).wound > 0 || afterPeak(s)) return undefined;
  const seed = SEEDS.find((x) => !has(s, `seed_${x.id}`) && fits(s, x));
  if (seed) return `the story seed "${seed.name}" (${seed.needs}; plant it with {"kind":"seed","id":"${seed.id}","state":"planted"})`;
  const clock = (s.gm?.clocks ?? []).filter((c) => c.open).sort((a, b) => b.filled / b.size - a.filled / a.size)[0];
  if (clock) return `the threat "${clock.name}" shows itself (tick it: {"kind":"clock","id":"${clock.id}","tick":1})`;
  const rival = Object.keys(s.relations).filter((id) => s.characters[id]?.alive && met(s, id))
    .sort((a, b) => relSnapshot(s.relations[b], today(s)).rivalry - relSnapshot(s.relations[a], today(s)).rivalry)[0];
  return rival ? `${s.characters[rival].name} acts on their own plan ("Own plan" in the memory), where Li can see it` : undefined;
}

/** What the director tells Claude before this scene. */
export function pacingText(s: GameState, said?: string): string {
  const lines: string[] = [];
  const still = stillStreak(s);
  if (still >= STALL_WARN) lines.push(`THE SCENE IS STALLING: ${still} scenes without time passing. Make a hard move now: the threat strikes or withdraws, an order sends Li somewhere, the night ends ("part" or "days"), or a fight starts. Do not ask Li the same question again.`);
  if (waitingStreak(s, said) >= 2) lines.push('THE PLAYER IS WAITING OR OBEYING: the world acts now. Give Li a plain order and play it through ("routine": true), or move time on, or let the threat come. Do not hand him another question he cannot answer; a slave gets orders, not questions.');
  lines.push(momentWeight(s) === 'big'
    ? 'THIS MOMENT WEIGHS: a big moment. Tell it fully (200–300 words), enter late, end on the decision.'
    : 'THIS MOMENT: an ordinary scene. 120–200 words; if nothing turns, it is routine (60–150 words, "routine": true).');
  const motion = storiesInMotion(s);
  if (motion.length) lines.push(`STORIES IN MOTION (a montage stops at these or at danger; let quiet time pass): ${motion.join('; ')}.`);
  const push = quietPush(s);
  if (push) lines.push(`THE WORLD PUSHES (${quietDays(s)} quiet days): bring in ONE thing in this scene: ${push}. Then hand control back.`);
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
