import { describe, expect, it } from 'vitest';
import { gmMemoryText, gmTimeDrafts, startGmGame } from '../engine/gm';
import { commitDrafts, has } from '../engine/engine';
import { FUSES, NEVER, fuseDrafts, fuseOutcome } from '../engine/fuses';
import { succession, treasury, unity } from '../engine/kingdoms';
import { monthlyPay } from '../engine/pay';
import { defeatDrafts } from '../engine/fate';
import type { GameState } from '../engine/types';

// Block F of Phase 6 (audit gaps 10, 11, 29): kingdom values, laws, fuse decision trees.
const months = (s: GameState, n: number) => { for (let k = 0; k < n; k++) commitDrafts(s, gmTimeDrafts(s, 30)); };
const coup = FUSES.find((f) => f.id === 'coup')!;

describe('kingdom values beyond authority', () => {
  it('treasury, unity and succession are read from the world, and Claude sees them', () => {
    const s = startGmGame();
    expect(treasury(s, 'ushio')).toBeGreaterThan(treasury(s, 'takane'));
    expect(unity(s, 'tatara')).toBe(95);
    expect(succession(s, 'ushio').word).toMatch(/contested|child/);
    expect(succession(s, 'takane').word).toMatch(/secure/);
    expect(gmMemoryText(s)).toMatch(/THE KINGDOMS[\s\S]*Kurogane: treasury 55/);
  });

  it('the canal drains Kurogane each year; a poor Crown pays half', () => {
    const s = startGmGame();
    months(s, 12);
    expect(treasury(s, 'kurogane')).toBe(55 - 3 - 5); // at war with Suiren, and the canal
    s.characters[s.liId].status = 'free';
    s.flags.levy_service = 1;
    const full = monthlyPay(s);
    s.flags.treasury_kurogane = 10;
    expect(monthlyPay(s)).toBe(Math.round(full / 2));
  });
});

describe('laws of the kingdoms (Atlas §12)', () => {
  it('a captive of a kingdom without slavery is let go within a month', () => {
    const s = startGmGame();
    s.characters[s.liId].status = 'free';
    s.flags.defeat_step = 6;
    s.flags.defeat_day = 0;
    commitDrafts(s, defeatDrafts(s, 'test'));
    s.flags.captive_by = 6; // Tatara
    months(s, 2);
    expect(has(s, 'captive')).toBe(0);
  });
});

describe('fuses read the living world (decision trees)', () => {
  it('a fuse never happens when the one who would act is dead', () => {
    const s = startGmGame();
    s.characters.goda_ensai.alive = false;
    commitDrafts(s, fuseDrafts(s, coup.day + 30));
    expect(has(s, 'fuse_coup')).toBe(NEVER);
    expect(gmMemoryText(s)).not.toMatch(/Gōda Ensai's men tried/);
  });

  it('the outcome changes the world: a crushed coup kills Gōda, and his house passes on', () => {
    const s = startGmGame();
    expect(fuseOutcome(s, coup).id).toBe('crushed');
    commitDrafts(s, fuseDrafts(s, coup.day));
    expect(s.characters.goda_ensai.alive).toBe(false);
    expect(s.houses!.goda.head).not.toBe('goda_ensai');
  });

  it('Li\'s one push still wins a tie (owner, Oct 15), even with the world\'s mood', () => {
    const s = startGmGame();
    s.flags.lever_coup_king_killed = 1;
    expect(fuseOutcome(s, coup).id).toBe('king_killed');
  });

  it('a sign shows before the fuse, when Li is in its kingdom', () => {
    const s = startGmGame();
    const out = fuseDrafts(s, coup.day - 20);
    expect(out.some((d) => (d.data as { sign?: string }).sign === 'coup' && d.visible)).toBe(true);
  });
});
