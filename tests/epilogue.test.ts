import { describe, expect, it } from 'vitest';
import { gmEpilogue } from '../ai/gm';
import { gmApply, startGmGame } from '../engine/gm';
import { canRetire, ended, epilogueFacts, epiloguePrompt, oldAge } from '../engine/epilogue';
import { commitDrafts, fromSave, stateHash, toSave } from '../engine/engine';

// The epilogue (GE ch. 9 decision 2; goal Oct 17): retire or old age; told from the record; never Li's death.
const freeLi = () => {
  const s = startGmGame();
  commitDrafts(s, [{ type: 'status', fact: 'Li is free', visible: true, data: { char: s.liId, status: 'free', role: 'a free man' } }, { type: 'flag', fact: 'rank', visible: false, data: { key: 'rank_level', value: 6 } }]);
  return s;
};

describe('the epilogue', () => {
  it('a slave cannot retire; a free man can; at 60 it is offered by itself', () => {
    expect(canRetire(startGmGame())).toBe(false);
    const s = freeLi();
    expect(canRetire(s)).toBe(true);
    expect(oldAge(s)).toBe(false);
    s.characters[s.liId].born = { year: 30, month: 1, day: 1 };
    expect(oldAge(s)).toBe(true);
  });

  it('Claude tells it from the facts only, and never shows Li dying', () => {
    const s = freeLi();
    s.knowledge.push('family_lead');
    const p = epiloguePrompt(s, 'retired');
    expect(p).toMatch(/Never show Li dying/);
    expect(p).toMatch(/Sennin-shō/);
    expect(epilogueFacts(s).join(' ')).toMatch(/lead to his family that went cold/);
  });

  it('it is written once; without Claude the plain chronicle closes the life; the save replays', async () => {
    const s = freeLi();
    gmApply(s, { scene: 'The last campaign ends.', summary: 'x', days: 1 });
    const told = { name: 'gm', ask: async () => JSON.stringify({ title: 'The Red Crane\'s Boy', text: 'Li laid down his command in the spring of his fiftieth year. '.repeat(4) }) };
    const ev = await gmEpilogue(told, s, 'retired');
    expect(ended(s)).toBe(true);
    expect((ev[0].data as { epilogueTitle: string }).epilogueTitle).toBe("The Red Crane's Boy");
    expect(await gmEpilogue(told, s, 'retired')).toEqual([]); // once
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
    const plain = freeLi();
    const ev2 = await gmEpilogue(null, plain, 'old age');
    expect(ev2[0].fact).toMatch(/Li, age/);
    expect(ended(plain)).toBe(true);
  });
});
