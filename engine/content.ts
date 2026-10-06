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

type Rel = { npc: string; field: RelField; value: number; reason: string; fade: number | null };
type Mem = { npc: string; what: string; source: 'saw' | 'told' | 'rumour'; certainty: number; weight: number; key?: string; rel?: { field: RelField; value: number }; sign?: string };

/** How a duel ends (World Bible ch. 6a, defeat ladder ch. 12b #10): text, journal, growth, merit and who remembers what. */
export interface DuelOutcome {
  fact: string;
  journal: string;
  /** Base growth for VAL and style (Numbers §2): duel won 1.0, lost but survived 0.5. 0 = none. */
  grow: number;
  /** Combat merit for a witnessed deed (Numbers §6). */
  merit?: { amount: number; why: string };
  /** Mon Li keeps (loot, a purse). */
  money?: number;
  flag?: [string, number];
  rel?: Rel[];
  memory?: Mem[];
  meet?: string[];
}

export interface DuelTemplate {
  id: string;
  place: string;
  intro: string;
  foe: { id: string; name: string; val: number; mastery: number; wound: 0 | 1 | 2 | 3; fatigue: number; estimate: string };
  prefs: { attack: number; counter: number; feint: number; observe: number };
  surprise: boolean;
  /** Worst wound this fight can leave (sparring with sticks: Hurt). */
  maxWound: 1 | 2 | 3;
  /** The immediate risk shown on "Run" (ch. 11). */
  fleeRisk: string;
  fleeText: string;
  yieldText: string;
  outcomes: Record<'won' | 'lost' | 'draw' | 'fled' | 'yielded', DuelOutcome>;
}

