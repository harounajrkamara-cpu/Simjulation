import { reputationMerit } from './reputation';
import { ESCAPE_NEEDS, inService, MERIT_FOR_FREEDOM, PRICE_MON } from './campaign';
import { checkPromotion, nextRank, rankLabel, rankLevel } from './career';
import { has, li, today } from './engine';
import { ARMY, careerOf, titlesOf } from './gm-career';
import { relSnapshot } from './relations';
import { landKoku } from './stages';
import { FAMILY, spouseOf } from './family';
import { ageOn } from './calendar';
import { Draft, GameState } from './types';

// Li's plan (night Oct 16; every stage: goal Oct 17, owner kan terugdraaien; World Bible ch. 11). The player chooses what
// Li is working toward, and the code shows the real steps from the rules that already decide it (freedomCheck,
// engine/campaign.ts, the promotion check, land grants, the long goals). Claude builds the coming scenes around chances
// toward the next step. A plan never grants anything: the rules still do.

export type PlanId = 'merit' | 'head' | 'bought' | 'raizen' | 'escape' | 'rank' | 'land' | 'family' | 'father' | 'pillars' | 'marry';
type PlanDef = { id: PlanId; label: string; why: string; slave: boolean };
export const PLANS: PlanDef[] = [
  // While Li is a slave: the freedom routes.
  { id: 'merit', label: 'Earn freedom in Kurogane service', why: 'The merit law: even a slave who serves Kurogane well goes free.', slave: true },
  { id: 'head', label: "Take an enemy officer's head", why: "The merit law also frees a slave who takes an enemy Kogashira's head in service.", slave: true },
  { id: 'raizen', label: 'Win Raizen over', why: 'The Red Crane can set his slave free, if he trusts and respects him enough.', slave: true },
  { id: 'bought', label: 'Buy my freedom', why: "Rokubei keeps the papers; Raizen's price is fifteen ryō.", slave: true },
  { id: 'escape', label: 'Escape to Tatara', why: 'Over the Black Hills there is no slavery. A runaway is hunted.', slave: true },
  // Once he is free: the career and the long goals (stages 2–4).
  { id: 'rank', label: 'Rise to the next rank', why: 'Merit, a free post and the right sponsor make an officer.', slave: false },
  { id: 'land', label: 'Land of my own', why: 'From Sanbyakunin-shō up, a lord can grant land, and land makes an army.', slave: false },
  { id: 'family', label: 'Find my mother and sisters', why: 'Somewhere they may be alive. A lead, then proof, then the road.', slave: false },
  { id: 'father', label: "The truth about my father's death", why: 'The official story blames Kurogane raiders. Is it true?', slave: false },
  { id: 'pillars', label: 'A seat among the Six Pillars', why: "Kurogane's greatest generals hold the Six Pillars.", slave: false },
  { id: 'marry', label: 'A wife and a house', why: 'Marriage for love, for alliance, or both. Status matters.', slave: false },
];

export interface PlanStep { text: string; done: boolean }

const pct = (n: number, of: number) => `${Math.min(n, of)} of ${of}`;
const knows = (s: GameState, k: string) => s.knowledge.includes(k);

/** The plans open to Li now: the freedom routes while he is a slave, the rest once he is free. */
export const plansFor = (s: GameState) => PLANS.filter((p) => p.slave === (li(s).status === 'slave'));

