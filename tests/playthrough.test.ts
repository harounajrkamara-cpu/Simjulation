import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { beginLife } from '../engine/prologue';
import { handleInput } from '../engine/game';
import { careerOf } from '../engine/gm-career';
import { lastFightResult } from '../engine/gm';
import { pacingText } from '../engine/pacing';

// A long stretch played the way the real Game Master plays it (goal Oct 17: the owner could not yet play on claude.ai,
// so Claude, the same model the page calls, answered the real prompts). Every scene goes through gmTurn with every check
// (facts, fights, deaths, pacing, threats); the fight goes through the duel engine. Any refused scene fails the test.
type A = Record<string, unknown>;
const scenes: [string | undefined, A][] = [
  [undefined, { title: 'Who Taught You', scene: 'The Red Crane band reaches Kōri fort under a white sky; across the Kurose, Suiren banners snap on their poles. Four days of water, armour and latrines. Hachi keeps close; Old Sukezō feeds them from the bottom of the pot. On the fourth night Li works the old footwork behind the horse lines with two sticks, thinking no one watches. A lantern lifts. Mikumo Raizen stands there, weight on his good leg. "Who taught you to move like that?"', summary: 'Raizen catches Li at his footwork.', journal: 'Raizen saw my feet.', days: 4, part: 'night', changes: [{ kind: 'thread', id: 'footwork', text: 'Raizen wants to know who taught Li to move' }], suggestions: ['I say nobody taught me', 'I say nothing', 'I ask why he cares'], turns: 'Raizen has noticed Li' }],
  ['I say nobody taught me, I watch the soldiers drill', { title: 'A Lie in the Dark', scene: 'Li keeps his eyes on the frozen mud. "Nobody, master. I watch your men drill." Raizen studies him for a long breath. "Then you watch very well," he says. "Too well for a slave." He lowers the lantern. "Sleep. If I see the sticks again, you will tell me the truth, or you will tell Gonza." Li lies awake on the straw until the sky greys.', summary: 'Li lies to Raizen; Raizen half believes him.', journal: 'I lied to the Red Crane. He knew.', sleeps: true, changes: [{ kind: 'relation', npc: 'raizen', field: 'trust', delta: -3, reason: 'a lie he saw through' }, { kind: 'relation', npc: 'raizen', field: 'respect', delta: 4, reason: 'the footwork' }], suggestions: ['I keep my head down', 'I ask Sukezō about Raizen'], turns: 'Raizen distrusts and respects Li a little more' }],
  ['I keep my head down and train at night when I can', { scene: 'The days run cold. Li carries, scrubs and digs where Gonza can see him working, and on the darkest nights he works the sticks far behind the horse lines.', summary: 'Quiet days of work and secret training.', days: 6, routine: true, turns: '', changes: [{ kind: 'train', focus: 'two_swords', days: 6 }] }],
  ['I take the water to the horses', { title: 'The Strap', scene: 'At the trough Gonza is waiting, the strap loose in his fist and his one ear red with cold. "Slow again, dog\'s leavings." The camp goes quiet around the cook fire. Gonza draws back his arm, and the leather comes whistling low toward Li\'s knees.', summary: 'Gonza attacks Li at the trough.', fight: { foe: 'Gonza', rank: 'C', look: 'a big man with a strap, angry', deadly: false, spar: false }, suggestions: [], turns: 'Gonza attacks Li' }],
];
const after: A = { title: 'After the Strap', scene: 'When it is over the camp breathes again. Raizen stands at his tent flap with a cup in his hand and says nothing for a long moment. Then: "Gonza. The fodder count, now." Gonza coils the strap and goes, and his eyes promise that this is not finished. Old Sukezō puts a rag on Li\'s arm without a word.', summary: 'Raizen ends it; Gonza will remember.', journal: 'Gonza will not forget this.', part: 'evening', changes: [{ kind: 'clock', id: 'gonza_grudge', name: 'Gonza wants to break the boy', doom: 'Gonza catches Li alone: a fight the code runs', size: 4 }], suggestions: ['I stay near Sukezō', 'I go back to work'], turns: 'Gonza now hunts Li' };
const later: [string, A][] = [
  ['I step forward when the Hagiwara levy is called', { title: 'The Levy', scene: 'At the spring muster the Hagiwara sergeant reads the merit law aloud: any man, even a slave, who serves Kurogane well may go free. Li steps out of the slave line. Raizen watches, then nods to the sergeant. "Take him. He carries well."', summary: 'Li joins the Hagiwara levy.', journal: 'I stepped forward. I serve Kurogane now.', days: 20, changes: [{ kind: 'service', reason: 'Li steps forward at the muster; Raizen lets him go' }], suggestions: ['I drill with the levy'], turns: 'Li is in Kurogane service' }],
  ['I fight in the levy line at the ford', { title: 'The Standard', scene: 'Suiren spears come across the shallows at dawn. In the press Li sees the enemy standard dip, and he goes for it, ducking under a spear shaft, and comes back with it while the sergeant shouts his name.', summary: 'Li takes a Suiren standard at the ford.', journal: 'I took their standard. The sergeant saw.', days: 10, changes: [{ kind: 'deed', deed: 'standard', reason: 'Li took a Suiren standard; the sergeant saw it' }, { kind: 'reputation', group: 'soldiers', delta: 8, reason: 'the boy who took the standard' }], suggestions: ['I keep my place in the line'], turns: 'Li has earned merit' }],
  ['I keep my place in the line', { title: 'The Sergeant', scene: 'At the second crossing the sergeant goes down in the river with a spear through his thigh. Li drags him out by his collar through the red water while arrows hiss past.', summary: 'Li saves the sergeant.', journal: 'I pulled the sergeant out of the river.', days: 20, changes: [{ kind: 'deed', deed: 'saved_officer', reason: 'Li dragged the sergeant out; the levy saw it' }], suggestions: ['I wait for the reward ceremony'], turns: 'Li has more merit' }],
];

