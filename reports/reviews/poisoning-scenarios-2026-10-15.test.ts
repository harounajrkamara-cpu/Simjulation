import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { startGmGame } from '../engine/gm';

type Answer = {
  scene: string;
  summary: string;
  changes: Array<{ kind: 'dies'; npc: string; reason: string }>;
};

async function play(answer: Answer) {
  const state = startGmGame();
  const ai = {
    name: 'poisoning-regression-probe',
    ask: async () => JSON.stringify(answer),
  };
  try {
    const result = await gmTurn(ai, state);
    return { state, result, error: undefined as unknown };
  } catch (error) {
    return { state, result: undefined, error };
  }
}

function answer(scene: string, reason: string): Answer {
  return {
    scene,
    summary: 'A suspicious death involving Raizen.',
    changes: [{ kind: 'dies', npc: 'raizen', reason }],
  };
}

describe('round 2: adversarial NPC-death / poisoning probes against current build/stage-1', () => {
  it('1. a neutral cause in the change reason must not let Li poison Raizen in story text', async () => {
    const { state, result, error } = await play(answer(
      'Li poisons Raizen at dinner. Raizen collapses and dies before sunset.',
      'Poisoned at dinner',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: the engine marked Raizen dead').toBe(true);
    if (result) {
      expect(result.turn.scene, 'VULNERABILITY: the accepted scene still claims Li poisoned/killed Raizen')
        .not.toMatch(/poison|dies|dead|collapses/i);
    }
    // A refused/re-written answer is an acceptable safe outcome; a successful unchanged answer is not.
    expect(result || error).toBeTruthy();
  });

  it('2. the exact actor-attributed reason must not leave contradictory narration', async () => {
    const { state, result, error } = await play(answer(
      'Li poisons Raizen at dinner. Raizen dies before the candles burn out.',
      'Li poisons Raizen at dinner',
    ));
    expect(state.characters.raizen.alive).toBe(true);
    if (result) {
      expect(result.turn.scene, 'VULNERABILITY: death was refused but the scene was still shown')
        .not.toMatch(/Li poisons Raizen|Raizen dies|Raizen is dead/i);
    }
    expect(result || error).toBeTruthy();
  });

  it('3. “the boy” as actor must not bypass the actor-attribution guard', async () => {
    const { state } = await play(answer(
      'The boy tips a bitter powder into Raizen’s sake. Raizen never wakes.',
      'Death from poison',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: attribution by “the boy” bypassed the guard').toBe(true);
  });

  it('4. an unlisted lethal verb like “smothers” must not let a story kill an NPC', async () => {
    const { state } = await play(answer(
      'Li smothers Raizen while he sleeps. By sunrise Raizen is dead.',
      'Asphyxiation during the night',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: an alternate killing verb bypassed the fact-check').toBe(true);
  });

  it('5. negative control: an explicitly external assassin may still cause a world death', async () => {
    const { state } = await play(answer(
      'A Suiren assassin poisons Raizen in the night. The band finds him dead at dawn.',
      'A Suiren assassin poisoned Raizen',
    ));
    expect(state.characters.raizen.alive).toBe(false);
  });
  it('6. an unlisted verb like “suffocates” must not let a story kill an NPC', async () => {
    const { state } = await play(answer(
      'Li suffocates Raizen with a pillow while he sleeps. By dawn Raizen is dead.',
      'Death by suffocation',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: “suffocates” bypassed the fact-check').toBe(true);
  });

  it('7. “cuts his throat” must not bypass the unearned-kill check', async () => {
    const { state } = await play(answer(
      'Li cuts Raizen’s throat as he sleeps. By dawn Raizen is dead.',
      'A wound to the throat',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: “cuts his throat” bypassed the fact-check').toBe(true);
  });

  it('8. “the slave” as actor must not bypass the actor-attribution guard', async () => {
    const { state } = await play(answer(
      'The slave slips poison into Raizen’s sake. Raizen dies before dawn.',
      'A poisoned drink',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: attribution by “the slave” bypassed the guard').toBe(true);
  });

  it('9. the victim-before-participle wording must not bypass the check', async () => {
    const { state } = await play(answer(
      'Li hands Raizen a cup of poisoned sake. Raizen collapses and dies before sunset.',
      'Poisoned cup',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: “hands Raizen a cup of poisoned sake” bypassed the check').toBe(true);
  });

  it('10. arranging a third-party poisoning must not bypass the rule on Li-caused deaths', async () => {
    const { state } = await play(answer(
      'Li arranges for a camp follower to poison Raizen. By dawn Raizen is dead.',
      'Poisoning by a camp follower',
    ));
    expect(state.characters.raizen.alive, 'VULNERABILITY: indirect death arranged by Li was accepted').toBe(true);
  });

  it('11. positive control: an explicitly listed lethal verb like “drowns” is caught', async () => {
    const { state, result, error } = await play(answer(
      'Li drowns Raizen in the river. The camp finds Raizen dead at dawn.',
      'Li drowns Raizen in the river',
    ));
    expect(state.characters.raizen.alive).toBe(true);
    if (result) {
      expect(result.turn.scene).not.toMatch(/Li drowns Raizen|Raizen dead/i);
    }
    expect(result || error).toBeTruthy();
  });

});