export const DUELS: Record<string, DuelTemplate> = {
  raid: {
    id: 'raid',
    place: 'Sasabe village, burning',
    intro: 'In the smoke behind a burning barn a Suiren raider has Kaname pinned against the wall. She has cut his thigh, but her naginata is broken. He has not seen Li. There is a dropped short sword in the mud at Li\'s feet.',
    foe: { id: 'suiren_levy', name: 'the Suiren raider', val: 22, mastery: 20, wound: 2, fatigue: 1, estimate: 'Suiren levy with a spear · Warrior E? · bleeding from the thigh' },
    prefs: { attack: 3, counter: 1, feint: 1, observe: 0 },
    surprise: true,
    maxWound: 3,
    fleeRisk: 'leaves Kaname alone',
    fleeText: 'Li drops the sword and runs into the smoke.',
    yieldText: 'Li throws down the sword and raises his hands.',
    outcomes: {
      won: {
        fact: 'The raider goes down in the mud and does not get up. Kaname stares at Li, chest heaving. Across the square, Hisame lowers her bow: she saw all of it.',
        journal: 'In the raid on Sasabe I brought down a Suiren raider who had Kaname trapped. Kaname and Hisame saw it.',
        grow: 1.0,
        merit: { amount: 1, why: 'witnessed kill of an enemy ashigaru' },
        rel: [
          { npc: 'kaname', field: 'respect', value: 15, reason: 'Saved me in the raid', fade: null },
          { npc: 'kaname', field: 'affection', value: 10, reason: 'Saved me in the raid', fade: null },
          { npc: 'kaname', field: 'trust', value: 10, reason: 'Saved me in the raid', fade: null },
          { npc: 'hisame', field: 'respect', value: 8, reason: 'Fought like a soldier at Sasabe', fade: 1095 },
          { npc: 'raizen', field: 'respect', value: 5, reason: 'Heard he brought down a raider', fade: 1095 },
        ],
        memory: [
          { npc: 'hisame', what: 'The slave boy brought down a Suiren raider [at Sasabe] [with a dropped sword].', source: 'saw', certainty: 100, weight: 60, key: 'li_raid_sasabe' },
          { npc: 'raizen', what: 'Hisame says the slave boy killed a Suiren raider [at Sasabe].', source: 'told', certainty: 80, weight: 50, key: 'li_raid_sasabe', rel: { field: 'respect', value: 8 }, sign: '{name} has heard what Li did at Sasabe.' },
        ],
        meet: ['kaname'],
      },
      lost: {
        fact: 'The spear takes Li in the side and the world tilts. As he falls, an arrow hums out of the smoke and the raider drops beside him. The last thing Li sees is Hisame lowering her bow.',
        journal: "In the raid on Sasabe a Suiren raider beat me. Hisame's arrow killed him before he could finish me.",
        grow: 0.5,
        rel: [
          { npc: 'kaname', field: 'affection', value: 6, reason: 'Tried to save me', fade: null },
          { npc: 'kaname', field: 'respect', value: 5, reason: 'Tried to save me', fade: null },
        ],
        memory: [{ npc: 'hisame', what: 'The slave boy attacked a raider to save the Sasabe girl. He lost, but he did not run.', source: 'saw', certainty: 100, weight: 50, key: 'li_raid_sasabe' }],
      },
      draw: {
        fact: 'Neither of them can finish it. An arrow from the smoke ends the fight: Hisame.',
        journal: 'In the raid on Sasabe I held off a raider until Hisame shot him.',
        grow: 0.5,
        rel: [{ npc: 'kaname', field: 'respect', value: 8, reason: 'Stood his ground', fade: null }],
      },
      fled: {
        fact: 'Behind him Kaname screams, then curses. Later Li hears that Hisame\'s arrow saved her. Kaname will not look at him.',
        journal: 'In the raid on Sasabe I ran. Hisame saved Kaname, not me.',
        grow: 0,
        rel: [
          { npc: 'kaname', field: 'respect', value: -15, reason: 'Ran when I needed help', fade: 270 },
          { npc: 'kaname', field: 'affection', value: -15, reason: 'Ran when I needed help', fade: 270 },
        ],
        memory: [{ npc: 'kaname', what: 'The mercenaries\' slave boy ran when a raider had Kaname trapped [in the burning barn].', source: 'saw', certainty: 100, weight: 60, key: 'li_ran_at_sasabe', rel: { field: 'respect', value: -10 }, sign: '{name} has heard that Li ran at Sasabe.' }],
      },
      yielded: {
        fact: 'The raider laughs and kicks Li down. Then Hisame\'s arrow takes him in the throat.',
        journal: 'In the raid on Sasabe I gave up. Hisame killed the raider.',
        grow: 0,
        rel: [{ npc: 'kaname', field: 'respect', value: -8, reason: 'Gave up', fade: 270 }],
      },
    },
  },
  // Game Experience ch. 8 (owner decision 2): a low-stakes stick bout that teaches the duel screen before the raid.
  spar: {
    id: 'spar',
    place: 'the threshing floor at Sasabe',
    intro: 'Daisuke tosses Li a stick and takes another. "Mercenaries\' slave. Show me what you learned carrying their spears." The village boys make a ring. Kaname watches from the well, arms crossed.',
    foe: { id: 'daisuke_spar', name: 'Daisuke', val: 20, mastery: 10, wound: 0, fatigue: 0, estimate: 'strong farm boy with a stick · Warrior E? · swings hard' },
    prefs: { attack: 4, counter: 0, feint: 1, observe: 0 },
    surprise: false,
    maxWound: 1,
    fleeRisk: 'the village boys will laugh',
    fleeText: 'Li drops the stick and walks out of the ring.',
    yieldText: 'Li lowers the stick and steps back.',
    outcomes: {
      won: {
        fact: 'Daisuke lands on his back in the chaff. The ring goes quiet. Then he laughs, red in the face, and takes Li\'s hand to get up. "Again, next time," he says.',
        journal: 'I beat Daisuke with sticks at Sasabe in front of the village boys. He wants a rematch.',
        grow: 1.0,
        rel: [
          { npc: 'daisuke', field: 'respect', value: 10, reason: 'Beat me fairly in front of others', fade: null },
          { npc: 'daisuke', field: 'rivalry', value: 10, reason: 'Beat me fairly in front of others', fade: null },
          { npc: 'kaname', field: 'respect', value: 5, reason: 'Beat Daisuke with a stick', fade: 270 },
        ],
      },
      lost: {
        fact: 'Daisuke\'s stick cracks across Li\'s ribs and he goes down in the chaff. The boys cheer. Daisuke grins down at him. "Not bad. For a slave."',
        journal: 'Daisuke beat me with sticks at Sasabe. Not bad, he said. For a slave.',
        grow: 0.5,
        rel: [{ npc: 'daisuke', field: 'respect', value: 3, reason: 'Did not run from a fight', fade: 270 }],
      },
      draw: {
        fact: 'Neither boy gives way until both are gasping. An old man shouts that the rice will not carry itself, and the ring breaks up.',
        journal: 'Daisuke and I fought with sticks until we could barely stand. Nobody won.',
        grow: 0.5,
        rel: [{ npc: 'daisuke', field: 'respect', value: 6, reason: 'Held his own', fade: 270 }],
      },
      fled: {
        fact: 'The boys hoot as Li walks away. Daisuke shouts after him that slaves were born to run.',
        journal: 'I walked away from Daisuke\'s stick fight. The boys laughed.',
        grow: 0,
        rel: [{ npc: 'daisuke', field: 'respect', value: -6, reason: 'Walked away', fade: 270 }],
      },
      yielded: {
        fact: 'Daisuke snorts and throws his stick down. "No fun," he says.',
        journal: 'I gave up in Daisuke\'s stick fight.',
        grow: 0,
        rel: [{ npc: 'daisuke', field: 'respect', value: -3, reason: 'Gave up', fade: 270 }],
      },
    },
  },
};

