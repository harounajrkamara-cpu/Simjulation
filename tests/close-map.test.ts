import { describe, expect, it } from 'vitest';
import { gmApply, startGmGame } from '../engine/gm';
import { closeMapHtml } from '../web/close-map';

// The close-up map (owner wish Oct 11; goal Oct 17): the camp with "Li is here", later Li's land with what he built.
describe('close-up map', () => {
  it('marks where Li is in the camp from his recorded place', () => {
    const s = startGmGame();
    gmApply(s, { scene: 'x', summary: 'x', place: 'the cook fire by Sukezō\'s pots' });
    const html = closeMapHtml(s);
    expect(html).toMatch(/Li is here/);
    expect(html).toMatch(/<g class="cm-p here">[^]*?Cook fire/);
  });

  it('shows Li\'s land once he holds it', () => {
    const s = startGmGame();
    s.characters[s.liId].status = 'free';
    s.flags.rank_level = 5;
    gmApply(s, { scene: 'x', summary: 'x', changes: [{ kind: 'land', koku: 300, name: 'Ōtaki', reason: 'granted' }] });
    const html = closeMapHtml(s);
    expect(html).toMatch(/Ōtaki: about 300 koku/);
    expect(html).toMatch(/Li's hall/);
  });
});
