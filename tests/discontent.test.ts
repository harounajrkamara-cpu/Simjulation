import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { authority, discontent, monthlyChange } from '../engine/discontent';
import { fromSave, stateHash, toSave } from '../engine/engine';

// Faction discontent (Numbers §9 formula, inputs PROVISIONAL; goal Oct 17).
const sc = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Months pass.', summary: 'x', ...t });

describe('faction discontent', () => {
  it('follows the Numbers §9 formula', () => {
    const s = startGmGame();
    // Old Blood: 10 × (0.7 − 0.6) + 4 + 0 + 2 − 55/20 − 40/25 = 2.65 a month.
    expect(monthlyChange(s, 'old_blood')).toBeCloseTo(2.65, 5);
    expect(monthlyChange(s, 'chancellor')).toBeLessThan(0);
  });

  it('a stronger faction\'s ultimatum is accepted and weakens the Crown; it builds month by month', () => {
    const s = startGmGame();
    for (let k = 0; k < 20; k++) gmApply(s, sc({ days: 30 }));
    expect(discontent(s, 'old_blood')).toBeGreaterThan(40);
    expect(authority(s, 'suiren')).toBeLessThan(25); // the Three Families forced the puppet king's hand
    expect(s.flags.ultimatum_suiren_families).toBeGreaterThan(0);
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });

  it('a weaker faction\'s ultimatum is refused: civil war; Li serving there hears it at once', () => {
    const s = startGmGame();
    s.characters[s.liId].status = 'free';
    s.flags.rank_level = 4;
    gmApply(s, sc({ changes: [{ kind: 'serve', kingdom: 'takane' }] }));
    for (let k = 0; k < 10; k++) gmApply(s, sc({ changes: [{ kind: 'faction', faction: 'takane_separatists', discontent: 10, reason: 'Li carried Hayate\'s letters' }] }));
    expect(discontent(s, 'takane_separatists')).toBe(99);
    expect(gmMemoryText(s)).toMatch(/the Separatists .*near an ultimatum/);
    gmApply(s, sc({ days: 30 }));
    expect(s.flags.civil_war_takane).toBe(1);
    expect(s.journal.some((j) => /In Takane, the Separatists sent the throne an ultimatum; it was refused, and there is civil war/.test(j.text))).toBe(true);
  });
});
