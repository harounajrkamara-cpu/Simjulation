import { describe, expect, it } from 'vitest';
import { startGmGame } from '../engine/gm';
import { termify } from '../web/guide';

// Word tooltips (owner, Oct 12; more words goal Oct 17): only what Li knows, first mention, never nested.
describe('tooltips', () => {
  it('people Li has met, ranks and kingdoms get a tip; strangers do not; only the first mention', () => {
    const s = startGmGame();
    const html = termify('Old Sukezō stirs the pot. Sukezō smiles. Sayo rides past to Kurogane. A Kogashira shouts.', s);
    expect(html.match(/class="term"/g)?.length).toBe(3);
    expect(html).toMatch(/<span class="term" tabindex="0">Sukezō<span class="tip" role="tooltip"><b>Old Sukezō<\/b>/);
    expect(html).not.toMatch(/term" tabindex="0">Sayo/); // not met yet: no spoiler
    expect(html).toMatch(/<b>Kurogane, the Iron West<\/b>/);
    expect(html).toMatch(/<b>Kogashira<\/b> an officer of 10 men/);
  });

  it('a word inside a tip never gets a tip of its own', () => {
    const s = startGmGame();
    const html = termify('Raizen looks at Gonza.', s);
    const inner = html.match(/<span class="tip"[^]*?<\/span>/g) ?? [];
    for (const t of inner) expect(t).not.toMatch(/class="term"/);
  });
});
