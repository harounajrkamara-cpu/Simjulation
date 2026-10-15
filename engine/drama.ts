import { CLOCK_DAYS_PER_STEP, MAX_OPEN_CLOCKS } from './clocks';
import { today } from './engine';
import { CHAPTER_SCENES, openScenes } from './recaps';
import { Draft, GameState } from './types';

// What makes the world feel alive (owner, Oct 16: "find ways to make it more interesting, and build it"):
// K. rivals who remember (Shadow of Mordor's Nemesis system: a beaten enemy returns, scarred, and wants it back);
// L. people react to what Li did, and setups get their payoff (Hades' reactive lines; Chekhov's gun);
// M. there is always an open question, and a chapter ends on a hook (J.J. Abrams' mystery box; Dickens' serials).
// Read from the code's own record; no chance, no Claude calls.

export interface FightRecord { id: string; name: string; fights: number; won: number; lost: number; last: string; lastDay: number }

/** Every fight the code ran against a known, living person, from the event log. */
export function fightRecords(s: GameState): FightRecord[] {
  const foeOf = new Map<string, { id: string; name: string }>();
  const out = new Map<string, FightRecord>();
  for (const e of s.events) {
    const st = (e.data as { state?: { id?: string; foe?: { id: string; name: string } } | null }).state;
    if (e.type === 'duel' && st?.id && st.foe) foeOf.set(st.id, st.foe);
    const d = e.data as { duelEnd?: string; result?: string };
    if (e.type !== 'story' || !d.duelEnd) continue;
    const foe = foeOf.get(d.duelEnd);
    const p = foe && s.characters[foe.id];
    if (!foe || !p?.alive || foe.id === s.liId) continue;
    const r = out.get(foe.id) ?? { id: foe.id, name: p.name, fights: 0, won: 0, lost: 0, last: '', lastDay: 0 };
    r.fights++;
    if (d.result === 'won') r.won++;
    if (d.result === 'lost') r.lost++;
    r.last = d.result ?? 'ended';
    r.lastDay = e.day;
    out.set(foe.id, r);
  }
  return [...out.values()];
}

/** K. A known person Li beat and left alive wants it back: the code opens a revenge threat (once per fight). */
export function nemesisDrafts(s: GameState): Draft[] {
  const clocks = s.gm?.clocks ?? [];
  if (clocks.filter((c) => c.open).length >= MAX_OPEN_CLOCKS) return [];
  for (const r of fightRecords(s)) {
    const id = `revenge_${r.id}`;
    if (r.last !== 'won' || clocks.some((c) => c.id === id && c.open) || (s.flags[`nemesis_${r.id}`] ?? 0) >= r.won) continue;
    return [
      { type: 'thread', fact: `threat opened: ${r.name} wants it back`, visible: false, data: { clock: { id, name: `${r.name} wants it back`, doom: `${r.name} tries to get even with Li: a new fight the code runs, or a trap`, size: 6, filled: 0, open: true, ticked: today(s) } } },
      { type: 'flag', fact: `${r.name}'s grudge recorded`, visible: false, data: { key: `nemesis_${r.id}`, value: r.won } },
    ];
  }
  return [];
}

const ago = (s: GameState, day: number) => { const n = today(s) - day; return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };

/** What the drama layer tells Claude before a scene. */
export function dramaText(s: GameState): string {
  const lines: string[] = [];
  const records = fightRecords(s);
  if (records.length) lines.push(`SCORES WITH LI (people remember; a loser carries the shame or a scar and wants it back, a winner taunts; never the same taunt twice): ${records.map((r) => `${r.name}: ${r.fights} fight${r.fights === 1 ? '' : 's'}, Li won ${r.won}, lost ${r.lost}; last ${r.last} ${ago(s, r.lastDay)}`).join('; ')}.`);
  const scenes = s.events.filter((e) => e.type === 'scene');
  const deeds = scenes.slice(-12).map((e) => (e.data as { turns?: string }).turns).filter((t): t is string => !!t).slice(-3);
  if (deeds.length) lines.push(`WHAT PEOPLE TALK ABOUT (when it fits, let one person react to one of these, in their own way): ${deeds.join('; ')}.`);
  const threads = s.gm?.threads ?? [];
  const waiting = [
    ...threads.filter((t) => t.open && today(s) - t.day >= 14).map((t) => `storyline "${t.text}" (open ${today(s) - t.day} days)`),
    ...s.events.filter((e) => e.type === 'flag' && /^seed_/.test(String((e.data as { key?: string }).key)) && (e.data as { value?: number }).value === 1 && today(s) - e.day >= 10)
      .map((e) => `seed: ${e.fact.replace(/^seed /, '').replace(/: planted.*$/, '')}`),
  ].slice(0, 4);
  if (waiting.length) lines.push(`SETUPS WAITING FOR A PAYOFF (Chekhov's gun: pay one off soon, or close it): ${waiting.join('; ')}.`);
  if (!threads.some((t) => t.open)) lines.push('NO OPEN QUESTION: give the player something to wonder about (a hint from a SECRET, a stranger who knows too much, a mark on a coat). Record it with a "thread" change. Never answer it in the same scene.');
  if (openScenes(s).length >= CHAPTER_SCENES - 1) lines.push('THE CHAPTER ENDS WITH THIS SCENE: end on a hook, a question or a danger that makes the player want the next chapter.');
  return lines.length ? `DRAMA (the code's record):\n${lines.map((l) => `- ${l}`).join('\n')}` : '';
}

/** For tests and tuning: how fast a revenge threat comes due by itself (6 steps). */
export const REVENGE_DAYS = 6 * CLOCK_DAYS_PER_STEP;
