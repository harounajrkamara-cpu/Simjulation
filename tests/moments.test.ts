import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, gmTimeDrafts, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, has } from '../engine/engine';
import { bannerOf, legendPages, nicknamesByGroup, rumoursOf } from '../engine/moments';
import { journalPage } from '../web/panels';
import { loyaltyOf } from '../engine/loyalty';
import type { GameState } from '../engine/types';

// Block D of Phase 6 (audit gaps 20–22, 24–26, 30): legend pages, rumours, ceremonies, gatherings, banner, nicknames.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
const months = (s: GameState, n: number) => { for (let k = 0; k < n; k++) commitDrafts(s, gmTimeDrafts(s, 30)); };

describe('legend moments become Journal pages, with witnesses who remember', () => {
  it('the first nickname is a legend moment once: a page, a screen, memories, a rumour', () => {
    const s = startGmGame();
    const r = gmApply(s, scene({ changes: [{ kind: 'title', title: 'the Kurose Dragon', reason: 'he held the ford' } as never] }));
    expect(has(s, 'legend_nickname')).toBe(1);
    expect(r.events.some((e) => (e.data as { tier?: string }).tier === 'legend')).toBe(true);
    expect(legendPages(s).map((p) => p.title)).toContain('A name of his own');
    expect(s.memories.some((m) => m.npc === 'raizen' && /was there when Li/.test(m.what))).toBe(true);
    expect(rumoursOf(s).length).toBe(1);
    gmApply(s, scene());
    expect(legendPages(s).filter((p) => p.title === 'A name of his own')).toHaveLength(1);
    expect(journalPage(s)).toMatch(/Legend pages/);
  });
});

describe('rumours travel in Game Master mode', () => {
  it('a step a month, and a true deed lifts Li\'s name as it goes', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'rumour', text: 'the slave boy faced Gonza and did not fall' } as never] }));
    const soldiers = has(s, 'rep_soldiers');
    months(s, 1);
    expect(rumoursOf(s)[0].reach).toBe(1);
    expect(has(s, 'rep_soldiers')).toBe(soldiers + 3);
    months(s, 1);
    expect(rumoursOf(s)[0].reach).toBe(2);
    expect(gmMemoryText(s)).toMatch(/WHAT PEOPLE SAY[\s\S]*the whole land/);
  });
  it('a lie travels too, marked for Claude', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'rumour', text: 'Li steals from the stores', false: true } as never] }));
    expect(gmMemoryText(s)).toMatch(/steals from the stores \(NOT TRUE\)/);
  });
});

describe('ceremonies and gatherings have witnesses', () => {
  it('an oath binds a man to Li (loyalty +10) before the people who saw it', () => {
    const s = startGmGame();
    const before = loyaltyOf(s, 'hachi');
    const r = gmApply(s, scene({ changes: [{ kind: 'gathering', what: 'oath', npc: 'hachi', reason: 'Hachi swears to follow Li' } as never] }));
    expect(r.events.some((e) => (e.data as { ceremonyView?: unknown }).ceremonyView)).toBe(true);
    expect(has(s, 'oath_hachi')).toBe(1);
    expect(loyaltyOf(s, 'hachi')).toBe(Math.min(100, before + 10));
    expect(s.memories.some((m) => m.npc === 'sukezo' && /swear/.test(m.what))).toBe(true);
  });
  it('a funeral is only for the dead; a slave cannot hold a feast', () => {
    const s = startGmGame();
    expect(gmApply(s, scene({ changes: [{ kind: 'gathering', what: 'funeral', npc: 'sukezo', reason: 'x' } as never] })).notes.join(' ')).toMatch(/died/);
    expect(gmApply(s, scene({ changes: [{ kind: 'gathering', what: 'feast', reason: 'x' } as never] })).notes.join(' ')).toMatch(/cannot hold a feast/);
  });
});

describe('Li\'s banner and nicknames per group', () => {
  it('a unit name and banner from Hyakunin-gashira; it names Li\'s unit in battle', () => {
    const s = startGmGame();
    s.characters[s.liId].status = 'free';
    expect(gmApply(s, scene({ changes: [{ kind: 'banner', name: 'Ryūen', sign: 'a red dragon on black' } as never] })).notes.join(' ')).toMatch(/Hyakunin-gashira/);
    s.flags.rank_level = 4;
    gmApply(s, scene({ changes: [{ kind: 'banner', name: 'Ryūen', sign: 'a red dragon on black' } as never] }));
    expect(bannerOf(s)).toBe('Ryūen — a red dragon on black');
    expect(has(s, 'legend_banner')).toBe(1);
  });
  it('a group names Li only after a deed and when it knows him', () => {
    const s = startGmGame();
    const no = gmApply(s, scene({ changes: [{ kind: 'title', title: 'Little Demon', group: 'enemies', reason: 'x' } as never] }));
    expect(no.notes.join(' ')).toMatch(/after a deed/);
    commitDrafts(s, [{ type: 'flag', fact: 'merit', visible: false, data: { key: 'merit_combat', value: 3 } }, { type: 'flag', fact: 'x', visible: false, data: { key: 'rep_enemies', value: 15 } }]);
    gmApply(s, scene({ changes: [{ kind: 'title', title: 'Little Demon', group: 'enemies', reason: 'he cut down three raiders' } as never] }));
    expect(nicknamesByGroup(s).enemies).toEqual(['Little Demon']);
  });
});
