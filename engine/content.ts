import { RelField } from './types';

// Stage 1 content: conversation beats, story calendar and rumours.
// Everything here is data; the engine decides when it fires (fixed rules, no dice).

export interface Effect {
  knowledge?: string;
  flag?: [string, number];
  rel?: { npc: string; field: RelField; value: number; reason: string; fade: number | null }[];
  style?: { style: string; amount: number };
  memory?: { npc: string; what: string; source: 'saw' | 'told' | 'rumour'; certainty: number; weight: number; key?: string };
}

export interface Beat {
  id: string;
  npc: string;
  /** Minimum summary opinion of Li needed to hear this. */
  minOpinion: number;
  /** Flags that must be set (value ≥ given number). */
  needs?: [string, number][];
  text: string;
  journal?: string;
  effect?: Effect;
}

/** In each NPC's list, the first beat not yet heard whose conditions hold is used. */
export const BEATS: Beat[] = [
  // Raizen
  { id: 'r1', npc: 'raizen', minOpinion: -100, text: 'Raizen does not look up from his sake. "Carry the water, boy. Talk is for men who have earned it."' },
  { id: 'r2', npc: 'raizen', minOpinion: -20, needs: [['watched_drill', 3]], text: 'Raizen\'s eyes find Li. "You watch the drills. Watching is not doing. Remember that."', journal: 'Raizen knows I watch the drills.', effect: { knowledge: 'raizen_noticed_watching', rel: [{ npc: 'raizen', field: 'respect', value: 3, reason: 'Keeps his eyes open', fade: 270 }] } },
  { id: 'r3', npc: 'raizen', minOpinion: -10, text: '"The Hagiwara pay us for three seasons," Raizen says. "Keep your head down and you will eat all three."', journal: 'The Hagiwara have hired the band for three seasons.', effect: { knowledge: 'contract_three_seasons' } },
  { id: 'r4', npc: 'raizen', minOpinion: 5, text: 'Raizen looks across the Kurose for a long time. "I fought on that river once," he says. "On the other side." He says nothing more.', journal: 'Raizen once fought on the Suiren side of the Kurose.', effect: { knowledge: 'raizen_served_suiren' } },

  // Gonza
  { id: 'g1', npc: 'gonza', minOpinion: -100, text: '"What are you staring at, rat?" Gonza spits at Li\'s feet.', effect: { rel: [{ npc: 'gonza', field: 'affection', value: -2, reason: 'Bothered me', fade: 60 }] } },
  { id: 'g2', npc: 'gonza', minOpinion: -100, needs: [['g1_done', 1]], text: 'Gonza grumbles about his pay to nobody in particular. "Twice a month the coin comes, and twice a month it\'s gone by morning."', journal: 'Gonza drinks away his pay on paydays (day 1 and 16).', effect: { knowledge: 'gonza_drinks_on_payday' } },

  // Rokubei
  { id: 'k1', npc: 'rokubei', minOpinion: -100, text: 'Rokubei taps the iron box where the papers are kept. "Your price? Fifteen ryō. Raizen paid eight for you. Don\'t make me laugh."', journal: 'My freedom costs 15 ryō. Raizen paid 8 for me.', effect: { knowledge: 'own_price_15' } },
  { id: 'k2', npc: 'rokubei', minOpinion: 0, text: '"Kurogane law is strange," Rokubei mutters over his ledger. "Over here a slave who takes an enemy officer\'s head in their army walks free. They even pay the owner."', journal: 'In Kurogane, a slave who takes an enemy officer\'s head in their army is freed.', effect: { knowledge: 'kurogane_merit_law' } },

  // Hisame
  { id: 'i1', npc: 'hisame', minOpinion: -100, text: 'Hisame looks at Li, then back at her bowstring. She says nothing.' },
  { id: 'i2', npc: 'hisame', minOpinion: 10, needs: [['trained_nights', 3]], text: 'Hisame speaks without looking up. "At night you hold the sticks wrong. Left foot back. Weight low." Then she is silent again.', journal: 'Hisame has seen me training at night. She told me: left foot back, weight low.', effect: { knowledge: 'hisame_knows_training', style: { style: 'two_swords', amount: 0.5 }, memory: { npc: 'hisame', what: 'The boy trains with two sticks at night.', source: 'saw', certainty: 100, weight: 40, key: 'li_trains_at_night' } } },
  { id: 'i3', npc: 'hisame', minOpinion: 20, needs: [['hisame_knows_training', 1]], text: '"Gonza walks the camp every fourth night," Hisame says quietly. "Pick other nights."', journal: 'Gonza patrols the camp every fourth night.', effect: { knowledge: 'gonza_patrol' } },

  // Sukezō
  { id: 's1', npc: 'sukezo', minOpinion: -100, text: 'Old Sukezō smiles and hands Li a cup of broth. "Come in the evening. We will do more letters."', effect: { flag: ['lessons_open', 1] } },
  { id: 's2', npc: 'sukezo', minOpinion: 30, needs: [['lessons', 5]], text: 'Sukezō studies Li\'s hands while he writes. "Too quick for a cook\'s boy," he says softly. "Be careful who sees."', journal: 'Sukezō says my hands are too quick for a cook\'s boy.' },
  { id: 's3', npc: 'sukezo', minOpinion: 40, needs: [['lessons', 10]], text: 'Sukezō lowers his voice. "Rokubei keeps the papers in the iron box. Every slave\'s name and price is written there. Papers can burn, boy. But a runaway is hunted."', journal: 'The slave papers are in Rokubei\'s iron box.', effect: { knowledge: 'papers_in_iron_box' } },

  // Hachi
  { id: 'h1', npc: 'hachi', minOpinion: -100, text: 'Hachi grins and splits his rice ball with Li without being asked.', effect: { rel: [{ npc: 'hachi', field: 'affection', value: 2, reason: 'Shared food', fade: 1095 }] } },
  { id: 'h2', npc: 'hachi', minOpinion: 40, text: 'Hachi tells Li, very quietly, that his father sold him in Ushio to pay a debt. "He said he would come back for me."', journal: 'Hachi\'s father sold him in Ushio for a debt.', effect: { knowledge: 'hachi_story' } },
  { id: 'h3', npc: 'hachi', minOpinion: 50, needs: [['hachi_story', 1]], text: '"If you ever run," Hachi whispers, "take me with you. Promise?"', journal: 'Hachi asked me to take him with me if I ever run.', effect: { flag: ['hachi_asked_promise', 1] } },

  // Sayo
  { id: 'y1', npc: 'sayo', minOpinion: -100, text: 'Hagiwara Sayo looks down at Li from her horse. "You are the Red Crane\'s boy? You look too small to carry all that."', effect: { rel: [{ npc: 'sayo', field: 'affection', value: 2, reason: 'Curious about him', fade: 270 }] } },

  // Kaname & Daisuke
  { id: 'n1', npc: 'kaname', minOpinion: -100, text: 'Kaname eyes Li. "Slaves of mercenaries. My father says you steal chickens." She lifts her chin. "Do you?"' },
  { id: 'd1', npc: 'daisuke', minOpinion: -100, text: 'Daisuke drops a rice sack at Li\'s feet. "Carry that, little slave. Let\'s see if you\'re good for anything."', effect: { rel: [{ npc: 'daisuke', field: 'rivalry', value: 5, reason: 'Sized him up', fade: 270 }] } },

  // Ishizue
  { id: 'z1', npc: 'ishizue', minOpinion: -100, text: 'Commander Ishizue does not answer slaves. A guard pushes Li back.' },
];