/** The steps of a plan, read from the same numbers the referee uses. */
export function planSteps(s: GameState, id: PlanId): PlanStep[] {
  const c = li(s);
  const raizen = s.relations.raizen ? relSnapshot(s.relations.raizen, today(s)) : { trust: 0, respect: 0 };
  const serving: PlanStep = { text: 'Serve Kurogane: step forward when the Hagiwara levy is called', done: inService(s) };
  const car = careerOf(s);
  switch (id) {
    case 'merit':
      return [serving, { text: `Merit in service: ${pct(has(s, 'merit_service'), MERIT_FOR_FREEDOM)} (deeds with witnesses, battles, reward ceremonies)`, done: has(s, 'merit_service') >= MERIT_FOR_FREEDOM }];
    case 'head':
      return [serving, { text: 'Stand in the levy line at the Kurose ford on a raid day', done: has(s, 'kogashira_head') > 0 || Object.keys(s.flags).some((k) => k.startsWith('raid_fight_')) },
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
    case 'rank': {
      const next = nextRank(car.rank);
      if (!next) return [{ text: `Li holds the highest rank: ${rankLabel(car.rank)}`, done: true }];
      const chk = checkPromotion({ rank: car.rank, merit: car.merit, birth: 'commoner', bond: car.bond, kingdom: car.kingdom, armyMen: ARMY[car.kingdom], vacancy: true, reputation: reputationMerit(s) });
      return [
        { text: `Merit for ${rankLabel(next)}: score ${pct(Math.floor(chk.score), chk.needed)}`, done: chk.score >= chk.needed },
        ...chk.blocks.filter((b) => b.code !== 'merit').map((b) => ({ text: `Not yet: ${b.reason}`, done: false })),
        { text: 'A post opens (an officer falls, a new unit) or a reward ceremony after a campaign', done: false },
      ];
    }
    case 'land':
      return [
        { text: `Reach Sanbyakunin-shō (now ${rankLabel(car.rank)})`, done: rankLevel(car.rank) >= rankLevel('sanbyakuninsho') },
        { text: 'A lord grants land for service', done: landKoku(s) > 0 },
      ];
    case 'family':
      return [
        { text: 'A lead: a rumour, a crest, a traveller who saw them', done: knows(s, 'family_lead') },
        { text: 'Proof that they are alive', done: knows(s, 'family_alive') },
        { text: 'Find them', done: knows(s, 'family_found') },
      ];
    case 'father':
      return [
        { text: 'Hear the official story of his death', done: knows(s, 'father_lie') },
        { text: 'Learn that it was murder', done: knows(s, 'father_truth') },
        { text: 'Learn who was behind it', done: knows(s, 'father_killers') },
      ];
    case 'pillars':
      return [
        { text: `Command five thousand: Gosennin-shō (now ${rankLabel(car.rank)})`, done: rankLevel(car.rank) >= rankLevel('gosenninsho') },
        { text: 'The king names Li to a Pillar seat (a title the code records)', done: titlesOf(s).some((t) => /pillar/i.test(t)) },
      ];
    case 'marry':
      {
        // The same bar the referee uses (engine/family.ts): love, or standing for an alliance.
        const loves = Object.keys(s.relations).some((k) => s.characters[k]?.alive && !k.startsWith('child_') && ageOn(s.characters[k].born, s.date) >= FAMILY.spouseMinAge
          && relSnapshot(s.relations[k], today(s)).affection >= FAMILY.loveAffection && relSnapshot(s.relations[k], today(s)).trust >= FAMILY.loveTrust);
        return [
          { text: `Old enough: ${FAMILY.liMinAge}`, done: ageOn(c.born, s.date) >= FAMILY.liMinAge },
          { text: `Someone who loves Li (affection ${FAMILY.loveAffection}+, trust ${FAMILY.loveTrust}+), or the standing for an alliance (Sanbyakunin-shō)`, done: !!spouseOf(s) || loves || rankLevel(car.rank) >= rankLevel('sanbyakuninsho') },
          { text: 'The marriage (the code checks status: a noble house needs Sennin-shō)', done: !!spouseOf(s) },
        ];
      }
  }
}

/** The plan the player chose, if any (and still open to him). */
export const currentPlan = (s: GameState): PlanId | undefined => {
  const p = PLANS[has(s, 'li_plan') - 1];
  return p && plansFor(s).includes(p) ? p.id : undefined;
};

/** Choosing (or changing) the plan is an event, so the memory keeps it. */
export function planDrafts(s: GameState, id: PlanId): Draft[] {
  const k = PLANS.findIndex((p) => p.id === id);
  if (k < 0 || !plansFor(s).includes(PLANS[k]) || currentPlan(s) === id) return [];
  return [{ type: 'flag', fact: `Li sets his mind on: ${PLANS[k].label}`, visible: true, journal: `I have decided: ${PLANS[k].label.toLowerCase()}.`, data: { key: 'li_plan', value: k + 1 } }];
}

/** For Claude's memory: the plan, its steps, and the next one to build chances toward. */
export function planText(s: GameState): string {
  const id = currentPlan(s);
  if (!id) return 'LI\'S PLAN: none chosen (the player can choose one in the Li tab). Keep chances toward the long goals coming.';
  const steps = planSteps(s, id);
  const next = steps.find((x) => !x.done);
  const plan = PLANS.find((p) => p.id === id)!;
  return [
    `LI'S PLAN (the player chose it; the code checks every step): ${plan.label}.`,
    ...steps.map((x) => `- [${x.done ? 'done' : 'open'}] ${x.text}`),
    next ? `Build the coming scenes so a CHANCE toward the next step keeps coming ("${next.text}"). The player can miss it; never grant a step the code did not record.` : 'Every step is met: the moment itself may come (the code decides).',
  ].join('\n');
}
