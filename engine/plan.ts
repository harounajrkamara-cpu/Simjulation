import { ESCAPE_NEEDS, inService, MERIT_FOR_FREEDOM, PRICE_MON } from './campaign';
import { has, li, today } from './engine';
import { relSnapshot } from './relations';
import { Draft, GameState } from './types';

// Li's plan (night Oct 16, owner kan terugdraaien; World Bible ch. 11). The player chooses what Li is working toward, and
// the code shows the real steps from the rules that already decide it (engine/gm.ts freedomCheck, engine/campaign.ts).
// Claude builds the coming scenes around chances toward the next step. A plan never grants anything: the rules still do.

export type PlanId = 'merit' | 'head' | 'bought' | 'raizen' | 'escape';
export const PLANS: { id: PlanId; label: string; why: string }[] = [
  { id: 'merit', label: 'Earn freedom in Kurogane service', why: 'The merit law: even a slave who serves Kurogane well goes free.' },
  { id: 'head', label: "Take an enemy officer's head", why: "The merit law also frees a slave who takes an enemy Kogashira's head in service." },
  { id: 'raizen', label: 'Win Raizen over', why: 'The Red Crane can set his slave free, if he trusts and respects him enough.' },
  { id: 'bought', label: 'Buy my freedom', why: "Rokubei keeps the papers; Raizen's price is fifteen ryō." },
  { id: 'escape', label: 'Escape to Tatara', why: 'Over the Black Hills there is no slavery. A runaway is hunted.' },
];

export interface PlanStep { text: string; done: boolean }

const pct = (n: number, of: number) => `${Math.min(n, of)} of ${of}`;

/** The steps of a plan, read from the same numbers the referee uses. */
export function planSteps(s: GameState, id: PlanId): PlanStep[] {
  const c = li(s);
  const raizen = s.relations.raizen ? relSnapshot(s.relations.raizen, today(s)) : { trust: 0, respect: 0 };
  const serving: PlanStep = { text: 'Serve Kurogane: step forward when the Hagiwara levy is called', done: inService(s) };
  switch (id) {
    case 'merit':
      return [serving, { text: `Merit in service: ${pct(has(s, 'merit_service'), MERIT_FOR_FREEDOM)} (deeds with witnesses, battles, reward ceremonies)`, done: has(s, 'merit_service') >= MERIT_FOR_FREEDOM }];
    case 'head':
      return [serving, { text: 'Stand in the levy line at the Kurose ford on a raid day', done: has(s, 'kogashira_head') > 0 },
        { text: "Take an enemy Kogashira's head in a fight to the death (the code runs it)", done: has(s, 'kogashira_head') > 0 }];
    case 'raizen':
      return [{ text: `Raizen's trust: ${pct(Math.floor(raizen.trust), 85)}`, done: raizen.trust >= 85 },
        { text: `Raizen's respect: ${pct(Math.floor(raizen.respect), 85)}`, done: raizen.respect >= 85 }];
    case 'bought':
      return [{ text: `Money: ${pct(s.money, PRICE_MON)} mon (soldiers' tips on paydays, levy loot, stitching the wounded)`, done: s.money >= PRICE_MON }];
    case 'escape':
      return [
        { text: `Quiet enough to pass the sentries: stealth ${pct(Math.floor(c.skills.stealth ?? 0), ESCAPE_NEEDS.stealth)}`, done: (c.skills.stealth ?? 0) >= ESCAPE_NEEDS.stealth },
        { text: `Strong enough to outrun the hunters: endurance ${pct(Math.floor(c.skills.endurance ?? 0), ESCAPE_NEEDS.endurance)}`, done: (c.skills.endurance ?? 0) >= ESCAPE_NEEDS.endurance },
        { text: 'Fit on the night: not badly hurt, not worn out', done: c.wound <= ESCAPE_NEEDS.maxWound && c.fatigue <= ESCAPE_NEEDS.maxFatigue },
        { text: 'Wait for winter quarters (Months 10–12), when the watch is thin', done: s.date.month >= 10 },
      ];
  }
}

/** The plan the player chose, if any. */
export const currentPlan = (s: GameState): PlanId | undefined => PLANS[has(s, 'li_plan') - 1]?.id;

/** Choosing (or changing) the plan is an event, so the memory keeps it. */
export function planDrafts(s: GameState, id: PlanId): Draft[] {
  const k = PLANS.findIndex((p) => p.id === id);
  if (k < 0 || li(s).status !== 'slave' || currentPlan(s) === id) return [];
  return [{ type: 'flag', fact: `Li sets his mind on: ${PLANS[k].label}`, visible: true, journal: `I have decided: ${PLANS[k].label.toLowerCase()}.`, data: { key: 'li_plan', value: k + 1 } }];
}

/** For Claude's memory: the plan, its steps, and the next one to build chances toward. */
export function planText(s: GameState): string {
  const id = currentPlan(s);
  if (!id || li(s).status !== 'slave') return 'LI\'S PLAN: none chosen yet (the player can choose one in the Li tab). Keep chances toward the long goals coming.';
  const steps = planSteps(s, id);
  const next = steps.find((x) => !x.done);
  const plan = PLANS.find((p) => p.id === id)!;
  return [
    `LI'S PLAN (the player chose it; the code checks every step): ${plan.label}.`,
    ...steps.map((x) => `- [${x.done ? 'done' : 'open'}] ${x.text}`),
    next ? `Build the coming scenes so a CHANCE toward the next step keeps coming ("${next.text}"). The player can miss it; never grant a step the code did not record.` : 'Every step is met: the next scene may offer the moment itself (the code decides with "freedom").',
  ].join('\n');
}
