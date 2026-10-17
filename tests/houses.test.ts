import { describe, expect, it } from 'vitest';
import { gmApply, gmMemoryText, gmTimeDrafts, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, fromSave, has, stateHash, toSave } from '../engine/engine';
import { createWorld } from '../engine/data';
import { houses, knownHouses, worldDrafts } from '../engine/houses';
import { encyclopediaPage } from '../web/panels';
import type { GameState } from '../engine/types';

// Block B of Phase 6 (audit gaps 1, 2, 8): houses as records, the world's people, age, death, heirs, genpuku.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });
/** Time passes in month steps (a slave's scene skips at most a month). */
const passDays = (s: GameState, n: number) => { for (let d = n; d > 0; d -= 30) commitDrafts(s, gmTimeDrafts(s, Math.min(30, d))); };

describe('the world arrives as records', () => {
  it('a new life has the houses of all seven kingdoms and their people, and the save replays exactly', () => {
    const s = startGmGame();
    const kingdoms = new Set(houses(s).map((h) => h.kingdom));
    expect(kingdoms.size).toBe(7);
    expect(houses(s).length).toBeGreaterThanOrEqual(30);
    expect(s.characters.akabane_hayame?.house).toBe('akabane');
    expect(s.characters.kagami_soun.stats.LEA).toBeGreaterThanOrEqual(90);
    expect(s.characters.sayo.house).toBe('hagiwara');
    const back = fromSave(toSave(s));
    expect(stateHash(back)).toBe(stateHash(s));
  });

  it('an old life gets the world on its next scene, and still loads', () => {
    const s = createWorld();
    commitDrafts(s, [{ type: 'flag', fact: 'Game Master mode', visible: false, data: { key: 'gm_mode', value: 1 } }]);
    expect(s.houses).toBeUndefined();
    const before = toSave(s);
    expect(() => fromSave(before)).not.toThrow(); // the old save is untouched
    gmApply(s, scene());
    expect(s.houses?.hagiwara.head).toBe('hagiwara_munenori');
    expect(worldDrafts(s)).toEqual([]); // once only
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });

  it('Claude sees Li\'s kingdom\'s houses in full and the world\'s people, never the hidden family or an unmet head\'s secret', () => {
    const m = gmMemoryText(startGmGame());
    expect(m).toMatch(/THE HOUSES OF KUROGANE/);
    expect(m).toMatch(/House Tsurumaki \[tsurumaki\].*Head Tsurumaki Sanetaka \(51\)/);
    expect(m).toMatch(/Akabane Hayame \[akabane_hayame\]/);
    expect(m).not.toMatch(/\[yuki\]|\[mei\]|\[kenjiko\]/);
    expect(m).not.toMatch(/in contact with Gōda/);
  });

  it('the Encyclopedia shows the houses Li can know, without secrets', () => {
    const s = startGmGame();
    expect(knownHouses(s).map((h) => h.name)).toContain('Hagiwara');
    expect(knownHouses(s).map((h) => h.name)).not.toContain('Akabane');
    const page = encyclopediaPage(s);
    expect(page).toMatch(/House Hagiwara/);
    expect(page).not.toMatch(/smuggles/);
  });
});

describe('people age and die; heirs take over (WB 13c rule 4)', () => {
  it('a lord who reaches his years dies of age, and his heir leads the house', () => {
    const s = startGmGame();
    s.characters.hagiwara_munenori.lifespan = 49;
    passDays(s, 40);
    expect(s.characters.hagiwara_munenori.alive).toBe(false);
    expect(s.houses!.hagiwara.head).toBe('hagiwara_tadaoki');
    expect(s.houses!.hagiwara.cohesion).toBe(50);
  });

  it('a king killed by others leaves a child heir: the elders rule, the house shakes', () => {
    const s = startGmGame();
    gmApply(s, scene({ scene: 'Word comes from the south: the King of Tatara is dead.', changes: [{ kind: 'dies', npc: 'tatara_shigekuni', reason: 'his heart failed in the night' } as never] }));
    expect(s.houses!.tatara.head).toBe('tatara_kunimaru');
    expect(s.houses!.tatara.cohesion).toBe(85 - 10 - 15);
  });

  it('genpuku: Li comes of age at 15 only when free; a world youth comes of age too', () => {
    const s = startGmGame();
    s.characters[s.liId].born = { year: 84, month: 6, day: 1 };
    passDays(s, 40);
    expect(has(s, 'genpuku_li')).toBe(0); // a slave has none
    s.characters[s.liId].status = 'free';
    passDays(s, 30);
    expect(has(s, 'genpuku_li')).toBe(1);
    expect(has(s, 'genpuku_shinonome_akitoshi')).toBe(1);
  });

  it('Li\'s generation grows with the seasons, met or not', () => {
    const s = startGmGame();
    const v = s.characters.akabane_hayame.stats.VAL;
    passDays(s, 95);
    expect(s.characters.akabane_hayame.stats.VAL).toBeGreaterThan(v);
  });
});

describe('the houses move', () => {
  it('a divided house splits at the turn of the year (gekokujō)', () => {
    const s = startGmGame();
    s.houses!.hagiwara.cohesion = 10;
    passDays(s, 360);
    expect(Object.keys(s.houses!)).toContain('hagiwara_ishizue_of_k_ri');
    expect(s.houses!.hagiwara.koku).toBe(300_000 - 8_000);
    expect(s.houses!.hagiwara.cohesion).toBeGreaterThanOrEqual(50);
  });

  it('Claude moves a house ±10 with a reason; alliances and hostages are checked', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'house', house: 'goda', prestige: 40, reason: 'a victory at court' } as never] }));
    expect(s.houses!.goda.prestige).toBe(50);
    gmApply(s, scene({ changes: [{ kind: 'alliance', a: 'kamio', b: 'kirishima' } as never] }));
    expect(s.houses!.kamio.allies).toContain('kirishima');
    expect(s.houses!.kirishima.prestige).toBe(70);
    const r = gmApply(s, scene({ changes: [{ kind: 'hostage', house: 'kamio', npc: 'goda_ensai' } as never] }));
    expect(r.notes.join(' ')).toMatch(/living member/);
    gmApply(s, scene({ changes: [{ kind: 'hostage', house: 'kamio', npc: 'kamio_seijuro' } as never] }));
    expect(s.houses!.kamio.crownLoyalty).toBe(100);
  });

  it('adoption needs a proven, liked Li and a house without a grown heir', () => {
    const s = startGmGame();
    const c = s.characters[s.liId];
    c.status = 'free';
    s.flags.rank_level = 4;
    const no = gmApply(s, scene({ changes: [{ kind: 'adopt', house: 'ishizue' } as never] }));
    expect(no.notes.join(' ')).toMatch(/must know Li/);
    s.flags.met_ishizue = 1;
    s.relations.ishizue.base = { trust: 95, respect: 95, affection: 95, fear: 0, rivalry: 0 };
    gmApply(s, scene({ changes: [{ kind: 'adopt', house: 'ishizue' } as never] }));
    expect(s.houses!.ishizue.heir).toBe('li');
    expect(c.status).toBe('noble');
  });
});
