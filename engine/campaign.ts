import { DuelOutcome, DuelTemplate, StoryEvent } from './content';
import { restDone } from './director';
import { GameState } from './types';

// Phase 2 (Build Plan): the slave arc to freedom. 📝 Content proposal for owner review — mechanics follow approved canon:
// Kurogane merit law (WB 10.4 route 1, Numbers §6: 30 combat + command merit in official Kurogane service frees a slave),
// buying freedom (15 ryō = 15,000 mon, Numbers §7), Raizen's release (very high trust and respect).
// The border war is a world fact (Atlas §9: Kurogane–Suiren "border war, raids, no full campaign"); its raids follow a
// fixed schedule (no dice): campaign months 4–9, on days 8 and 22, every year.

export const MERIT_FOR_FREEDOM = 30;
export const PRICE_MON = 15_000;

// Phase 2 completion (📝 proposal, Oct 6): officer raids, the yearly contract, money, escape, beats between raids.
/** Raizen's share of the Kurogane ceremony reward (Numbers §7: 0.1 ryō per merit; "an owner may share"): half, in mon. */
export const SHARE_PER_MERIT = 50;
/** Raizen shares only with a slave he respects (he starts at 40: the boy must earn more). */
export const SHARE_MIN_RESPECT = 50;
/** Coins tossed by soldiers with fresh pay (paydays 1 and 16) and by levy men Li stitches up on raid days. */
export const PAYDAY_TIP = 10;
export const STITCH_TIP = 20;
/** Dice games on paydays (1, 16): deterministic winnings by observation skill (VISIE Phase 2 #2). */
export const DICE_WIN_BASE = 5;
export const DICE_WIN_PER_OBS = 2;
/** Carrying for the Hagiwara villages: pay by endurance (VISIE Phase 2 #2). */
export const CARRY_PAY_BASE = 15;
export const CARRY_PAY_PER_END = 3;
/** Escape (WB 10.4 route 4): fixed requirements, checked in this order (no dice). */
export const ESCAPE_NEEDS = { stealth: 25, endurance: 40, maxFatigue: 1, maxWound: 1 } as const;
/** Years with a contract beat and a levy call (stage 1 ends long before Year 105 in every simulated career). */
const ARC_YEARS = [100, 101, 102, 103, 104];

/** Suiren raiders Li may face in a skirmish, in a fixed rotating order (Atlas §7: Suiren levies, spears). */
const RAIDERS = [
  { name: 'a Suiren levy spearman', val: 20, mastery: 16, estimate: 'Suiren levy with a spear · Warrior E?', loot: 120 },
  { name: 'a Suiren boatman with a hatchet', val: 18, mastery: 14, estimate: 'river boatman, hatchet · Warrior F–E?', loot: 80 },
  { name: 'a Suiren levy archer, out of arrows', val: 16, mastery: 18, estimate: 'archer with a short blade · Warrior E?', loot: 60 },
  { name: 'a veteran Suiren levy', val: 26, mastery: 24, estimate: 'scarred levy, steady spear · Warrior E–D?', loot: 200 },
  { name: 'a young Suiren raider', val: 17, mastery: 12, estimate: 'a frightened boy with a spear · Warrior F?', loot: 40 },
];

/**
 * Officers who lead a raid (Numbers §6: "officer duels only happen when a battle offers them"). Fixed: in every
 * campaign year the raid of Month 6, Day 22 is led by a Gochō and the last raid (Month 9, Day 22) by a Kogashira.
 */
const OFFICERS = {
  gocho: { rank: 'Gochō', name: 'a Suiren Gochō with a lacquered helmet', val: 30, mastery: 28, estimate: 'Suiren Gochō, five men behind him · Warrior D?', merit: 3, loot: 600 },
  kogashira: { rank: 'Kogashira', name: 'a Suiren Kogashira under a blue banner', val: 38, mastery: 36, estimate: 'Suiren Kogashira, ten men, a long sword · Warrior D–C?', merit: 3, loot: 1000 },
} as const;
export type OfficerKind = keyof typeof OFFICERS;

/** Which officer leads raid n, if any. */
export function officerOf(n: number): OfficerKind | undefined {
  return n % 12 === 5 ? 'gocho' : n % 12 === 11 ? 'kogashira' : undefined;
}

