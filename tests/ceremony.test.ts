import { describe, expect, it } from 'vitest';
import { commitDrafts } from '../engine/engine';
import { careerOf, titlesOf } from '../engine/gm-career';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { GameState } from '../engine/types';

// Reward ceremonies and titles (World Bible ch. 4, 8; Numbers §6, §7).

const turn = (changes: unknown[]) => parseGmTurn({ scene: 'The lord speaks.', summary: 'Ceremony.', changes })!;
function soldier(): GameState {
  const s = startGmGame();
  commitDrafts(s, [
    { type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'a free soldier' } },
    { type: 'flag', fact: 'service', visible: true, data: { key: 'levy_service', value: 1 } },
  ]);
  return s;
}

describe('reward ceremonies', () => {
  it('pay 0.1 ryō per merit earned since the last ceremony and fill a free post', () => {
    const s = soldier();
    gmApply(s, turn([{ kind: 'deed', deed: 'standard', reason: 'took the standard' }, { kind: 'deed', deed: 'saved_officer', reason: 'saved the Gochō' }]));
    const money = s.money;
    const r = gmApply(s, turn([{ kind: 'ceremony' }]));
    expect(s.money - money).toBe(3000); // 30 merit × 100 mon
    expect(careerOf(s).rank).toBe('gocho');
    expect(r.notes).toEqual([]);
    expect(s.journal.some((j) => /merit was counted: 30/.test(j.text))).toBe(true);
  });

  it('a second ceremony without new merit gives nothing', () => {
    const s = soldier();
    gmApply(s, turn([{ kind: 'deed', deed: 'scouting', reason: 'found the ford' }]));
    gmApply(s, turn([{ kind: 'ceremony' }]));
    const money = s.money;
    expect(gmApply(s, turn([{ kind: 'ceremony' }])).notes.join(' ')).toMatch(/no new merit/);
    expect(s.money).toBe(money);
  });

  it('a slave gets no reward', () => {
    const s = startGmGame();
    commitDrafts(s, [{ type: 'flag', fact: 'service', visible: true, data: { key: 'levy_service', value: 1 } }]);
    gmApply(s, turn([{ kind: 'deed', deed: 'scouting', reason: 'found the ford' }]));
    const money = s.money;
    gmApply(s, turn([{ kind: 'ceremony' }]));
    expect(s.money).toBe(money);
  });
});

describe('titles', () => {
  it('need a deed, are kept once, and reach Claude\'s memory', () => {
    const s = soldier();
    expect(gmApply(s, turn([{ kind: 'title', title: 'Kurose no Ryū' }])).notes.join(' ')).toMatch(/needs a name and the deed/);
    gmApply(s, turn([{ kind: 'title', title: 'Kurose no Ryū', reason: 'held the ford alone' }]));
    gmApply(s, turn([{ kind: 'title', title: 'Kurose no Ryū', reason: 'again' }]));
    expect(titlesOf(s)).toEqual(['Kurose no Ryū']);
    expect(gmMemoryText(s)).toMatch(/Titles the world gives him: "Kurose no Ryū"/);
  });
});
