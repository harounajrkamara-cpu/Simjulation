import { describe, expect, it } from 'vitest';
import { commitDrafts } from '../engine/engine';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { childrenOf, spouseOf } from '../engine/family';
import { currentPlan, planDrafts, plansFor, planSteps } from '../engine/plan';
import type { GameState } from '../engine/types';

// Stage 3: Li's house (goal Oct 17, owner kan terugdraaien). Claude proposes, the code checks.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
/** Li free, older, a rank; a person he knows who loves him. */
function grownLi(rank = 'gocho', noble = false): GameState {
  const s = startGmGame();
  const c = s.characters[s.liId];
  c.status = 'free';
  c.born = { year: 82, month: 1, day: 1 };
  s.flags[`rank_${rank}`] = 1;
  gmApply(s, scene({ changes: [{ kind: 'person', id: 'aiko', name: noble ? 'Hagiwara Aiko' : 'Aiko', role: noble ? 'daughter of Lord Hagiwara' : 'a weaver of Akaishi', desc: 'x', goal: 'x', affection: 80, trust: 80 }] }));
  return s;
}

describe('marriage and children', () => {
  it('love is enough for a commoner; the code records the marriage and Claude sees the house', () => {
    const s = grownLi();
    gmApply(s, scene({ changes: [{ kind: 'marry', npc: 'aiko', reason: 'love' }] }));
    expect(spouseOf(s)).toBe('aiko');
    expect(gmMemoryText(s)).toMatch(/LI'S HOUSE: married to Aiko/);
    const again = gmApply(s, scene({ changes: [{ kind: 'marry', npc: 'aiko' }] }));
    expect(again.notes.join(' ')).toMatch(/already married/);
  });

  it('a slave, a boy, a stranger or a noble house above his station are refused', () => {
    const slave = startGmGame();
    expect(gmApply(slave, scene({ changes: [{ kind: 'marry', npc: 'hachi' }] })).notes.join(' ')).toMatch(/slave cannot marry/);
    const noble = grownLi('gocho', true);
    expect(gmApply(noble, scene({ changes: [{ kind: 'marry', npc: 'aiko' }] })).notes.join(' ')).toMatch(/below Sennin-shō/);
    expect(spouseOf(noble)).toBeUndefined();
  });

  it('children come one at a time, only to a married Li, and are real people in the world', () => {
    const s = grownLi();
    expect(gmApply(s, scene({ changes: [{ kind: 'child', name: 'Taro' }] })).notes.join(' ')).toMatch(/no living wife/);
    gmApply(s, scene({ changes: [{ kind: 'marry', npc: 'aiko' }] }));
    expect(gmApply(s, scene({ changes: [{ kind: 'child', name: 'Taro' }] })).notes.join(' ')).toMatch(/no child yet/);
    gmApply(s, scene({ days: 30 }));
    for (let k = 0; k < 9; k++) gmApply(s, scene({ days: 30 }));
    gmApply(s, scene({ changes: [{ kind: 'child', name: 'Taro', son: true }] }));
    expect(childrenOf(s)).toEqual(['child_taro']);
    expect(s.characters.child_taro.role).toBe("Li's son");
    expect(gmMemoryText(s)).toMatch(/Children: Taro \(son, age 0\)/);
    expect(gmApply(s, scene({ changes: [{ kind: 'child', name: 'Hana', son: false }] })).notes.join(' ')).toMatch(/no child yet/);
  });
});

describe("Li's plan in every stage", () => {
  it('a slave sees the freedom routes; a free man the career and the long goals', () => {
    const slave = startGmGame();
    expect(plansFor(slave).map((p) => p.id)).toEqual(['merit', 'head', 'raizen', 'bought', 'escape']);
    const free = grownLi();
    expect(plansFor(free).map((p) => p.id)).toEqual(['rank', 'land', 'family', 'father', 'pillars', 'marry']);
    commitDrafts(free, planDrafts(free, 'family'));
    expect(currentPlan(free)).toBe('family');
    expect(planSteps(free, 'family')[0]).toMatchObject({ done: false });
    free.knowledge.push('family_lead');
    expect(planSteps(free, 'family')[0]).toMatchObject({ done: true });
    expect(planSteps(free, 'marry').map((x) => x.done)).toEqual([true, true, false]);
  });
});
