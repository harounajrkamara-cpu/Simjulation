import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { checkGmScene, factFixPrompt } from '../engine/factcheck';
import { startGmGame } from '../engine/gm';

// The Game Master's fact-check (owner vision Oct 10): errors are prevented before the player sees them.

const kinds = (text: string, s = startGmGame(), extra: string[] = []) => checkGmScene(s, text, extra).map((p) => p.kind);

function fakeAi(answers: unknown[]) {
  const prompts: string[] = [];
  let k = 0;
  return { prompts, ai: { name: 'fake', ask: async (p: string) => { prompts.push(p); return JSON.stringify(answers[Math.min(k++, answers.length - 1)]); } } };
}

describe('the fact-check', () => {
  it('passes a clean scene', () => {
    expect(kinds('Li carries water past the horse lines. Hachi grins at him. "Again tomorrow," Raizen says.')).toEqual([]);
  });

  it('catches the dead speaking or acting, but lets the living talk about them', () => {
    const s = startGmGame();
    s.characters.hachi.alive = false;
    expect(kinds('Hachi grins and splits his rice ball with Li.', s)).toContain('dead');
    expect(kinds('"Eat," Hachi says.', s)).toContain('dead');
    expect(kinds('Li thinks of Hachi, buried under the plum tree, and says nothing.', s)).toEqual([]);
  });

  it('catches misspelled known names, not new or unrelated ones', () => {
    expect(kinds('Li bows to Raizan at the gate.')).toContain('name');
    expect(kinds('Li bows to Raizen at the gate.')).toEqual([]);
    expect(kinds('A stranger named Hachiro waits at the gate.', startGmGame(), ['Hachiro'])).toEqual([]);
    expect(kinds('Li looks across the Kurose at the Suiren banners.')).toEqual([]);
  });

  it('catches a wrong age for Li, not for others', () => {
    expect(kinds('Li, a fifteen-year-old slave, carries the chest.')).toContain('age');
    expect(kinds('Li, a twelve-year-old slave, carries the chest.')).toEqual([]);
    expect(kinds('Li watches Hachi, a ten-year-old boy, stumble.')).toEqual([]);
  });

  it('catches a wrong rank or a freedom the code did not record', () => {
    expect(kinds('Kogashira Li barks an order.')).toContain('rank');
    expect(kinds('Li salutes the Kogashira.')).toEqual([]);
    expect(kinds('At last Li is free.')).toContain('rank');
  });

  it('keeps the story a story: no game words, no "you" outside dialogue', () => {
    expect(kinds('Li feels his VAL rise.')).toContain('mechanics');
    expect(kinds('You see the river.')).toContain('person');
    expect(kinds('"You carry it," Gonza says.')).toEqual([]);
  });

  it('the rewrite instruction names every problem', () => {
    const p = factFixPrompt(checkGmScene(startGmGame(), 'Li, a fifteen-year-old, bows to Raizan.'));
    expect(p).toMatch(/Li is 12, not 15/);
    expect(p).toMatch(/misspelling of Raizen/);
  });
});

describe('the Game Master turn uses it', () => {
  const bad = { scene: 'Li bows to Raizan.', summary: 'Bow.' };
  const good = { scene: 'Li bows to Raizen.', summary: 'Bow.' };

  it('asks for one rewrite and shows the fixed scene', async () => {
    const { ai, prompts } = fakeAi([bad, good]);
    const r = await gmTurn(ai, startGmGame());
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toMatch(/misspelling of Raizen/);
    expect(r.turn.scene).toBe('Li bows to Raizen.');
  });

  it('rejects the rewrite when it still breaks the facts (never loops)', async () => {
    const { ai, prompts } = fakeAi([bad, { ...bad, scene: 'Li bows to Raizan again.' }]);
    await expect(gmTurn(ai, startGmGame())).rejects.toMatchObject({ code: 'bad_answer' });
    expect(prompts).toHaveLength(2); // 1 initial + 1 rewrite that still had problems
  });

  it('rejects when the rewrite call fails (no unsafe fallback to the broken first scene)', async () => {
    let k = 0;
    const ai = { name: 'fake', ask: async () => { if (k++ === 0) return JSON.stringify(bad); throw Object.assign(new Error('down'), { code: 'upstream_error' }); } };
    await expect(gmTurn(ai, startGmGame())).rejects.toMatchObject({ code: 'bad_answer' });
    expect(k).toBe(3); // 1 initial + 2 retry attempts that errored
  });

  // ── Regression test for AI Lab Issue #2 ──────────────────────────────────
  // The rewrite still contains "Raizan" (misspelling of Raizen).
  // Current code: accepts the rewrite WITHOUT re-running checkGmScene → BUG.
  // Expected: the rewrite must also pass the fact-check; if it still fails,
  // throw a controlled 'bad_answer' error — never accept a fact-broken scene,
  // never enter an infinite retry loop.
  it('regression #2: rewrite is re-checked — a still-broken rewrite is NOT accepted', async () => {
    const { ai, prompts } = fakeAi([bad, { ...bad, scene: 'Li bows to Raizan again.' }]);
    await expect(gmTurn(ai, startGmGame())).rejects.toMatchObject({ code: 'bad_answer' });
    expect(prompts).toHaveLength(2); // 1 initial + 1 rewrite; no infinite retry
  });

  // ── Playtest fix (Oct 11): combat suggestions without a fight ─────────────
  // The GM wrote a sword drill against Gonza with suggestion "I strike",
  // but did not set the "fight" field. The code must reject it so a real
  // duel starts instead of Claude narrating the outcome.
  it('rejects combat suggestions without a fight field (duel must start)', async () => {
    const { ai, prompts } = fakeAi([{
      scene: 'Gonza offers Li a slow sword drill with sticks. Li accepts.',
      summary: 'Li drills with Gonza.',
      suggestions: [
        "I use the opening in Gonza's front foot and strike",
        'I keep my blade ready',
        'I ask Gonza about the levy',
      ],
    }]);
    await expect(gmTurn(ai, startGmGame())).rejects.toMatchObject({ code: 'bad_answer' });
    expect(prompts).toHaveLength(2); // 1 initial + 1 rewrite (both lack fight)
  });

  // ── Playtest fix (Oct 11): sleeping must advance the date ──────────────────
  // The GM wrote a scene where Li sleeps through the night, but set days: 0.
  // The fix forces days=1 and part=morning, so a time event is created
  // and the date advances (no more "date stayed on day 1").
  it('advances to next morning when Li sleeps (days=0 → 1, part=morning)', async () => {
    const { ai } = fakeAi([{
      scene: 'Li falls asleep under the plum tree. He rests through the night, safe and still.',
      summary: 'Li sleeps through the night.',
      days: 0,
      part: 'night',
    }]);
    const r = await gmTurn(ai, startGmGame());
    // A time event should have been created by gmTimeDrafts(days=1, "morning").
    expect(r.events.some((e) => e.type === 'time')).toBe(true);
  });
});
