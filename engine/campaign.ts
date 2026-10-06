import { DuelOutcome, DuelTemplate, StoryEvent } from './content';
import { GameState } from './types';

// Phase 2 (Build Plan): the slave arc to freedom. 📝 Content proposal for owner review — mechanics follow approved canon:
// Kurogane merit law (WB 10.4 route 1, Numbers §6: 30 combat + command merit in official Kurogane service frees a slave),
// buying freedom (15 ryō = 15,000 mon, Numbers §7), Raizen's release (very high trust and respect).
// The border war is a world fact (Atlas §9: Kurogane–Suiren "border war, raids, no full campaign"); its raids follow a
// fixed schedule (no dice): campaign months 4–9, on days 8 and 22, every year.

export const MERIT_FOR_FREEDOM = 30;
export const PRICE_MON = 15_000;

/** Suiren raiders Li may face in a skirmish, in a fixed rotating order (Atlas §7: Suiren levies, spears). */
const RAIDERS = [
  { name: 'a Suiren levy spearman', val: 20, mastery: 16, estimate: 'Suiren levy with a spear · Warrior E?' },
  { name: 'a Suiren boatman with a hatchet', val: 18, mastery: 14, estimate: 'river boatman, hatchet · Warrior F–E?' },
  { name: 'a Suiren levy archer, out of arrows', val: 16, mastery: 18, estimate: 'archer with a short blade · Warrior E?' },
  { name: 'a veteran Suiren levy', val: 26, mastery: 24, estimate: 'scarred levy, steady spear · Warrior E–D?' },
  { name: 'a young Suiren raider', val: 17, mastery: 12, estimate: 'a frightened boy with a spear · Warrior F?' },
];

const skirmishOutcomes = (foe: string): Record<'won' | 'lost' | 'draw' | 'fled' | 'yielded', DuelOutcome> => ({
  won: {
    fact: `At the ford the levy line holds, and Li brings down ${foe}. The Hagiwara sergeant marks it with a notch on his tally stick.`,
    journal: `In a skirmish at the ford I brought down ${foe}. The sergeant counted it.`,
    grow: 1.0,
    merit: { amount: 1, why: 'witnessed kill of an enemy ashigaru in Kurogane service' },
  },
  lost: {
    fact: `${foe[0].toUpperCase()}${foe.slice(1)} knocks Li into the shallows. The levy line closes over him and drags him back by the collar.`,
    journal: 'I lost my fight at the ford. The levy pulled me out of the water.',
    grow: 0.5,
  },
  draw: {
    fact: 'The raiders break off across the river before anyone wins. Li stands in the cold water, shaking.',
    journal: 'The raiders pulled back across the Kurose before my fight was decided.',
    grow: 0.5,
  },
  fled: {
    fact: 'Li backs out of the line. The sergeant sees it and says nothing, which is worse.',
    journal: 'I stepped out of the line at the ford. The sergeant saw.',
    grow: 0,
    rel: [{ npc: 'raizen', field: 'respect', value: -3, reason: 'Heard the boy stepped out of the line', fade: 270 }],
  },
  yielded: {
    fact: 'Li drops his spear. The raider shoves him down and runs on; the line closes behind.',
    journal: 'I dropped my spear at the ford.',
    grow: 0,
  },
});

/** A skirmish duel for a given raid index (deterministic: the n-th raid always brings the same raider). */
export function skirmishTemplate(n: number): DuelTemplate {
  const r = RAIDERS[n % RAIDERS.length];
  return {
    id: `skirmish_${n}`,
    place: 'the ford on the Kurose',
    intro: `Suiren raiders splash across the ford at dawn. The Hagiwara levy forms a line; Li, a bearer with a borrowed spear, is in it. ${r.name[0].toUpperCase()}${r.name.slice(1)} comes straight at him.`,
    foe: { id: `raider_${n % RAIDERS.length}`, name: r.name.replace(/^a /, 'the '), val: r.val, mastery: r.mastery, wound: 0, fatigue: 0, estimate: r.estimate },
    prefs: [{ attack: 3, counter: 1, feint: 1, observe: 0 }, { attack: 1, counter: 3, feint: 0, observe: 1 }, { attack: 1, counter: 1, feint: 3, observe: 0 }][n % 3],
    surprise: false,
    maxWound: 2,
    fleeRisk: 'the sergeant is watching',
    fleeText: 'Li backs out of the line.',
    yieldText: 'Li drops his spear.',
    outcomes: skirmishOutcomes(r.name),
  };
}

