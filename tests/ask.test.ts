import { describe, expect, it } from 'vitest';
import { newGame } from '../engine/game';
import { ask, askSheet, checkAnswer, isQuestion, localAnswer, questionOf } from '../web/ask';
import type { AiAdapter } from '../ai/adapter';

const fake = (answers: string[]): AiAdapter => ({ name: 'fake', ask: async () => answers.shift() ?? '' });

describe('Ask the guide', () => {
  it('knows a question by its "?"', () => {
    expect(isQuestion('? what now')).toBe(true);
    expect(isQuestion('I ask Sukezō')).toBe(false);
    expect(questionOf('??  who is Gonza')).toBe('who is Gonza');
  });

  it('the sheet holds only people Li has met', () => {
    const s = newGame().state;
    const sheet = askSheet(s);
    expect(sheet).toContain('Hisame');
    expect(sheet).not.toContain('Kaname');
    expect(sheet).not.toContain('Daisuke');
  });

  it('rejects answers about people Li has not met, or wrong money', () => {
    const s = newGame().state;
    expect(checkAnswer(s, 'Talk to Hisame at the fire tonight.')).toEqual([]);
    expect(checkAnswer(s, 'Kaname will help you escape.').length).toBeGreaterThan(0);
    expect(checkAnswer(s, 'You have 500 mon saved.').length).toBeGreaterThan(0);
    expect(checkAnswer(s, `You have ${s.money} mon.`)).toEqual([]);
  });

  it('a bad answer twice falls back to the game\'s own answer; time never moves', async () => {
    const s = newGame().state;
    const before = JSON.stringify(s);
    const a = await ask(fake(['Kaname knows the way.', 'Ask Ōno Daisuke.']), s, 'who can help me?');
    expect(a.from).toBe('game');
    expect(a.text).toBe(localAnswer(s, 'who can help me?'));
    const b = await ask(fake(['Ask Old Sukezō at the cook fire.']), s, 'who can help me?');
    expect(b).toEqual({ text: 'Ask Old Sukezō at the cook fire.', from: 'claude' });
    expect(JSON.stringify(s)).toBe(before);
  });

  it('without Claude the game answers with goals and choices', async () => {
    const s = newGame().state;
    const a = await ask(null, s, 'what should I do?');
    expect(a.from).toBe('game');
    expect(a.text).toMatch(/Your goals:.*\nWhat Li can do now:/);
  });
});

describe('Ask the guide: houses and facts', () => {
  it('an answer may name a house that shares a name with someone Li has not met', () => {
    const s = newGame().state;
    expect(checkAnswer(s, 'The Hagiwara are the border lords of Akaishi.')).toEqual([]);
    expect(checkAnswer(s, 'Kaname will help you.').length).toBeGreaterThan(0); // unmet and not public (Sayo is public: the lord's daughter)
  });
  it('without Claude, a question about a known thing gets what Li knows about it', async () => {
    const s = newGame().state;
    const a = await ask(null, s, 'hagiwara who are they');
    expect(a.text).toMatch(/Hagiwara/);
    expect(a.text).not.toMatch(/Your goals/);
  });
});

describe('People tab (owner, Oct 12: it opened empty)', () => {
  it('a person the Game Master adds without a name still shows, and does not blank the page', async () => {
    const { startGmGame, gmApply } = await import('../engine/gm');
    const { peoplePage } = await import('../web/panels');
    const s = startGmGame();
    gmApply(s, { scene: 'A groom watches.', summary: 'x', changes: [{ kind: 'person', id: 'genji_groom', role: 'groom' } as never] });
    const html = peoplePage(s);
    expect(html).toContain('Genji groom');
    expect(html).toContain('Mikumo Raizen');
  });
});

describe("Li's life (owner, Oct 12: the slave life was vague)", () => {
  it('the Li tab and Claude both get it while Li is a slave, and only then', async () => {
    const { liPage } = await import('../web/panels');
    const { gmMemoryText, startGmGame } = await import('../engine/gm');
    const s = startGmGame();
    expect(liPage(s)).toContain("Li's life");
    expect(liPage(s)).toContain('On the straw by the horse lines');
    expect(gmMemoryText(s)).toContain("LI'S LIFE AS A SLAVE");
    s.characters[s.liId].status = 'free';
    expect(liPage(s)).not.toContain("Li's life");
  });
});
