import { Slide } from './content';
import { createWorld } from './data';
import { commitDrafts, storyDrafts } from './engine';
import { startGmGame } from './gm';
import { optionsText, shortDashboard } from './render';
import { Draft, GameState } from './types';

// The playable childhood (owner vision Oct 10; World Bible 10.1–10.2): the canon night of Year 95, Month 8, in five small
// choices. Choices colour the moment and Li's first journal lines, never the outcome: he goes back for the bundle, falls,
// is found by slavers on the pass road and says only "Li". Hand-written, offline, the same every time. Only what Li knows:
// the guide is "the man with the white rock", never his name or house.

export interface ChildOption {
  label: string;
  /** What happens, right after the choice. */
  text: string;
  /** Li's journal line, written at twelve, in his own voice. */
  journal: string;
  /** Knowledge key for the memory (the Game Master reads it). */
  key: string;
}

export interface ChildScene {
  id: string;
  label: string;
  text: string;
  quote?: string;
  ask: string;
  options: ChildOption[];
  /** What happens next whatever Li chose (the canon outcome). */
  then?: string;
  /** The option used when the player skips. */
  canon: number;
}

export const CHILDHOOD: ChildScene[] = [
  {
    id: 'lantern', label: 'Year 95 · Month 8 · Night',
    text: 'For many weeks they have walked north, by night when they can. A man in a travel-worn coat leads the way and never says where. On his shoulder, stitched in pale thread, is a white rock. Mother carries the lantern low, so the light stays on the path. Mei, ten, carries baby Kenjiko on her back. Li is seven. His feet stopped hurting long ago; now they only feel cold.',
    ask: 'Where does Li walk?',
    canon: 0,
    options: [
      {
        label: 'Close behind the man with the white rock', key: 'followed_the_white_rock',
        text: 'Li walks in the man\'s footprints. Once the man looks back and slows his pace, so the boy can keep up. Li stares at the white rock on his shoulder until he could draw it with his eyes closed.',
        journal: 'I remember the man who led us north. A white rock was stitched on his coat. He never told us his name.',
      },
      {
        label: 'Beside Mother, in the lantern light', key: 'walked_by_the_lantern',
        text: 'Li walks inside the little circle of light. Mother\'s free hand finds his and does not let go. Her fingers are as cold as his.',
        journal: 'I remember the lantern the night we fled, and my mother\'s cold hand holding mine.',
      },
      {
        label: 'Behind Mei, to catch her if she slips', key: 'guarded_his_sisters',
        text: 'Li walks right behind his sister. Twice her sandal slides on the ice, and twice his hands are on her back before she can fall. Mei does not thank him. She only nods, and the baby sleeps on.',
        journal: 'I remember Mei carrying Kenjiko up the mountain. I walked behind them, ready to catch them.',
      },
    ],
  },
  {
    id: 'name', label: 'A charcoal burner\'s hut · Dawn',
    text: 'At dawn they hide in an empty charcoal burner\'s hut. The man with the white rock keeps watch at the door. Mother kneels in front of Li and takes his face in both hands. Her eyes are red, but her voice is steady.',
    quote: '"Listen to me, Li. Never say the name Hattori. Not to anyone."',
    ask: 'What does Li say?',
    canon: 0,
    options: [
      {
        label: '"I promise."', key: 'promised_his_mother',
        text: '"I promise," Li says. Mother holds him so tightly that he cannot breathe, and he does not mind.',
        journal: 'My mother made me promise never to say our family name. I promised, and I have kept it.',
      },
      {
        label: '"Why?"', key: 'asked_his_mother_why',
        text: '"Why?" Li asks. Mother does not answer. She only holds his face a little longer, and waits, until he whispers, "I promise."',
        journal: 'I asked my mother why I must never say our name. She did not answer. I promised anyway, and I have kept it.',
      },
      {
        label: 'Nod, without a word', key: 'nodded_to_his_mother',
        text: 'Li nods. He does not trust his voice. Mother kisses his forehead and turns away before he can see her face.',
        journal: 'My mother told me never to say our family name. I only nodded. I have never said it since.',
      },
    ],
  },
  {
    id: 'storm', label: 'The high pass',
    text: 'Two nights later the snow comes, a month too early. The wind screams over the pass and the world goes white. The man with the white rock leads them on, step by step, one hand on the rock face. Then Li sees it: Mei\'s bundle has slipped from her shoulder. It lies in the snow behind them, already half buried. In it are the baby\'s blanket, the last of the rice, and the little wooden dragon Father carved for him. "For my Little Dragon," Father said, and laughed.',
    ask: 'Li goes back for it. How?',
    canon: 0,
    options: [
      {
        label: 'Run back without a word', key: 'went_back_alone',
        text: 'Li lets go of Mother\'s sleeve and runs back down the path. He will be quick. He will be back before anyone notices.',
        journal: 'In the storm on the pass I went back alone for the bundle. I told no one. I thought I would be quick.',
      },
      {
        label: 'Shout to Mother, then run', key: 'called_out_in_the_storm',
        text: '"Mother! The bundle!" Li shouts, and runs. The wind tears the words from his mouth and throws them away down the mountain. Nobody turns.',
        journal: 'On the pass I shouted to my mother that I was going back for the bundle. The wind took my voice. Nobody heard.',
      },
    ],
  },
  {
    id: 'slope', label: 'The edge of the path',
    text: 'The bundle has split open in the snow. The blanket flaps in the wind like a living thing. Rice lies scattered everywhere. The wooden dragon lies on its side at the very edge of the path, where the mountain falls away into white.',
    ask: 'What does Li grab first?',
    canon: 0,
    options: [
      {
        label: 'The wooden dragon', key: 'saved_the_wooden_dragon',
        text: 'Li throws himself at the dragon and closes his fist around it.',
        journal: 'When I fell on the pass I had my father\'s wooden dragon in my fist. I still have it.',
      },
      {
        label: 'The baby\'s blanket', key: 'saved_the_blanket',
        text: 'Li snatches the blanket first: Kenjiko will freeze without it. Then he reaches for the dragon.',
        journal: 'On the pass I went back for Kenjiko\'s blanket. I lost it when I fell. The wooden dragon I kept.',
      },
      {
        label: 'All of it, as fast as he can', key: 'saved_the_whole_bundle',
        text: 'Li scoops up rice, blanket and dragon all at once and hugs everything to his chest.',
        journal: 'On the pass I tried to save everything in the bundle. When I fell, only the wooden dragon stayed in my hand.',
      },
    ],
    then: 'The edge gives way under his knees. The snow slides, and Li slides with it, down and down into the white, until something strikes his head and there is nothing at all.',
  },
  {
    id: 'slavers', label: 'The pass road · Morning',
    text: 'Li wakes to voices. The storm is gone. He lies at the foot of a long slope beside a road, and a cart has stopped above him. Men in thick coats look down. One carries a coil of rope; two children sit tied in the back of the cart. There is no lantern, no mother, no man with a white rock. Only the dragon, still in his fist. While the men climb down, Li pushes it inside his loincloth, where no one will look.',
    quote: '"Still breathing," says the man with the rope. He lifts Li\'s chin with a stick. "Name?"',
    ask: 'What does Li answer?',
    canon: 0,
    options: [
      {
        label: 'Only "Li."', key: 'told_the_slavers_only_li',
        text: '"Li," he says. Nothing more. The man waits, then shrugs and cuts a mark on a wooden tag.',
        journal: 'The men who found me on the pass road asked my name. I told them Li. Only Li.',
      },
      {
        label: 'Nothing, for as long as he can', key: 'kept_silent_before_the_slavers',
        text: 'Li says nothing. The stick taps his cheek, harder each time. At last he whispers, "Li." It is the only name they will ever get.',
        journal: 'When the slavers asked my name I said nothing for a long time. Then only: Li.',
      },
      {
        label: 'Ask for his mother', key: 'asked_the_slavers_for_his_mother',
        text: '"Where is my mother?" The men laugh. "Name," the man says again. Li swallows. "Li."',
        journal: 'I asked the slavers for my mother. They laughed. I told them my name was Li, and nothing more.',
      },
    ],
  },
];

