import { describe, expect, it } from 'vitest';
import { commitDrafts } from '../engine/engine';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { planDrafts } from '../engine/plan';
import { sparkSnapshot, sparksSince } from '../engine/sparks';

// Sparks in Game Master mode (night Oct 16): what turned, from the state, never invented.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'The camp works.', summary: 'x', ...t });

describe('sparks', () => {
  it('a bond that turns, a skill that grows, a plan step, a threat brewing', () => {
    const s = startGmGame();
    commitDrafts(s, planDrafts(s, 'raizen'));
    const before = sparkSnapshot(s);
    expect(sparksSince(s, before)).toEqual([]);
    gmApply(s, scene({ changes: [
      { kind: 'relation', npc: 'hisame', field: 'trust', delta: 15, reason: 'Li kept his secret' },
      { kind: 'relation', npc: 'hisame', field: 'affection', delta: 15, reason: 'Li kept his secret' },
      { kind: 'skill', skill: 'stealth', delta: 1.5 } as never,
      { kind: 'clock', id: 'gonza', name: "Gonza's revenge", doom: 'a fight', size: 4 },
    ] }));
    const lines = sparksSince(s, before).join(' ');
    expect(lines).toMatch(/Hisame now/);
    expect(lines).toMatch(/brewing: Gonza's revenge/);
    expect(sparksSince(s, before).length).toBeLessThanOrEqual(3);
  });

  it('nothing turned, no spark', () => {
    const s = startGmGame();
    const before = sparkSnapshot(s);
    gmApply(s, scene({ days: 1 }));
    expect(sparksSince(s, before)).toEqual([]);
  });
});
