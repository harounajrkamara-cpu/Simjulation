import { describe, expect, it } from 'vitest';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { commitDrafts, injuryDrafts } from '../engine/engine';
import { checkGmInjuries, checkGmLies } from '../engine/factcheck';

// Found in the live play-test on claude.ai (Oct 17, save slot 3).
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'Time passes.', summary: 'x', ...t });

describe('live test Oct 17', () => {
  it('training endurance trains the skill; it never becomes a fighting style', () => {
    const s = startGmGame();
    const e = s.characters[s.liId].skills.endurance;
    gmApply(s, scene({ changes: [{ kind: 'train', focus: 'endurance', days: 6 }] }));
    expect(s.characters[s.liId].styles.endurance).toBeUndefined();
    expect(s.characters[s.liId].skills.endurance).toBeGreaterThan(e);
  });

  it('a lasting injury the code did not record is refused; one it did record may be told', () => {
    const s = startGmGame();
    const t = { scene: 'Something in him has been broken that will not mend the way it was.' };
    expect(checkGmInjuries(s, t).map((p) => p.kind)).toEqual(['mechanics']);
    commitDrafts(s, injuryDrafts(s, s.liId, 'side'));
    expect(checkGmInjuries(s, t)).toEqual([]);
    expect(checkGmInjuries(s, { scene: 'The bruise will heal in a week.' })).toEqual([]);
  });

  it('a lie the player tells must be recorded for the code to judge (a soft reminder)', () => {
    expect(checkGmLies({ changes: [] }, 'I lie: I copied the soldiers at the drill yard.').map((p) => p.kind)).toEqual(['pacing']);
    expect(checkGmLies({ changes: [{ kind: 'lie' }] }, 'I lie to him')).toEqual([]);
    expect(checkGmLies({ changes: [] }, 'I lie down on the straw and sleep')).toEqual([]);
  });
});

describe('live test Oct 17: a lie Claude did not record', () => {
  it('the code judges it itself, against the one Li spoke to', async () => {
    const { gmApply: apply, startGmGame: start } = await import('../engine/gm');
    const s = start();
    apply(s, { scene: 'Raizen watches him. "The drill yard," Raizen says. Raizen waits.', summary: 'x' }, 'I lie again: I watched soldiers in the drill yard');
    expect(s.relations.raizen.mods.some((m) => /caught lying/.test(m.reason))).toBe(true);
  });
});

describe('signs of hidden changes (WB 12b #11; live test Oct 17)', () => {
  it('a caught lie shows its own sign; a big hidden change a plain one; a small one none', async () => {
    const { gmApply: apply, startGmGame: start } = await import('../engine/gm');
    const { sparkSnapshot, sparksSince } = await import('../engine/sparks');
    const s = start();
    const mark = sparkSnapshot(s);
    apply(s, { scene: 'Raizen watches him.', summary: 'x', changes: [{ kind: 'relation', npc: 'hachi', field: 'affection', delta: 8, reason: 'shared bread' }, { kind: 'relation', npc: 'sukezo', field: 'trust', delta: 2, reason: 'a nod' }] }, 'I lie to Raizen: I copied the soldiers');
    const lines = sparksSince(s, mark).join(' | ');
    expect(lines).toMatch(/Mikumo Raizen sees through Li's lie\./);
    expect(lines).toMatch(/Hachi warms to Li\./);
    expect(lines).not.toMatch(/Sukez/);
    expect(lines).not.toMatch(/\d/);
  });
});
