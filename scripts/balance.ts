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
  console.log('C vs B, good choices:', pct(upsetRate([45, 59], [60, 74], good)));
  console.log('C vs B, bad choices :', pct(upsetRate([45, 59], [60, 74], bad)));
  console.log('same rank (C vs C), good:', pct(upsetRate([45, 59], [45, 59], good)));
  console.log('D vs B, good choices:', pct(upsetRate([30, 44], [60, 74], good)));
  void DUEL_MOVES;
}
