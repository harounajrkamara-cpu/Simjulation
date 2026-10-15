import { describe, expect, it } from 'vitest';
import { gmTurn } from '../target/ai/gm';
import { startGmGame } from '../target/engine/gm';

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
});
