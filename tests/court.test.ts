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

describe('the courts of every kingdom (WB ch. 13 seven profiles)', () => {
  it('a general serving Hayate sees Hayate\'s court and can join the Generals; Tatara has no factions; no joining a foreign court', () => {
    const s = general(6);
    gmApply(s, scene({ changes: [{ kind: 'serve', kingdom: 'hayate' }] }));
    expect(gmMemoryText(s)).toMatch(/THE COURT OF HAYATE/);
    for (let k = 0; k < 3; k++) gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'hayate_generals', delta: 10 }] }));
    gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'hayate_generals', join: true }] }));
    expect(memberOf(s)).toBe('hayate_generals');
    for (let k = 0; k < 3; k++) gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', delta: 10 }] }));
    expect(gmApply(s, scene({ changes: [{ kind: 'faction', faction: 'kings_men', join: true }] })).notes.join(' ')).toMatch(/another kingdom's court/);
    gmApply(s, scene({ changes: [{ kind: 'serve', kingdom: 'tatara' }] }));
    expect(gmMemoryText(s)).toMatch(/THE COURT OF TATARA: no factions/);
  });
});

describe('changing sides more than once', () => {
  it('Li can serve Hayate and come back to Kurogane; the career follows the kingdom he serves now', async () => {
    const { careerOf } = await import('../engine/gm-career');
    const s = general(6);
    gmApply(s, scene({ changes: [{ kind: 'serve', kingdom: 'hayate' }] }));
    expect(careerOf(s).kingdom).toBe('hayate');
    gmApply(s, scene({ changes: [{ kind: 'serve', kingdom: 'kurogane' }] }));
    expect(careerOf(s).kingdom).toBe('kurogane');
    expect(gmMemoryText(s)).toMatch(/THE COURT OF KUROGANE/);
  });
});
