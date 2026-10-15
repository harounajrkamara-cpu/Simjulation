import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { courtFeelings, memberOf, standing } from '../engine/court';

// Stage 4: the court (goal Oct 17, owner kan terugdraaien).
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'The court gathers.', summary: 'x', ...t });
const general = (level: number) => { const s = startGmGame(); s.characters[s.liId].status = 'free'; s.flags.rank_level = level; return s; };

describe('the court of Kurogane', () => {
  it('standing moves at most 10 a scene; the court shows in the memory from Hyakunin-gashira', () => {
    const s = general(4);
    expect(gmMemoryText(s)).toMatch(/THE COURT OF KUROGANE/);
    gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', delta: 40, reason: 'Li saved Kamio\'s grandson' }] }));
    expect(standing(s, 'kings_men')).toBe(10);
    expect(gmMemoryText(general(1))).not.toMatch(/THE COURT OF KUROGANE/);
  });

  it('joining needs Sennin-shō and standing 30; the Old Blood never takes a freed slave', () => {
    const s = general(5);
    for (let k = 0; k < 3; k++) gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', delta: 10 }] }));
    expect(gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', join: true }] })).notes.join(' ')).toMatch(/below Sennin-shō/);
    s.flags.rank_level = 6;
    gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', join: true }] }));
    expect(memberOf(s)).toBe('kings_men');
    expect(courtFeelings(s)).toContain("the King's Men: his side");
    for (let k = 0; k < 4; k++) gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'old_blood', delta: 10 }] }));
    expect(gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'old_blood', join: true }] })).notes.join(' ')).toMatch(/never take a freed slave/);
  });
});
