import { inService } from './campaign';
import { MON_PER_RYO, rankIncome } from './career';
import { has, li } from './engine';
import { careerOf } from './gm-career';
import { crownPoor } from './kingdoms';
import { Draft, GameState } from './types';

// Soldier pay (World Bible ch. 7, Numbers §7): a free man in service is paid every month, the middle of his rank's yearly
// range. Slaves get none; from Sanbyakunin-shō up the land pays him instead (engine/gm-domain.ts). Audit gap 11, Oct 17.

/** Mon paid at the end of each month, or 0. */
export function monthlyPay(s: GameState): number {
  if (li(s).status === 'slave' || !(inService(s) || has(s, 'serving') > 0)) return 0;
  const p = rankIncome(careerOf(s).rank).payRyo;
  // A poor Crown pays half (engine/kingdoms.ts treasury below 25).
  const half = crownPoor(s, careerOf(s).kingdom) ? 0.5 : 1;
  return p ? Math.round(((p[0] + p[1]) / 2) * MON_PER_RYO / 12 * half) : 0;
}

/** Every month that ends between two days: pay day. */
export function payDrafts(s: GameState, from: number, to: number): Draft[] {
  const mon = monthlyPay(s);
  if (!mon) return [];
  const out: Draft[] = [];
  for (let k = from + 1; k <= to; k++) {
    if (k % 30 !== 0) continue;
    out.push({ type: 'money', fact: `Pay day: Li receives ${mon} mon, a month's pay`, visible: true, data: { amount: mon } });
  }
  return out;
}
