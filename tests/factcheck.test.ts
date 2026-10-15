import { describe, expect, it } from 'vitest';
import { gmTurn } from '../ai/gm';
import { checkGmScene, checkGmSuggestions, factFixPrompt } from '../engine/factcheck';
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

  it('never shows a rewrite that still breaks the facts, and never loops (AI Lab issue #2)', async () => {
    const { ai, prompts } = fakeAi([bad, { ...bad, scene: 'Li bows to Raizan again.' }]);
    const s = startGmGame();
    const before = s.events.length;
    await expect(gmTurn(ai, s)).rejects.toMatchObject({ code: 'bad_answer' });
    expect(prompts).toHaveLength(2);
    expect(s.events.length).toBe(before); // nothing recorded
  });

  it('never falls back to the first, broken scene when the rewrite fails', async () => {
    let k = 0;
    const ai = { name: 'fake', ask: async () => { if (k++ === 0) return JSON.stringify(bad); throw Object.assign(new Error('down'), { code: 'upstream_error' }); } };
    const s = startGmGame();
    const before = s.events.length;
    await expect(gmTurn(ai, s)).rejects.toMatchObject({ code: 'bad_answer' });
    expect(s.events.length).toBe(before);
  });

  it('a scene where Li beats a known person without a fight is sent back', () => {
    const s = startGmGame();
    expect(checkGmScene(s, 'Li steps in low and beats Gonza in front of the whole band.').map((p) => p.kind)).toContain('fight');
    expect(checkGmScene(s, 'Gonza beats the mule. Li watches.').map((p) => p.kind)).not.toContain('fight');
  });

  it('choices that offer blows against a known person must start the fight; training alone stays story', () => {
    const s = startGmGame();
    expect(checkGmSuggestions(s, { suggestions: ['I strike at Gonza\'s bad knee', 'I yield'] })).toHaveLength(1);
    expect(checkGmSuggestions(s, { suggestions: ['I strike at Gonza\'s bad knee'], fight: {} })).toHaveLength(0);
    expect(checkGmSuggestions(s, { suggestions: ['I practise strikes alone behind the horse lines'] })).toHaveLength(0);
    // Owner playtest v30: Li slipping Gonza's strap in story text is a fight the code must run; a punishment he takes is story.
    const strap = "Gonza swings the strap at Li's knees. Li slips the first lash and the second.";
    expect(checkGmSuggestions(s, { scene: strap })).toHaveLength(1);
    expect(checkGmSuggestions(s, { scene: strap, fight: {} })).toHaveLength(0);
    expect(checkGmSuggestions(s, { scene: 'Gonza lashes Li twice across the back. Li keeps his head down and takes it.' })).toHaveLength(0);
    expect(checkGmSuggestions(s, { scene: 'Li ducks under the tent flap and slips the rope off the post while Gonza snores.' })).toHaveLength(0);
  });
});

describe('the world facts reach the Game Master (owner, Oct 12: "the Lord" without a name)', () => {
  it('the memory names the houses and lords of Kurogane, without their secrets', async () => {
    const { gmMemoryText } = await import('../engine/gm');
    const m = gmMemoryText(startGmGame());
    expect(m).toContain('Lord Hagiwara Munenori (49)');
    expect(m).toContain('Hagiwara Sayo (13)');
    expect(m).not.toMatch(/smuggles rice/); // the Hagiwara secret stays in the Atlas
  });

  it('a wrong age for a known person is caught; a guess that is close is fine', () => {
    const s = startGmGame();
    expect(checkGmScene(s, 'Hagiwara Sayo is fifteen years old and very sure of herself.').map((p) => p.kind)).toContain('age');
    expect(checkGmScene(s, 'Hagiwara Sayo looks perhaps fourteen.').map((p) => p.kind)).not.toContain('age');
    expect(checkGmScene(s, 'Hagiwara Sayo is thirteen years old.').map((p) => p.kind)).not.toContain('age');
  });
});