export interface StoryEvent {
  id: string;
  /** Scene header title (GE ch. 6). */
  title: string;
  day: number; // day index (Year 100, Month 1, Day 1 = 0); -1 = no fixed day (uses `when`)
  part: 'morning' | 'afternoon' | 'evening' | 'night';
  text: string;
  journal: string;
  meet?: string[];
  duel?: string;
  /** Moment tier (GE ch. 3b): title moments get a title card, legend moments the legend screen. */
  tier?: 'title' | 'legend';
  /** Big brush title shown on the card (defaults to the scene title). */
  card?: { label: string; title: string; native?: string; meaning?: string; witnesses?: string };
  /** A beat without a fixed day: fires at its part of the first day this holds (checked by the engine). */
  when?: (s: import('./types').GameState) => boolean;
  /** A choice this moment offers (shown first; it lapses when this part of the day ends). */
  choice?: { id: string; options: StoryOption[] };
  /** What the moment changes (relations, knowledge, memories). */
  effect?: Effect;
}

export interface StoryOption {
  label: string;
  test?: string;
  risk?: string;
  /** Starts this duel instead of an outcome. */
  duel?: string;
  outcome?: DuelOutcome & { skill?: [string, number] };
}

export const STORY: StoryEvent[] = [
  {
    id: 'arrival', title: "Under Kōri fort", day: 0, part: 'morning',
    text: 'The Red Crane band reaches Kōri fort in Akaishi province, on the Kurogane side of the Kurose river. Lord Hagiwara has hired the band after losing two thousand men last year. Across the river, Suiren banners hang still in the cold spring air.',
    journal: 'Year 100, spring. We reached Kōri fort on the Kurose. Across the river: Suiren banners.',
  },
  {
    id: 'chest', title: "Gonza's chest", day: 0, part: 'morning',
    text: 'Gonza drops an iron-bound chest on Hachi\'s thin shoulders. "Carry it to the fort, mouse." Hachi staggers under it.',
    journal: 'On the first day Gonza loaded Hachi like a mule.',
    choice: {
      id: 'chest',
      options: [
        {
          label: 'Take the chest from Hachi', test: 'endurance', risk: 'Gonza will notice',
          outcome: {
            fact: 'Li slides under the chest and takes the weight. Hachi stares at him. Gonza\'s face goes red to the ear he still has, but he only spits in the dirt.',
            journal: 'I carried the chest for Hachi. Gonza saw it.',
            grow: 0,
            skill: ['endurance', 0.2],
            rel: [
              { npc: 'hachi', field: 'affection', value: 5, reason: 'Took my load from Gonza', fade: 1095 },
              { npc: 'hachi', field: 'trust', value: 4, reason: 'Took my load from Gonza', fade: 1095 },
              { npc: 'gonza', field: 'rivalry', value: 3, reason: 'A slave who crossed me', fade: 270 },
            ],
            memory: [{ npc: 'gonza', what: 'The slave boy took the load I gave the other one.', source: 'saw', certainty: 100, weight: 30, key: 'li_defied_gonza' }],
          },
        },
        {
          label: 'Look away and keep quiet',
          outcome: {
            fact: 'Li looks at the ground. Hachi carries the chest alone, knees shaking, all the way up to the fort.',
            journal: 'I kept my head down while Hachi carried the chest.',
            grow: 0,
            rel: [{ npc: 'hachi', field: 'affection', value: -2, reason: 'Let me carry it alone', fade: 60 }],
          },
        },
      ],
    },
  },
  {
    id: 'cook_tent', title: 'The cook tent', day: 0, part: 'afternoon',
    text: 'Old Sukezō waves Li into the cook tent. Steam, smoke, onions. "New fort, new masters, same onions," the old man says. "Ask, if you want to know something. In here the walls listen less."',
    journal: 'Sukezō says I can ask him things in the cook tent.',
  },
  {
    id: 'first_night', title: 'The first night', day: 0, part: 'night',
    text: 'The band sleeps by the horse lines under a cold sky. Under the straw, where Li hid them, two sticks wait. Somewhere a guard coughs.',
    journal: 'First night at Kōri. My sticks are hidden under the straw.',
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
    id: 'wait_lesson', title: 'Days alike', day: 6, part: 'evening',
    text: 'Sukezō stirs the pot without looking up. "Camp days are all alike, boy. Plan them, and keep your strength for the days that are not."',
    journal: 'Sukezō says to plan the days that are alike, and to save my strength for the ones that are not.',
  },
  {
    id: 'spar', title: 'Sticks at Sasabe', day: 19, part: 'afternoon', tier: 'title', card: { label: 'A challenge', title: 'Sticks at Sasabe' },
    text: 'Rokubei sends Li to Sasabe with the empty rice sacks. On the threshing floor Daisuke blocks the way, a stick in each hand, and grins.',
    journal: 'Daisuke stopped me at Sasabe with two sticks.',
    choice: {
      id: 'spar',
      options: [
        { label: 'Take a stick and fight him', test: 'VAL', risk: 'bruises, and the boys are watching', duel: 'spar' },
        {
          label: 'Walk past him',
          outcome: {
            fact: 'Li walks past with the sacks. Daisuke laughs at his back and the village boys laugh with him.',
            journal: 'I walked past Daisuke\'s challenge. They laughed.',
            grow: 0,
            rel: [{ npc: 'daisuke', field: 'respect', value: -4, reason: 'Would not fight me', fade: 270 }],
          },
        },
      ],
    },
  },
  {
    id: 'raid', title: "Fire on the river", tier: 'title', card: { label: 'Month 2 · Night', title: 'Fire on the river' }, day: 35, part: 'night',
    text: 'Bells in the dark. Fire on the river: Suiren raiders have crossed the Kurose and hit Sasabe. Raizen\'s band runs for the village; Li runs behind with a bundle of arrows. Sasabe is smoke, screams and burning thatch.',
    journal: 'Month 2, night: Suiren raiders crossed the Kurose and attacked Sasabe. The band ran to help.',
    duel: 'raid',
  },
  {
    // GE ch. 3b legend moment: the first nickname, earned by a witnessed deed and given by the world (owner ✅).
    // Waits for the deed, for word to spread, and for the director's quiet days after the raid (GE ch. 9).
    id: 'nickname', title: 'A name at the fire', day: -1, part: 'evening', tier: 'legend',
    card: { label: 'Legend moment', title: 'Kurose no Ryū', native: '黒瀬の龍', meaning: 'the Dragon of the Kurose' },
    when: (s) => (s.flags.duel_raid_won ?? 0) > 0
      && s.memories.filter((m) => m.key === 'li_raid_sasabe').length >= 3
      && restDoneFor(s),
    text: 'Across the fire, a Red Crane spearman lifts his cup toward Li. He does not say the boy\'s name. He says the other one, the one the camp has been whispering since the night at Sasabe. "Kurose no Ryū." Others take it up, half laughing, half not. Hachi grins so wide his face could split.',
    journal: 'Legend: at the fire, the band called me Kurose no Ryū, the Dragon of the Kurose, for the raider at Sasabe.',
  },
];

