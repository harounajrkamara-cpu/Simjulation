import { describe, expect, it } from 'vitest';
import { gmChapter, gmTier, gmTurn } from '../ai/gm';
import { commitDrafts, fromSave, stateHash, toSave } from '../engine/engine';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { CHAPTER_SCENES, chapterDraft, chapterDue, storyWindow } from '../engine/recaps';
import { GameState } from '../engine/types';

// Chapter recaps and the smart model mix (owner vision Oct 10).

const scene = (k: number) => parseGmTurn({ scene: `Li works, day ${k}.`, summary: `Scene ${k}.`, days: 1 })!;
const play = (s: GameState, n: number, from = 1) => { for (let k = from; k < from + n; k++) gmApply(s, scene(k)); };
const recap = { title: 'The Red Crane', text: 'Li carried water and chests for the band through the cold spring, learned the names of the men around him, and began to train at night with two sticks while Hachi kept watch.' };

function fakeAi(answers: unknown[]) {
  const asks: { prompt: string; tier?: string }[] = [];
  let k = 0;
  return { asks, ai: { name: 'fake', ask: async (prompt: string, o?: { tier?: string }) => { asks.push({ prompt, tier: o?.tier }); return JSON.stringify(answers[Math.min(k++, answers.length - 1)]); } } };
}

describe('chapter recaps', () => {
  it('a chapter is due after twenty scenes, not before', () => {
    const s = startGmGame();
    play(s, CHAPTER_SCENES - 1);
    expect(chapterDue(s)).toBe(false);
    play(s, 1, CHAPTER_SCENES);
    expect(chapterDue(s)).toBe(true);
  });

  it('Claude writes it once; it is recorded, replays, and the next chapter starts after it', async () => {
    const s = startGmGame();
    play(s, CHAPTER_SCENES);
    const { ai, asks } = fakeAi([recap]);
    const ev = await gmChapter(ai, s);
    expect(ev).toHaveLength(1);
    expect(asks[0].prompt).toContain('Scene 20.');
    expect(s.gm?.chapters?.[0]).toMatchObject({ title: 'The Red Crane', scenes: 20 });
    expect(chapterDue(s)).toBe(false);
    expect(await gmChapter(ai, s)).toEqual([]); // not due: no call
    expect(asks).toHaveLength(1);
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });

  it('refuses an unusable recap (too short or no title)', () => {
    const s = startGmGame();
    play(s, CHAPTER_SCENES);
    expect(chapterDraft(s, { title: '', text: recap.text })).toBeUndefined();
    expect(chapterDraft(s, { title: 'Short', text: 'Too short.' })).toBeUndefined();
  });

  it('Claude sees every chapter and the scenes after it, nothing falls out', () => {
    const s = startGmGame();
    play(s, CHAPTER_SCENES);
    commitDrafts(s, [chapterDraft(s, recap)!]);
    play(s, 30, 21);
    const w = storyWindow(s);
    expect(w.chapters).toHaveLength(1);
    expect(w.scenes).toHaveLength(30); // everything after the chapter, even beyond twenty
    const mem = gmMemoryText(s);
    expect(mem).toContain('CHAPTERS SO FAR');
    expect(mem).toContain(recap.text);
    expect(mem).toContain('Scene 50.');
    expect(mem).not.toContain('Scene 5.');
  });

  it('without chapters the whole story stays in view', () => {
    const s = startGmGame();
    play(s, 45);
    expect(storyWindow(s).scenes).toHaveLength(45);
  });
});

describe('the smart model mix', () => {
  it('the strongest model for the opening, a fight\'s aftermath, wishes or a long move; default otherwise', async () => {
    const s = startGmGame();
    expect(gmTier(s)).toBe('complex');
    play(s, 1);
    expect(gmTier(s, 'I carry the water')).toBe('default');
    expect(gmTier(s, 'I carry the water (make it tense)')).toBe('complex');
    expect(gmTier(s, 'I '.padEnd(150, 'x'))).toBe('complex');
    const { ai, asks } = fakeAi([{ scene: 'Li carries water.', summary: 'Water.' }]);
    await gmTurn(ai, s, 'I carry the water');
    expect(asks[0].tier).toBe('default');
  });
});
