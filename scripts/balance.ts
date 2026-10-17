// Balance check (Numbers §12): how often does a C-rank beat a B-rank in a duel, with good and with bad choices?
// No dice: we run every opponent in a fixed grid (strength × habits) against fixed player policies.
import { DUEL_MOVES, DuelMove, DuelState, autoMove, duelRound } from '../engine/duel';

const PERSONALITIES: Record<string, DuelState['prefs']> = {
  brawler: { attack: 4, counter: 0, feint: 1, observe: 0 },
  patient: { attack: 1, counter: 3, feint: 0, observe: 1 },
  trickster: { attack: 1, counter: 1, feint: 3, observe: 0 },
  careful: { attack: 1, counter: 1, feint: 1, observe: 2 },
  balanced: { attack: 2, counter: 2, feint: 1, observe: 0 },
};

export type Policy = (d: DuelState) => DuelMove;
/** Good choices: read him first, then answer what he just did (what a thinking player does). */
export const good: Policy = (d) => (d.round === 0 ? 'observe' : autoMove(d));
/** Bad choices: the same move every round. */
export const bad: Policy = () => 'attack';

const ANSWER: Record<DuelMove, DuelMove[]> = { attack: ['feint', 'observe'], counter: ['attack'], feint: ['counter', 'observe'], observe: ['counter'] };
/**
 * Skilled choices (Oct 15): a player who uses only what the game tells him. After one observe he knows the foe's
 * favourite habit and that the foe answers Li's repeats (the hint text), so he predicts the NEXT move and beats it.
 * This is what Numbers §12 means by "good choices"; `good` above (answer the LAST move) is a simple player whom the
 * foe learns to punish.
 */
export const skilled: Policy = (d) => {
  if (d.round === 0) return 'observe';
  const top = [...DUEL_MOVES].sort((a, b) => d.prefs[b] - d.prefs[a])[0];
  const score: Record<DuelMove, number> = { attack: 0, counter: 0, feint: 0, observe: 0 };
  score[top] = 2;
  for (const m of d.li.history.slice(-3)) for (const a of DUEL_MOVES) if (ANSWER[a].includes(m)) score[a] += 1.5;
  const last2 = d.foe.history.slice(-2);
  if (last2.length === 2 && last2[0] === last2[1]) score[last2[0]] -= 2;
  let next: DuelMove = 'attack';
  for (const m of DUEL_MOVES) if (score[m] > score[next]) next = m;
  return DUEL_MOVES.find((m) => ANSWER[m].includes(next)) ?? 'attack';
};

function fight(liScore: number, foeScore: number, prefs: DuelState['prefs'], policy: Policy): string {
  let d: DuelState = {
    id: 'b', round: 0, over: false, surprise: false, prefs,
    li: { id: 'li', name: 'Li', val: liScore, mastery: liScore, wound: 0, fatigue: 0, observed: 0, history: [] },
    foe: { id: 'f', name: 'Foe', val: foeScore, mastery: foeScore, wound: 0, fatigue: 0, observed: 0, history: [] },
  };
  while (!d.over) d = duelRound(d, policy(d)).state;
  return d.result!;
}

export function upsetRate(lo: [number, number], hi: [number, number], policy: Policy): number {
  let wins = 0; let n = 0;
  for (let a = lo[0]; a <= lo[1]; a += 2) for (let b = hi[0]; b <= hi[1]; b += 2) for (const p of Object.values(PERSONALITIES)) {
    n++; if (fight(a, b, p, policy) === 'won') wins++;
  }
  return wins / n;
}

if (process.argv[1]?.endsWith('balance.ts')) {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log('C vs B, skilled choices (target 10–20%):', pct(upsetRate([45, 59], [60, 74], skilled)));
  console.log('C vs B, simple choices:', pct(upsetRate([45, 59], [60, 74], good)));
  console.log('C vs B, bad choices :', pct(upsetRate([45, 59], [60, 74], bad)));
  console.log('same rank (C vs C), good:', pct(upsetRate([45, 59], [45, 59], good)));
  console.log('D vs B, good choices:', pct(upsetRate([30, 44], [60, 74], good)));
  void DUEL_MOVES;
}
