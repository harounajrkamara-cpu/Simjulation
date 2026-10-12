import { describe, expect, it } from 'vitest';
import { armyFromLand, endMonth, newDomain, runYear, setTaxRate, startProject, taxDay } from '../engine/domain';
import { commitDrafts, fromSave, stateHash, toSave } from '../engine/engine';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { lifeStage } from '../engine/stages';
import { GameState } from '../engine/types';

// Li's land (World Bible ch. 7, Numbers §7) and its use in Game Master mode.

describe('the domain rules', () => {
  it('army from land: 200–250 per 10,000 koku; tax stays 40–60%', () => {
    expect(armyFromLand(10_000).normal).toBeGreaterThanOrEqual(200);
    expect(armyFromLand(10_000).normal).toBeLessThanOrEqual(250);
    expect(setTaxRate(newDomain({ id: 'd', name: 'x', koku: 300, crownAuthority: 55 }), 0.9).taxRate).toBe(0.6);
  });

  it('tax day fills the treasury; higher tax costs the villages\' loyalty', () => {
    const d = newDomain({ id: 'd', name: 'x', koku: 1000, crownAuthority: 55 });
    const low = taxDay(setTaxRate(d, 0.4)).domain;
    const high = taxDay(setTaxRate(d, 0.6)).domain;
    expect(high.wallets.treasury).toBeGreaterThan(low.wallets.treasury);
    expect(high.peasantLoyalty).toBeLessThan(low.peasantLoyalty);
  });

  it('unpaid soldiers desert (after a month\'s grace)', () => {
    let d = newDomain({ id: 'd', name: 'x', koku: 1000, crownAuthority: 55 });
    d = endMonth(d, 100, 1).domain; // nothing to pay with: unpaid
    expect(d.arrears.standing).toBeGreaterThan(0);
    const before = d.standing;
    d = endMonth(d, 100, 2).domain; // still unpaid: they go
    expect(d.standing).toBeLessThan(before);
  });

  it('a project costs, takes its days, then leaves the dashboard', () => {
    let d = newDomain({ id: 'd', name: 'x', koku: 1000, crownAuthority: 55, wallets: { li: 0, unit: 0, treasury: 1_000_000 } });
    const r = startProject(d, 'shrine', 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    d = r.domain;
    expect(d.projects).toHaveLength(1);
    d = runYear(d, 100).domain;
    expect(d.projects).toHaveLength(0);
    expect(d.built).toContain('shrine');
  });
});

// ---------- in Game Master mode ----------

const turn = (o: Record<string, unknown>) => parseGmTurn({ scene: 'Li stands before the lord.', summary: 'Land.', ...o })!;
function officer(level: number): GameState {
  const s = startGmGame();
  commitDrafts(s, [
    { type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'an officer' } },
    { type: 'flag', fact: 'rank', visible: false, data: { key: 'rank_level', value: level } },
  ]);
  return s;
}

describe('land in Game Master mode', () => {
  it('no land below Sanbyakunin-shō', () => {
    const s = officer(4);
    expect(gmApply(s, turn({ changes: [{ kind: 'land', koku: 300 }] })).notes.join(' ')).toMatch(/only from Sanbyakunin-shō/);
    expect(s.domain).toBeUndefined();
  });

  it('a grant is sized by the rank (a village of ~300 koku), comes with stores, and shows in memory and stage', () => {
    const s = officer(5);
    const r = gmApply(s, turn({ changes: [{ kind: 'land', koku: 5000, name: 'Ōmizu village' }] }));
    expect(r.notes.join(' ')).toMatch(/set to 300 koku/);
    expect(s.domain?.koku).toBe(300);
    expect(s.domain?.wallets.treasury).toBeGreaterThan(0);
    expect(gmMemoryText(s)).toMatch(/LI'S LAND: Ōmizu village/);
    expect(lifeStage(s)).toBe('officer');
    expect(gmMemoryText(s)).toMatch(/about 300 koku/);
  });

  it('projects and orders are checked; months run the land; it replays', () => {
    const s = officer(6);
    gmApply(s, turn({ changes: [{ kind: 'land', koku: 3000, name: 'The Ōmizu district' }] }));
    let r = gmApply(s, turn({ changes: [{ kind: 'project', project: 'shrine' }, { kind: 'project', project: 'castle' }, { kind: 'domain', tax: 75, manager: 'sukezo' }] }));
    expect(r.notes.join(' ')).toMatch(/unknown project "castle"/);
    expect(r.notes.join(' ')).toMatch(/tax set to 60%/);
    expect(s.domain?.projects).toHaveLength(1);
    expect(s.domain?.manager).toBe('sukezo');
    for (let k = 0; k < 4; k++) r = gmApply(s, turn({ days: 90 }));
    expect(s.domain?.projects).toHaveLength(0);
    expect(s.domain?.built).toContain('shrine');
    expect(s.events.some((e) => e.type === 'domain' && /Tax rice/.test(e.fact))).toBe(true);
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });
});
