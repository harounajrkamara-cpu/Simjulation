import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { reputation, reputationLines } from '../engine/reputation';
import { armyPage } from '../web/panels';

// Reputation per group (WB ch. 8) and Li's own command in the Army tab (goal Oct 17).
const sc = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Word spreads.', summary: 'x', ...t });

describe('reputation', () => {
  it('moves per group at most 10 a scene, shows as words, and Claude sees it', () => {
    const s = startGmGame();
    gmApply(s, sc({ changes: [{ kind: 'reputation', group: 'soldiers', delta: 30, reason: 'Li held the ford' }] }));
    expect(reputation(s, 'soldiers')).toBe(10);
    expect(reputationLines(s)).toEqual(['Soldiers have heard of him.']);
    expect(gmMemoryText(s)).toMatch(/REPUTATION .*soldiers have heard of him \(10\)/);
    expect(gmApply(s, sc({ changes: [{ kind: 'reputation', group: 'monks', delta: 5 }] })).notes.join(' ')).toMatch(/no group "monks"/);
  });
});

describe('the Army tab', () => {
  it('a slave sees the band from the baggage line; an officer sees his command and his men', () => {
    const s = startGmGame();
    expect(armyPage(s)).toMatch(/The Red Crane band/);
    s.characters[s.liId].status = 'free';
    s.flags.rank_level = 2;
    gmApply(s, sc({ changes: [{ kind: 'person', id: 'kenta', name: 'Kenta', role: 'Gochō under Li', desc: 'x', goal: 'x' }] }));
    const page = armyPage(s);
    expect(page).toMatch(/Li's command/);
    expect(page).toMatch(/Kogashira/);
    expect(page).toMatch(/Kenta/);
  });
});