describe('a long stretch, played the way the Game Master plays it', () => {
  it('no scene is refused, the fight is the code\'s, and the slave walks the road toward freedom', async () => {
    const s = beginLife({ gm: true, skipped: true }).state;
    const play = async (said: string | undefined, a: A) => {
      const r = await gmTurn({ name: 'claude', ask: async () => JSON.stringify(a) }, s, said);
      expect(r.notes, `${said}: ${r.notes.join('; ')}`).toEqual([]);
      return r;
    };
    for (const [said, a] of scenes) await play(said, a);
    // The fight runs in the duel engine, simulated like the page's "Let the fight play out".
    expect(s.duel && !s.duel.over).toBe(true);
    handleInput(s, '5');
    expect(lastFightResult(s)).toBeTruthy();
    await play(undefined, after);
    expect(s.gm!.clocks!.some((c) => c.id === 'gonza_grudge' && c.open)).toBe(true);
    for (const [said, a] of later) await play(said, a);
    // Merit 30 in service: the merit law frees him.
    for (let k = 0; k < 2; k++) await play('I keep fighting in the levy', { scene: 'Another crossing, another fight in the shallows; Li holds his place and brings back a second standard.', summary: 'More merit.', days: 15, changes: [{ kind: 'deed', deed: 'standard', reason: 'a second standard taken; the sergeant saw it' }], suggestions: ['I keep my place'], turns: 'Li has more merit' });
    await play('I ask for the merit law', { title: 'Free', scene: 'Before the whole levy the Hagiwara officer reads Li\'s deeds from the tally stick and names the merit law. Rokubei brings the paper from the iron box and burns it in the cook fire.', summary: 'Li is freed by the merit law.', journal: 'My paper burned.', days: 1, changes: [{ kind: 'freedom', route: 'merit' }], suggestions: ['I stay with the levy as a free man'], turns: 'Li is free' });
    expect(s.characters[s.liId].status).toBe('free');
    expect(careerOf(s).merit.combat).toBeGreaterThanOrEqual(30);
    expect(pacingText(s)).toMatch(/THIS MOMENT/);
  });
});
