import { describe, expect, it } from 'vitest';
import { commitDrafts, fromSave, stateHash, toSave } from '../engine/engine';
import { gmMemoryText, startGmGame } from '../engine/gm';
import { currentPlan, planDrafts, planSteps, planText } from '../engine/plan';

// Li's plan (night Oct 16, owner kan terugdraaien): the player chooses, the code shows the real steps.
describe("Li's plan", () => {
  it('choosing a plan is an event; the memory shows its steps and the next one', () => {
    const s = startGmGame();
    expect(currentPlan(s)).toBeUndefined();
    expect(planText(s)).toMatch(/none chosen/);
    commitDrafts(s, planDrafts(s, 'escape'));
    expect(currentPlan(s)).toBe('escape');
    expect(s.journal.at(-1)!.text).toMatch(/escape to tatara/i);
    expect(gmMemoryText(s)).toMatch(/LI'S PLAN .*Escape to Tatara/);
    expect(planText(s)).toMatch(/\[open\] Quiet enough to pass the sentries: stealth 15 of 25/);
    expect(planText(s)).toMatch(/Build the coming scenes so a CHANCE toward the next step/);
    expect(planDrafts(s, 'escape')).toEqual([]); // the same plan again changes nothing
  });

  it('the steps read the same numbers the referee uses', () => {
    const s = startGmGame();
    s.money = 15_000;
    expect(planSteps(s, 'bought')).toEqual([expect.objectContaining({ done: true })]);
    expect(planSteps(s, 'raizen').every((x) => !x.done)).toBe(true);
    expect(planSteps(s, 'merit')[0]).toMatchObject({ done: false }); // not in service yet
    s.date = { ...s.date, month: 11 };
    expect(planSteps(s, 'escape').at(-1)).toMatchObject({ done: true }); // winter quarters
  });

  it('a plan replays from the save', () => {
    const s = startGmGame();
    commitDrafts(s, planDrafts(s, 'raizen'));
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });
});
