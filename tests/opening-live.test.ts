import { expect, it } from 'vitest';
// Oct 16 night: the live page refused every opening. Claude answered the real opening prompt this way; all must pass.
import { gmTurn } from '../ai/gm';
import { beginLife } from '../engine/prologue';
const answers = [
  { title: 'Who Taught You', scene: "The Red Crane band reaches Kōri fort under a white sky. Across the Kurose, Suiren banners snap on their poles. For four days Li hauls water until his hands split, scrubs armour with sand, and keeps Hachi on the far side of every cart when Gonza's fists come looking for someone. Old Sukezō feeds them both from the bottom of the pot, where the barley is thickest.\n\nOn the fourth night, when the camp sleeps, Li slips behind the horse lines with two sticks. Step, turn, the low cross-step his feet seem to remember from before the pass. The horses shift. A lantern lifts out of the dark.\n\nMikumo Raizen stands there, weight on his good leg, the light cutting his face in half. He watches the sticks, then the boy's feet.\n\n\"Who taught you to move like that?\"\n\nHis voice is flat. It is the voice he uses before he decides something.", summary: "At Kōri, Raizen catches Li practising footwork behind the horse lines at night and asks who taught him.", journal: "Raizen saw my feet. I do not know what he saw in them.", days: 4, part: 'night', changes: [{ kind: 'thread', id: 'footwork', text: 'Raizen wants to know who taught Li to move', open: true }, { kind: 'relation', npc: 'raizen', field: 'respect', delta: 3, reason: 'saw the footwork' }], suggestions: ['I say nobody taught me; I just watch the soldiers', 'I say nothing and lower the sticks', 'I tell him a man on the road showed me, long ago', 'I ask why it matters to him'], turns: 'Raizen has noticed Li' },
  { title: 'The Lantern', scene: "Kōri fort squats above the Kurose like a fist. The first days pass in cold and work: water, armour, latrines. Gonza's fists find the slaves who are slow, and Li learns to never be slow. Eleven-year-old Hachi sticks to his side. Behind the horse lines, after dark, Li works the old footwork with two sticks.\n\nA lantern. Raizen. \"Who taught you to move like that?\"", summary: 'Raizen sees Li train.', journal: 'He saw me.', days: 3, part: 'night', changes: [], suggestions: ['I lie', 'I stay silent'] },
  { scene: "Li, the slave boy of the Red Crane band, stands frozen in the lantern light behind the horse lines. Raizen limps closer. \"Who taught you to move like that?\"", summary: 'Raizen asks.', days: 5, part: 'night', suggestions: ['I lie', 'I say nothing'] },
];
it('openings written the way Claude writes them (titles like "Who Taught You" included) are never refused', async () => {
  for (const a of answers) {
    const s = beginLife({ gm: true, skipped: true }).state;
    try { const r = await gmTurn({ name: 'me', ask: async () => JSON.stringify(a) }, s); expect(r.turn.scene).toMatch(/Who taught you/); }
    catch (e) { throw new Error(`opening refused: ${(e as Error).message}`); }
  }
});

it('"you" in single-quoted dialogue or *italic thoughts* is not story prose', async () => {
  const { checkGmScene } = await import('../engine/factcheck');
  const s = beginLife({ gm: true, skipped: true }).state;
  expect(checkGmScene(s, "Raizen lowers the lantern. ‘Who taught you to move like that?’").map((p) => p.kind)).not.toContain('person');
  expect(checkGmScene(s, 'Li grips the sticks. *You fool, he saw you.*').map((p) => p.kind)).not.toContain('person');
  expect(checkGmScene(s, 'You grip the sticks.').map((p) => p.kind)).toContain('person');
});