export interface DuelTemplate {
  id: string;
  place: string;
  intro: string;
  foe: { id: string; name: string; val: number; mastery: number; wound: 0 | 1 | 2 | 3; fatigue: number; estimate: string };
  prefs: { attack: number; counter: number; feint: number; observe: number };
  surprise: boolean;
}

export const DUELS: Record<string, DuelTemplate> = {
  raid: {
    id: 'raid',
    place: 'Sasabe village, burning',
    intro: 'In the smoke behind a burning barn a Suiren raider has Kaname pinned against the wall. She has cut his thigh, but her naginata is broken. He has not seen Li. There is a dropped short sword in the mud at Li\'s feet.',
    foe: { id: 'suiren_levy', name: 'the Suiren raider', val: 22, mastery: 20, wound: 2, fatigue: 1, estimate: 'Suiren levy with a spear · Warrior E? · bleeding from the thigh' },
    prefs: { attack: 3, counter: 1, feint: 1, observe: 0 },
    surprise: true,
  },
};

export interface StoryEvent {
  id: string;
  /** Scene header title (GE ch. 6). */
  title: string;
  day: number; // day index (Year 100, Month 1, Day 1 = 0)
  part: 'morning' | 'afternoon' | 'evening' | 'night';
  text: string;
  journal: string;
  meet?: string[];
  duel?: string;
}