/** Set by the engine: the director's "rest done" check (kept out of content to avoid an import cycle). */
let restDoneFor: (s: import('./types').GameState) => boolean = () => true;
export function setRestCheck(f: (s: import('./types').GameState) => boolean) { restDoneFor = f; }

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
  { id: 'contract_renewed', title: 'A year at a time', text: 'Each autumn, when the raiding season ends, Lord Hagiwara renews the band\'s contract for another year.', needs: 'story_contract_100' },
  { id: 'levy', title: 'The Hagiwara levy', text: 'Men called up for the summer to hold the fords of the Kurose. In the levy a slave is in Kurogane service, and his deeds count under the merit law.', needs: 'story_levy_call' },
  { id: 'tatara', title: 'Tatara, the Smiths\' Kingdom', text: 'East over the Black Hills. Its king forbids slavery: a runaway who reaches it is nobody\'s property.', needs: 'tatara_refuge' },
  { id: 'hagiwara', title: 'The Hagiwara', text: 'The border lords of Akaishi. They lost two thousand men last year and hired the band.' },
  { id: 'kori', title: 'Kōri fort', text: 'A border fort in Akaishi province, held by Commander Ishizue Gonroku. The band camps below its walls.', needs: 'story_inspection' },
  { id: 'sasabe', title: 'Sasabe', text: 'A village near the camp. Its people bring rice to the band.', needs: 'story_sasabe_rice' },
  { id: 'merit_law', title: 'The merit law', text: 'In Kurogane, a slave who takes an enemy officer\'s head in the kingdom\'s army walks free, and the kingdom pays the owner.', needs: 'kurogane_merit_law' },
  { id: 'price', title: 'Li\'s price', text: 'Rokubei says fifteen ryō. Raizen paid eight for him.', needs: 'own_price_15' },
  { id: 'papers', title: 'The slave papers', text: 'Every slave\'s name and price, kept in Rokubei\'s iron box.', needs: 'papers_in_iron_box' },
];

/** Prologue (Game Experience ch. 8): 7 hand-written ink slides, the same every time. Only what Li knows (WB 10.2). */
export const PROLOGUE: { label: string; text: string; quote?: string }[] = [
  { label: 'Four hundred years', text: 'For four hundred years, one Empire ruled the land from Amatsu-kyō.' },
  { label: 'Year 0', text: 'Two princes, two crowns, one city on fire. The Burning.' },
  { label: 'Seven crowns', text: 'Seven Wardens crowned themselves. Seven kingdoms.' },
  { label: 'A hundred years', text: 'A hundred years of war. On the Kurose river, banners face each other across the water.' },
  { label: 'A memory', text: 'Two swords crossed on a wall. A man\'s laugh.', quote: '"Little Dragon."' },
  { label: 'A memory', text: 'Snow. A lantern burning in the dark. A coat with a white rock stitched on the shoulder, walking ahead.', quote: '"Never say that name, Li. Not to anyone."' },
  { label: 'Year 100 · Spring', text: 'A boy carries a load behind a red crane banner, toward Kōri fort.' },
];
