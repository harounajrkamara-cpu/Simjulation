import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { alreadySaid, checkPacing, pacingText, stillStreak, waitingStreak } from '../engine/pacing';

// The pacing director (docs/PROPOSAL_PACING.md, owner approved Oct 16), from the owner's ford playtest of version 31.
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Raizen waits by the water.', summary: 'x', ...t });

describe('pacing director', () => {
  it('B. two scenes without time passing warn Claude; a third still scene goes back; moving time is fine', () => {
    const s = startGmGame();
    gmApply(s, scene());
    expect(stillStreak(s)).toBe(1);
    expect(pacingText(s)).not.toMatch(/STALLING/);
    gmApply(s, scene());
    expect(stillStreak(s)).toBe(2);
    expect(pacingText(s)).toMatch(/THE SCENE IS STALLING/);
    expect(checkPacing(s, scene()).map((p) => p.kind)).toEqual(['pacing']);
    expect(checkPacing(s, scene({ days: 1 }))).toEqual([]);
    expect(checkPacing(s, scene({ sleeps: true }))).toEqual([]);
    gmApply(s, scene({ days: 1 }));
    gmApply(s, scene());
    expect(stillStreak(s)).toBe(1); // time moved: the count starts again
  });

  it('A. a player who only waits or obeys twice is answered by the world, not another question', () => {
    const s = startGmGame();
    gmApply(s, scene({ days: 1 }), 'just follow orders am a slave');
    expect(waitingStreak(s, 'I say nothing and wait')).toBe(2);
    expect(pacingText(s, 'I say nothing and wait')).toMatch(/THE PLAYER IS WAITING OR OBEYING/);
    expect(checkPacing(s, scene(), 'I say nothing and wait').map((p) => p.kind)).toEqual(['pacing']);
    expect(checkPacing(s, scene({ routine: true }), 'I say nothing and wait')).toEqual([]);
    expect(waitingStreak(s, 'I tell Raizen the horses have turned')).toBe(0);
  });

  it('D. phrases used in two of the last three scenes are listed so Claude does not repeat them', () => {
    const s = startGmGame();
    gmApply(s, scene({ scene: 'Raizen shifts his stiff left knee and watches the ford.', days: 1 }));
    gmApply(s, scene({ scene: 'Gonza waits in the willows while Raizen shifts his stiff left knee.', days: 1 }));
    expect(alreadySaid(s)).toContain('his stiff left');
    expect(alreadySaid(s).join(' ')).toMatch(/stiff left knee/);
    expect(pacingText(s)).toMatch(/ALREADY SAID/);
  });

  it('pacing is soft: when the rewrite still lingers, the scene is shown, never lost', async () => {
    const s = startGmGame();
    const ai = { name: 'still', ask: async () => JSON.stringify({ scene: 'Raizen waits by the water. The reeds are still.', summary: 'Raizen waits.' }) };
    await gmTurn(ai, s, 'I listen');
    await gmTurn(ai, s, 'I listen');
    const third = await gmTurn(ai, s, 'I listen');
    expect(third.turn.scene).toMatch(/Raizen waits/);
    expect(s.events.filter((e) => e.type === 'scene')).toHaveLength(3);
  });
});

describe('C. threat clocks', () => {
  const gonza = { kind: 'clock' as const, id: 'gonza', name: "Gonza's revenge", doom: 'Gonza catches Li alone: a fight the code runs', size: 4 };

  it('the code fills an open threat by itself, one step per 2 days, until it is due', async () => {
    const { clockFeelings, checkClocks } = await import('../engine/clocks');
    const s = startGmGame();
    gmApply(s, scene({ changes: [gonza] }));
    expect(s.gm!.clocks![0]).toMatchObject({ id: 'gonza', filled: 0, open: true });
    expect(clockFeelings(s)).toEqual(["Gonza's revenge: something is brewing"]);
    gmApply(s, scene({ days: 5 }));
    expect(s.gm!.clocks![0].filled).toBe(2);
    expect(clockFeelings(s)).toEqual(["Gonza's revenge: it is getting close"]);
    gmApply(s, scene({ days: 3 }));
    expect(s.gm!.clocks![0].filled).toBe(4);
    expect(gmApply(s, scene()).notes).toEqual([]);
    expect(checkClocks(s, scene()).map((p) => p.kind)).toEqual(['pacing']); // due: the scene must deliver it
    expect(checkClocks(s, scene({ fight: { foe: 'Gonza', rank: 'D', look: 'x', deadly: false } }))).toEqual([]);
    expect(checkClocks(s, scene({ changes: [{ kind: 'clock', id: 'gonza', close: true, reason: 'it happened' }] }))).toEqual([]);
  });

  it('Claude moves a clock at most one step per scene, and only 3 threats are open at once', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [gonza] }));
    gmApply(s, scene({ changes: [{ kind: 'clock', id: 'gonza', tick: 5 }] }));
    expect(s.gm!.clocks![0].filled).toBe(1);
    gmApply(s, scene({ changes: [{ kind: 'clock', id: 'gonza', back: 3, reason: 'Li stays in the light' }] }));
    expect(s.gm!.clocks![0].filled).toBe(0);
    for (const id of ['a', 'b']) gmApply(s, scene({ changes: [{ kind: 'clock', id, name: id, doom: 'x' }] }));
    const r = gmApply(s, scene({ changes: [{ kind: 'clock', id: 'd', name: 'd', doom: 'x' }] }));
    expect(r.notes.join(' ')).toMatch(/already 3 threats/);
    gmApply(s, scene({ changes: [{ kind: 'clock', id: 'gonza', close: true }] }));
    expect(s.gm!.clocks!.find((c) => c.id === 'gonza')!.open).toBe(false);
  });

  it('clocks replay the same from a save', async () => {
    const { fromSave, stateHash, toSave } = await import('../engine/engine');
    const s = startGmGame();
    gmApply(s, scene({ changes: [gonza] }));
    gmApply(s, scene({ days: 5 }));
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });
});