export const STORY: StoryEvent[] = [
  {
    id: 'arrival', title: "Under Kōri fort", day: 0, part: 'morning',
    text: 'The Red Crane band reaches Kōri fort in Akaishi province, on the Kurogane side of the Kurose river. Lord Hagiwara has hired the band after losing two thousand men last year. Across the river, Suiren banners hang still in the cold spring air.',
    journal: 'Year 100, spring. We reached Kōri fort on the Kurose. Across the river: Suiren banners.',
  },
  {
    id: 'inspection', title: "Paid dogs", day: 1, part: 'afternoon',
    text: 'Commander Ishizue Gonroku of Kōri fort inspects the band. He spits in the dirt in front of Raizen. "Paid dogs," he says, loud enough for everyone. Raizen only smiles.',
    journal: 'Commander Ishizue of Kōri fort hates mercenaries. He spat in front of Raizen.',
    meet: ['ishizue'],
  },
  {
    id: 'sasabe_rice', title: "Rice from Sasabe", day: 4, part: 'evening',
    text: 'Villagers from Sasabe bring rice to the camp. A fierce girl with a naginata on her back watches the mercenaries with open contempt, and a big farm boy carries two sacks at once to show off.',
    journal: 'Met two youths from Sasabe: Kaname, a girl with a naginata, and Daisuke, a strong farm boy.',
    meet: ['kaname', 'daisuke'],
  },
  {
    id: 'sayo_visit', title: "The lord's daughter", day: 9, part: 'morning',
    text: 'A small party rides into the camp: the Hagiwara steward and a girl of about thirteen in a fine riding coat, Lord Hagiwara\'s daughter Sayo. She asks more questions than the steward likes.',
    journal: 'Lord Hagiwara\'s daughter Sayo visited the camp. She asks a lot of questions.',
    meet: ['sayo'],
  },
  {
    id: 'raid', title: "Fire on the river", day: 35, part: 'night',
    text: 'Bells in the dark. Fire on the river: Suiren raiders have crossed the Kurose and hit Sasabe. Raizen\'s band runs for the village; Li runs behind with a bundle of arrows. Sasabe is smoke, screams and burning thatch.',
    journal: 'Month 2, night: Suiren raiders crossed the Kurose and attacked Sasabe. The band ran to help.',
    duel: 'raid',
  },
];

/** Rumours heard around the fire (Atlas §14), in fixed order. */
export const RUMOURS: string[] = [
  '"The young king turns twenty next year. The Chancellor won\'t like that."',
  '"Suiren raiders burned two villages across the Kurose last autumn."',
  '"They say the canal will make the plain green. Others say it will empty the treasury."',
  '"The Red Crane has never broken a contract."',
  '"A northern prince who once lived in Seikyō as a hostage swore he\'d come back."',
];

/** Encyclopedia (GE ch. 3): only what Li has learned. An entry shows when its flag or knowledge is set (or always). */
export interface Entry { id: string; title: string; text: string; needs?: string }

export const ENCYCLOPEDIA: Entry[] = [
  { id: 'kurogane', title: 'Kurogane, the Iron West', text: 'The kingdom where the Red Crane band now serves. Its law is hard and its army is large.' },
  { id: 'kurose', title: 'The Kurose', text: 'The river border between Kurogane and Suiren at Akaishi. Suiren banners hang on the far bank.' },
  { id: 'suiren', title: 'Suiren, the Southern Giant', text: 'The biggest and richest kingdom, south across the Kurose. Li\'s family came from there: a land of lakes and a big city.', needs: 'came_from_suiren' },
  { id: 'red_crane', title: 'The Red Crane band', text: 'About 120 hired swords led by the rōnin Mikumo Raizen, "the Red Crane". Li is their slave.' },
  { id: 'contract', title: 'The Hagiwara contract', text: 'The Hagiwara pay the band for three seasons.', needs: 'contract_three_seasons' },
  { id: 'hagiwara', title: 'The Hagiwara', text: 'The border lords of Akaishi. They lost two thousand men last year and hired the band.' },
  { id: 'kori', title: 'Kōri fort', text: 'A border fort in Akaishi province, held by Commander Ishizue Gonroku. The band camps below its walls.', needs: 'story_inspection' },
  { id: 'sasabe', title: 'Sasabe', text: 'A village near the camp. Its people bring rice to the band.', needs: 'story_sasabe_rice' },
  { id: 'merit_law', title: 'The merit law', text: 'In Kurogane, a slave who takes an enemy officer\'s head in the kingdom\'s army walks free, and the kingdom pays the owner.', needs: 'kurogane_merit_law' },
  { id: 'price', title: 'Li\'s price', text: 'Rokubei says fifteen ryō. Raizen paid eight for him.', needs: 'own_price_15' },
  { id: 'papers', title: 'The slave papers', text: 'Every slave\'s name and price, kept in Rokubei\'s iron box.', needs: 'papers_in_iron_box' },
];
