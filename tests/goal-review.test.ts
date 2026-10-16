import { describe, expect, it } from 'vitest';
import { commitDrafts } from '../engine/engine';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { spouseOf } from '../engine/family';
import { epilogueDrafts } from '../engine/epilogue';
import { memberOf, standing } from '../engine/court';
import { termify } from '../web/guide';
import type { GameState } from '../engine/types';

// Fixes from the review of the Oct 17 goal work.
const sc = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'x', summary: 'x', ...t });
function grown(level = 6): GameState {
  const s = startGmGame();
  commitDrafts(s, [{ type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'a general' } }, { type: 'flag', fact: 'rank', visible: false, data: { key: 'rank_level', value: level } }]);
  s.characters[s.liId].born = { year: 80, month: 1, day: 1 };
  return s;
}

describe('review fixes (Oct 17)', () => {
  it('a widower who marries again has his new wife; children come to her', () => {
    const s = grown();
    for (const id of ['aiko', 'hana']) gmApply(s, sc({ changes: [{ kind: 'person', id, name: id, role: 'a weaver', desc: 'x', goal: 'x', trust: 80, affection: 80 }] }));
    gmApply(s, sc({ changes: [{ kind: 'marry', npc: 'aiko' }] }));
    gmApply(s, sc({ changes: [{ kind: 'dies', npc: 'aiko', reason: 'a fever in the winter' }] }));
    gmApply(s, sc({ changes: [{ kind: 'marry', npc: 'hana' }] }));
    expect(spouseOf(s)).toBe('hana');
  });

  it('Li never marries his own child; a child starts as a child', () => {
    const s = grown();
    gmApply(s, sc({ changes: [{ kind: 'person', id: 'aiko', name: 'Aiko', role: 'a weaver', desc: 'x', goal: 'x', trust: 80, affection: 80 }] }));
    gmApply(s, sc({ changes: [{ kind: 'marry', npc: 'aiko' }] }));
    for (let k = 0; k < 10; k++) gmApply(s, sc({ days: 30 }));
    gmApply(s, sc({ changes: [{ kind: 'child', name: 'Hana', son: false }] }));
    expect(s.characters.child_hana.stats.VAL).toBe(2);
    s.characters.child_hana.born = { year: 70, month: 1, day: 1 };
    gmApply(s, sc({ changes: [{ kind: 'dies', npc: 'aiko', reason: 'a fever in the winter' }] }));
    expect(gmApply(s, sc({ changes: [{ kind: 'marry', npc: 'child_hana' }] })).notes.join(' ')).toMatch(/own family/);
  });

  it('an epilogue that shows Li dying is replaced by the plain one', () => {
    const s = grown();
    const d = epilogueDrafts(s, { title: 'End', text: 'In the winter of his sixtieth year Li died quietly, and the whole province mourned him for a long time after.' }, 'old age');
    expect(d[0].fact).not.toMatch(/died/);
    expect(d[0].fact).toMatch(/^Li, age/);
  });

  it('changing sides at court costs the old side', () => {
    const s = grown();
    for (const f of ['kings_men', 'favourite']) for (let k = 0; k < 4; k++) gmApply(s, sc({ changes: [{ kind: 'faction', faction: f, delta: 10 }] }));
    gmApply(s, sc({ changes: [{ kind: 'faction', faction: 'kings_men', join: true }] }));
    gmApply(s, sc({ changes: [{ kind: 'faction', faction: 'favourite', join: true }] }));
    expect(memberOf(s)).toBe('favourite');
    expect(standing(s, 'kings_men')).toBe(10);
  });

  it('a common word in a name never becomes a tooltip', () => {
    const s = startGmGame();
    gmApply(s, sc({ changes: [{ kind: 'person', id: 'oldman', name: 'the Old Man', role: 'a beggar', desc: 'x', goal: 'x' }] }));
    expect(termify('The Man walks by.', s)).not.toMatch(/class="term"/);
  });
});