const skirmishOutcomes = (foe: string, loot: number): Record<'won' | 'lost' | 'draw' | 'fled' | 'yielded', DuelOutcome> => ({
  won: {
    fact: `At the ford the levy line holds, and Li brings down ${foe}. The Hagiwara sergeant marks it with a notch on his tally stick. The levy keeps what the fallen carry: ${loot} mon for Li.`,
    journal: `In a skirmish at the ford I brought down ${foe}. The sergeant counted it.`,
    grow: 1.0,
    merit: { amount: 1, why: 'witnessed kill of an enemy ashigaru in Kurogane service' },
    money: loot,
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
    outcomes: skirmishOutcomes(r.name, r.loot),
  };
}

/** The officer's fight at the ford for raid n (Li chose to go for him). */
export function officerTemplate(n: number): DuelTemplate {
  const kind = officerOf(n) ?? 'gocho';
  const o = OFFICERS[kind];
  const head = kind === 'kogashira';
  const base = skirmishOutcomes(o.name, o.loot);
  return {
    id: `officer_${n}`,
    place: 'the ford on the Kurose',
    intro: `Li pushes out of the line toward the banner. ${o.name[0].toUpperCase()}${o.name.slice(1)} sees a boy with a borrowed spear coming and turns to meet him.`,
    foe: { id: `officer_${kind}`, name: o.name.replace(/^a /, 'the '), val: o.val, mastery: o.mastery, wound: 0, fatigue: 0, estimate: o.estimate },
    prefs: head ? { attack: 1, counter: 3, feint: 1, observe: 1 } : { attack: 3, counter: 1, feint: 1, observe: 1 },
    surprise: false,
    maxWound: 3,
    fleeRisk: 'the whole line sees it',
    fleeText: 'Li breaks off and runs back to the line.',
    yieldText: 'Li drops his spear in front of the officer.',
    outcomes: {
      ...base,
      won: {
        fact: `The ${o.rank} goes down in the shallows. Li takes the head, as the levy men shout at him to. The sergeant cuts three notches and holds up the stick for the whole line to see. The officer's purse holds ${o.loot} mon.`,
        journal: `At the ford I took the head of a Suiren ${o.rank}. The whole line saw it.`,
        grow: 1.0,
        merit: { amount: o.merit, why: `enemy ${o.rank} head in Kurogane service` },
        money: o.loot,
        flag: head ? ['kogashira_head', 1] : undefined,
        rel: [{ npc: 'raizen', field: 'respect', value: 5, reason: `Took a ${o.rank}'s head at the ford`, fade: 1095 }],
      },
      lost: {
        fact: `The ${o.rank} cuts Li down in the shallows and moves on. Levy men drag the boy back to the bank, bleeding.`,
        journal: `I went for a Suiren ${o.rank} at the ford and he cut me down.`,
        grow: 0.5,
      },
    },
  };
}

/** The ford on an officer's raid day: Li chooses whether to go for him (a story choice). */
export function fordStory(n: number, day: number): StoryEvent {
  const o = OFFICERS[officerOf(n) ?? 'gocho'];
  return {
    id: `ford_${n}`, title: 'The ford', day, part: 'morning', tier: 'title', card: { label: 'Border raid', title: 'A banner at the ford' },
    text: `Bells at dawn: Suiren boats at the ford, more than usual. Behind the raiders walks ${o.name}.`,
    journal: `Suiren raiders came over the ford at dawn, led by a ${o.rank}.`,
    choice: {
      id: `ford_${n}`,
      options: [
        { label: `Go for the ${o.rank}`, test: 'VAL', risk: 'a real officer: Li can be badly wounded', duel: `officer_${n}` },
        { label: 'Hold your place in the line', duel: `skirmish_${n}` },
      ],
    },
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

/** Li serves in the Hagiwara levy (stepped forward in any year). */
export const inService = (s: GameState) => (s.flags.levy_service ?? 0) > 0 || s.flags.choice_levy === 3;
const isSlave = (s: GameState) => s.characters[s.liId].status === 'slave';
const knows = (s: GameState, k: string) => s.knowledge.includes(k) || (s.flags[k] ?? 0) > 0;

/** Step forward / stay: the same choice every year the levy is called. */
const levyOptions = (id: string) => ({
  id,
  options: [
    {
      label: 'Step forward: serve in the Hagiwara levy', test: 'VAL', risk: 'real fighting at the fords',
      outcome: {
        fact: 'Li steps forward. Rokubei writes it down without looking up. "Kurogane service," he says. "Their law counts what you do there. Remember that."',
        journal: 'I joined the Hagiwara levy as a bearer. In Kurogane service, what I do is counted.',
        grow: 0,
        flag: ['levy_service', 1] as [string, number],
        rel: [{ npc: 'raizen', field: 'respect' as const, value: 3, reason: 'Volunteered for the levy', fade: 1095 }],
      },
    },
    {
      label: 'Stay with the baggage',
      outcome: { fact: 'Li stays with the carts. Another boy goes in his place.', journal: 'I stayed with the baggage when the levy was called.', grow: 0 },
    },
  ],
});

/** The yearly contract: the three paid seasons end on Month 10, Day 1 and the Hagiwara renew (rumour: "never broken a contract"). */
function contractBeat(year: number): StoryEvent {
  const first = year === 100;
  return {
    id: `contract_${year}`, title: 'The contract', day: (year - 100) * 360 + 270, part: 'morning',
    text: first
      ? 'The three paid seasons are over. Lord Hagiwara Munenori rides down to the camp himself, counts out the band\'s pay on Rokubei\'s table and asks Raizen to stay another year. "The fords will need watching again come summer." Raizen drinks with him and says yes. The levy goes home for the winter; the names stay on the roll.'
      : `Autumn ends, and with it the season of raids. Lord Hagiwara renews the Red Crane's contract for Year ${year + 1}. The levy goes home for the winter.`,
    journal: `Year ${year}, autumn: the Hagiwara renewed the band's contract for another year.`,
  };
}

/** Later levy calls (Years 101+): a boy who stayed with the baggage gets the choice again. */
function levyRecall(year: number): StoryEvent {
  return {
    id: `levy_call_${year}`, title: 'The levy is called', day: (year - 100) * 360 + 90, part: 'morning',
    when: (s) => isSlave(s) && !inService(s),
    text: 'Summer again, and Suiren boats on the river again. The Hagiwara rider brings the same summons, and Rokubei reads out the same names. Li\'s is still on the list.',
    journal: `Year ${year}, summer: the Hagiwara levy was called again.`,
    choice: levyOptions(`levy_${year}`),
  };
}

/** Story beats of the slave arc that are not tied to one fixed day. */
export const ARC: StoryEvent[] = [
  {
    id: 'levy_call', title: 'The levy is called', day: 90, part: 'morning', tier: 'title', card: { label: 'Summer, Year 100', title: 'The levy is called' },
    text: 'A Hagiwara rider brings a summons: Suiren boats are probing the fords, and every lord along the Kurose must send men. Raizen, paid to guard the river, lends the Hagiwara his bearers for the summer. Rokubei reads out names. Li\'s is one of them, if he wants it.',
    journal: 'Year 100, summer: the Hagiwara levy was called. Raizen lends bearers to it.',
    choice: levyOptions('levy'),
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
  {
    id: 'freed_head', title: 'The officer\'s head', day: -1, part: 'evening', tier: 'legend',
    card: { label: 'Legend moment', title: 'Free', native: '自由', meaning: 'by an officer\'s head, under the merit law' },
    when: (s) => isSlave(s) && (s.flags.kogashira_head ?? 0) > 0,
    text: 'A Kurogane clerk comes down to the camp with the sergeant and a scroll. He reads the merit law aloud over the head of a Suiren Kogashira, and the band goes quiet. Rokubei opens the iron box, finds Li\'s paper and holds it over the brazier. "Kurogane pays your owner ten ryō," he says. "You belong to yourself now."',
    journal: 'Legend: for the head of a Suiren Kogashira, under the merit law of Kurogane, my paper burned. I am free.',
  },

  // Beats between raids (📝 proposal). Each waits for the director's quiet days after a fight (GE ch. 9).
  {
    id: 'daisuke_levy', title: 'Two in the line', day: -1, part: 'afternoon',
    when: (s) => inService(s) && knows(s, 'met_daisuke') && restDone(s),
    text: 'At the levy muster a big farm boy pushes in beside Li with a spear far too short for him. Daisuke. "If a mercenary\'s slave can stand in the line," he says to nobody in particular, "so can a farmer\'s son."',
    journal: 'Daisuke joined the levy too. He stands next to me in the line.',
    effect: { rel: [{ npc: 'daisuke', field: 'rivalry', value: 5, reason: 'Will not let a slave outdo him', fade: 1095 }, { npc: 'daisuke', field: 'respect', value: 3, reason: 'Stepped forward first', fade: 1095 }] },
  },
  {
    id: 'kaname_ford', title: 'A girl at the ford', day: -1, part: 'evening',
    when: (s) => meritInService(s) >= 2 && (s.flags.duel_raid_won ?? 0) > 0 && restDone(s),
    text: 'Kaname waits by the levy fires with a new naginata, its blade still bright from the smith. "The sergeant says girls don\'t stand in the line," she says. "So you tell me. How do the Suiren come across? High or low?" She listens to every word.',
    journal: 'Kaname came to the ford. The sergeant will not let her fight, so she asked me how the Suiren come across.',
    effect: { rel: [{ npc: 'kaname', field: 'trust', value: 4, reason: 'Told me how the Suiren fight', fade: 1095 }, { npc: 'kaname', field: 'affection', value: 3, reason: 'Talked with me as an equal', fade: 1095 }] },
  },
  {
    id: 'sayo_ford', title: 'The tally stick', day: -1, part: 'morning',
    when: (s) => meritInService(s) >= 4 && knows(s, 'met_sayo') && restDone(s),
    text: 'Hagiwara Sayo rides along the ford behind her father\'s steward and stops at the levy lines. She asks the sergeant to show her his tally stick, counts Li\'s notches with one finger, and looks at him for a long moment. "My father lost two thousand men last year. He would like a hundred more of you."',
    journal: 'Sayo came to the ford and counted my notches on the sergeant\'s tally stick.',
    effect: { rel: [{ npc: 'sayo', field: 'respect', value: 5, reason: 'Fights for my father\'s land', fade: 1095 }, { npc: 'sayo', field: 'affection', value: 2, reason: 'Curious about him', fade: 270 }] },
  },
  {
    id: 'hisame_ford', title: 'Breaths', day: -1, part: 'evening',
    when: (s) => meritInService(s) >= 8 && knows(s, 'hisame_knows_training') && restDone(s),
    text: 'Hisame stops beside Li at the fire, her bow unstrung. "You count notches," she says. "Count his breaths instead. A man breathes in before he strikes." She walks on.',
    journal: 'Hisame told me to count the enemy\'s breaths, not my notches: a man breathes in before he strikes.',
    effect: { knowledge: 'hisame_breaths', rel: [{ npc: 'hisame', field: 'respect', value: 3, reason: 'He listens', fade: 1095 }] },
  },
  {
    id: 'gonza_tally', title: 'Proud slaves', day: -1, part: 'evening',
    when: (s) => isSlave(s) && meritInService(s) >= 12 && restDone(s),
    text: 'Gonza blocks Li\'s way to the fire. "A few notches on a stick and the rat thinks he is a man," he says, loud, so the others hear. "Slaves who get free get proud. Proud men die young." Nobody laughs.',
    journal: 'Gonza mocked my notches in front of the band. Nobody laughed.',
    effect: {
      rel: [{ npc: 'gonza', field: 'rivalry', value: 6, reason: 'A slave climbing past him', fade: 1095 }],
      memory: { npc: 'gonza', what: 'The slave boy collects notches in the levy.', source: 'saw', certainty: 100, weight: 40 },
    },
  },
  {
    id: 'raizen_ford', title: 'Ten ryō', day: -1, part: 'evening',
    when: (s) => isSlave(s) && meritInService(s) >= 18 && restDone(s),
    text: 'Raizen sits down across the fire from Li, which he has never done. "More than half the notches their law asks for," he says. "A few more seasons like this and Kurogane pays me ten ryō for you. I paid eight." He drinks. "A good trade, boy. For both of us."',
    journal: 'Raizen sat at my fire. When my tally is full, Kurogane pays him ten ryō for me.',
    effect: { rel: [{ npc: 'raizen', field: 'respect', value: 5, reason: 'Half a tally at the ford', fade: 1095 }, { npc: 'raizen', field: 'trust', value: 3, reason: 'Half a tally at the ford', fade: 1095 }] },
  },
  {
    id: 'hachi_winter', title: 'Winter quarters', day: -1, part: 'evening',
    when: (s) => isSlave(s) && s.characters.hachi.alive && knows(s, 'story_contract_100') && restDone(s),
    text: 'Snow on the horse lines. Hachi sits close to Li for the warmth. "When you are free," he says, not looking at him, "will you still know me?"',
    journal: 'In winter quarters Hachi asked if I will still know him when I am free.',
    effect: { rel: [{ npc: 'hachi', field: 'affection', value: 3, reason: 'Still here', fade: 1095 }] },
  },
  {
    id: 'escape_talk', title: 'Beyond the Black Hills', day: -1, part: 'evening',
    when: (s) => isSlave(s) && knows(s, 'papers_in_iron_box') && (s.flags.lessons ?? 0) >= 15 && restDone(s),
    text: 'Sukezō rakes the ash flat and draws a line of hills in it. "East, over the Black Hills, is Tatara," he says. "Their king forbids slavery. A runaway who reaches the forges is nobody\'s property." He wipes the hills away. "The Red Crane\'s hunters are not slow, boy. And I am too old to run."',
    journal: 'Sukezō told me: east over the Black Hills is Tatara, where the king forbids slavery. Runaways are hunted.',
    effect: { knowledge: 'tatara_refuge' },
  },
  ...ARC_YEARS.map(contractBeat),
  ...ARC_YEARS.filter((y) => y > 100).map(levyRecall),
];

/** Relationship value (set by the engine to avoid an import cycle). */
let relField: (s: GameState, npc: string, f: 'trust' | 'respect') => number = () => 0;
export function setRelField(f: typeof relField) { relField = f; }