/** Raid days: months 4–9 of each year, days 8 and 22 (index 0 = Year 100, Month 4, Day 8). */
export function raidIndexOn(dayIndex: number): number | undefined {
  const year = Math.floor(dayIndex / 360);
  const inYear = dayIndex % 360;
  const month = Math.floor(inYear / 30) + 1;
  const day = (inYear % 30) + 1;
  if (month < 4 || month > 9 || (day !== 8 && day !== 22)) return undefined;
  return year * 12 + (month - 4) * 2 + (day === 22 ? 1 : 0);
}

export const meritInService = (s: GameState) => s.flags.merit_service ?? 0;

/** Story beats of the slave arc that are not tied to one fixed day. */
export const ARC: StoryEvent[] = [
  {
    id: 'levy_call', title: 'The levy is called', day: 90, part: 'morning', tier: 'title', card: { label: 'Summer, Year 100', title: 'The levy is called' },
    text: 'A Hagiwara rider brings a summons: Suiren boats are probing the fords, and every lord along the Kurose must send men. Raizen, paid to guard the river, lends the Hagiwara his bearers for the summer. Rokubei reads out names. Li\'s is one of them, if he wants it.',
    journal: 'Year 100, summer: the Hagiwara levy was called. Raizen lends bearers to it.',
    choice: {
      id: 'levy',
      options: [
        {
          label: 'Step forward: serve in the Hagiwara levy', test: 'VAL', risk: 'real fighting at the fords',
          outcome: {
            fact: 'Li steps forward. Rokubei writes it down without looking up. "Kurogane service," he says. "Their law counts what you do there. Remember that."',
            journal: 'I joined the Hagiwara levy as a bearer. In Kurogane service, what I do is counted.',
            grow: 0,
            rel: [{ npc: 'raizen', field: 'respect', value: 3, reason: 'Volunteered for the levy', fade: 1095 }],
          },
        },
        {
          label: 'Stay with the baggage',
          outcome: { fact: 'Li stays with the carts. Another boy goes in his place.', journal: 'I stayed with the baggage when the levy was called.', grow: 0 },
        },
      ],
    },
  },
  {
    id: 'freed_merit', title: 'The tally stick', day: -1, part: 'morning', tier: 'legend',
    card: { label: 'Legend moment', title: 'Free', native: '自由', meaning: 'by the merit law of Kurogane' },
    when: (s) => meritInService(s) >= MERIT_FOR_FREEDOM && s.characters[s.liId].status === 'slave',
    text: 'The Hagiwara sergeant lays his tally stick on Rokubei\'s table, thirty notches and more, and a Kurogane clerk reads the merit law aloud. Rokubei opens the iron box, takes out a paper, and holds it over the brazier until it burns. "Kurogane pays your owner ten ryō," he says. "You belong to yourself now."',
    journal: 'Legend: by the merit law of Kurogane, my tally reached thirty. My paper burned. I am free.',
  },
  {
    id: 'freed_raizen', title: 'The Red Crane\'s word', day: -1, part: 'evening', tier: 'legend',
    card: { label: 'Legend moment', title: 'Free', native: '自由', meaning: 'by the Red Crane\'s word' },
    when: (s) => s.characters[s.liId].status === 'slave' && relField(s, 'raizen', 'trust') >= 85 && relField(s, 'raizen', 'respect') >= 85,
    text: 'Raizen calls Li to his fire and holds out a paper. "Your name and your price," he says. He drops it into the flames. "A man who fights like you should not be owned. Stay or go. Your choice now."',
    journal: 'Legend: Raizen burned my paper himself. I am free.',
  },
];

/** Relationship value (set by the engine to avoid an import cycle). */
let relField: (s: GameState, npc: string, f: 'trust' | 'respect') => number = () => 0;
export function setRelField(f: typeof relField) { relField = f; }
