import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, gmTimeDrafts, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, has } from '../engine/engine';
import { holderOf, mercsNow, weatherOf } from '../engine/texture';
import { harvestOf } from '../engine/domain';
import type { GameState } from '../engine/types';

// Block G of Phase 6 (audit gaps 12–14): neutral powers, weather and trade, festivals, treasures, governors.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
function freeLi(place = 'kinza', rank = 2): GameState {
  const s = startGmGame();
  const c = s.characters[s.liId];
  c.status = 'free';
  c.location = place;
  s.flags.rank_level = rank;
  s.money = 50_000;
  return s;
}

describe('the neutral powers', () => {
  it('Kinza lends, within a limit, and the debt grows 20% a year', () => {
    const s = freeLi();
    expect(gmApply(s, scene({ changes: [{ kind: 'loan', ryo: 100 } as never] })).notes.join(' ')).toMatch(/at most 30 ryō/);
    gmApply(s, scene({ changes: [{ kind: 'loan', ryo: 20 } as never] }));
    expect(has(s, 'debt_mon')).toBe(20_000);
    for (let k = 0; k < 12; k++) commitDrafts(s, gmTimeDrafts(s, 30));
    expect(has(s, 'debt_mon')).toBe(24_000);
  });

  it('Kinza swords march with Li until the contract ends', () => {
    const s = freeLi();
    gmApply(s, scene({ changes: [{ kind: 'hire', men: 20, months: 2 } as never] }));
    expect(mercsNow(s)).toBe(20);
    expect(s.money).toBe(50_000 - 20 * 2 * 250);
  });

  it('the Mist Valley finds a secret, never twice a year against the same target', () => {
    const s = freeLi('kinza');
    gmApply(s, scene({ changes: [{ kind: 'shinobi', target: 'goda_ensai' } as never] }));
    expect(s.gm!.lore.some((l) => /not a eunuch/.test(l.text))).toBe(true);
    expect(gmApply(s, scene({ changes: [{ kind: 'shinobi', target: 'goda_ensai' } as never] })).notes.join(' ')).toMatch(/never works twice/);
  });

  it('the Seiran exam passes a clever man, once', () => {
    const s = freeLi('kaisei');
    s.characters[s.liId].stats.INT = 55;
    gmApply(s, scene({ changes: [{ kind: 'exam' } as never] }));
    expect(has(s, 'seiran_scholar')).toBe(1);
    expect(has(s, 'merit_political')).toBe(10);
  });
});

describe('weather and trade', () => {
  it('weather is fixed by the world and the year, and a drought costs the harvest', () => {
    const a = startGmGame(), b = startGmGame();
    expect(weatherOf(a, 'suiren', 103)).toBe(weatherOf(b, 'suiren', 103));
    const d = { koku: 1000, warMonths: 0, neglectYears: 0, levyManMonths: 0, built: [], weather: 0.25 } as never;
    expect(harvestOf(d).harvest).toBe(750);
    expect(gmMemoryText(a)).toMatch(/WEATHER this year/);
    expect(gmMemoryText(a)).toMatch(/PRICES where Li is/);
  });

  it('an embargo needs Li inside his court', () => {
    const s = freeLi('seikyo', 6);
    expect(gmApply(s, scene({ changes: [{ kind: 'embargo', from: 'kurogane', to: 'suiren' } as never] })).notes.join(' ')).toMatch(/inside the court/);
  });
});

describe('treasures, governors, festivals', () => {
  it('the Sword can only be found in the ruins of Amatsu-kyō', () => {
    const s = freeLi('seikyo');
    expect(holderOf(s, 'sword')).toBe('lost');
    expect(gmApply(s, scene({ changes: [{ kind: 'treasure', id: 'sword', holder: 'li', reason: 'found it' } as never] })).notes.join(' ')).toMatch(/not here/);
    s.characters[s.liId].location = 'amatsu-kyō ruins';
    gmApply(s, scene({ changes: [{ kind: 'treasure', id: 'sword', holder: 'li', reason: 'under the throne hall' } as never] }));
    expect(holderOf(s, 'sword')).toBe('li');
  });

  it('a governor needs rank and a place at court', () => {
    const s = freeLi('seikyo', 6);
    expect(gmApply(s, scene({ changes: [{ kind: 'governor', state: 'the Akaishi march' } as never] })).notes.join(' ')).toMatch(/place at court/);
  });

  it('New Year is a festival', () => {
    const s = startGmGame();
    for (let k = 0; k < 12; k++) commitDrafts(s, gmTimeDrafts(s, 30));
    expect(s.events.some((e) => (e.data as { festival?: string }).festival === 'New Year')).toBe(true);
  });
});