/** The time jump after the night (owner vision Oct 10): Year 100, Li is twelve, a slave of the Red Crane band. */
export const TIME_JUMP: Slide[] = [
  { label: 'Five years later', text: 'Li is twelve now: thin, quiet, small for his age, a slave of the Red Crane band of mercenaries. He has never said his family name. The wooden dragon is still hidden where no one looks.', mood: 'snow' },
  { label: 'Year 100 · Spring', text: 'A boy carries a load behind a red crane banner, toward Kōri fort.' },
];

/** The pick for every scene: the player's, or the canon one where he skipped (or sent something that is not an option). */
export function childhoodPicks(picks: readonly (number | undefined)[] = []): number[] {
  return CHILDHOOD.map((sc, i) => {
    const p = picks[i];
    return typeof p === 'number' && Number.isInteger(p) && p >= 0 && p < sc.options.length ? p : sc.canon;
  });
}

/** The night as events: one remembered moment per scene (journal line + knowledge key), and how the opening was seen. */
export function childhoodDrafts(picks: readonly (number | undefined)[] = [], skipped = false): Draft[] {
  const out: Draft[] = childhoodPicks(picks).map((p, i) => {
    const o = CHILDHOOD[i].options[p];
    return { type: 'knowledge', fact: `Li remembers the night on the pass: ${o.key.replace(/_/g, ' ')}`, visible: false, journal: o.journal, data: { key: o.key, scene: CHILDHOOD[i].id, pick: p } };
  });
  out.push({ type: 'flag', fact: skipped ? 'the opening was skipped (the canon night)' : 'the opening was played', visible: false, data: { key: 'opening_childhood', value: skipped ? 2 : 1 } });
  return out;
}

/**
 * A new life after the opening: the night's memories come first, then Game Master mode (Claude opens the story) or the
 * classic chronicle's first beats. Same picks, same life.
 */
export function beginLife(o: { gm: boolean; picks?: readonly (number | undefined)[]; skipped?: boolean; worldNumber?: number }): { state: GameState; text: string } {
  const s = o.gm ? startGmGame(o.worldNumber) : createWorld(o.worldNumber ?? 1);
  commitDrafts(s, childhoodDrafts(o.picks, o.skipped));
  if (o.gm) return { state: s, text: '' };
  const story = commitDrafts(s, storyDrafts(s));
  const intro = story.filter((e) => e.type === 'story').map((e) => e.fact).join('\n\n');
  return { state: s, text: `${intro}\n\n${shortDashboard(s)}\n\n${optionsText(s)}` };
}
