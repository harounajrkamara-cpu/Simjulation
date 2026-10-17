import { describe, expect, it } from 'vitest';
import { chapterEnd, death, firstBattle, milestone, nameReveal, opening, promotion, zone } from '../web/films/scenes';

// The short films (docs/FILMS.md): every film has shots, ends in a known time, escapes the game's text, and the opening
// keeps the owner's mystery (Oct 10: nothing ties the boy to the Twin Demon).

const all = [
  opening(), firstBattle({ name: 'The ford <b>', numbers: 'About 6,300' }), zone(), nameReveal({ words: 'I am Li Hattori <script>' }),
  promotion({ rank: 'Gochō', men: '5 men', line: 'x' }), death({ name: 'Hachi', line: 'Hachi died.' }), chapterEnd({ n: 2, title: 'The Ford', text: 'One. Two. Three.' }),
  milestone({ kicker: 'A marriage', title: 'Li marries Aiko', line: 'I married <i>Aiko</i>.', seal: '縁' }),
];

describe('films', () => {
  it('every film has shots with durations, and the big ones stay short', () => {
    for (const f of all) {
      expect(f.shots.length).toBeGreaterThan(0);
      for (const s of f.shots) expect(s.dur).toBeGreaterThan(0);
    }
    const secs = (f: typeof all[0]) => f.shots.reduce((t, s) => t + s.dur, 0) / 1000;
    expect(secs(opening())).toBeLessThanOrEqual(45);
    expect(secs(zone())).toBeLessThanOrEqual(10);
  });

  it('game text is escaped', () => {
    const html = all.map((f) => f.svg + (f.html ?? '')).join('');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('>&lt;b&gt;</span>'); // each word is its own brush span
  });

  it('the opening keeps the mystery: no wooden dragon, the boy is never named', () => {
    const o = opening();
    const text = [o.svg, o.html, ...o.shots.map((s) => s.caption ?? '')].join(' ').toLowerCase();
    expect(text).not.toMatch(/dragon|his son|hattori|li\b/);
  });

  it('a death cannot be clicked away in its first two seconds; panels wait for a click', () => {
    expect(death({ name: 'x', line: 'y' }).holdMs).toBe(2000);
    expect(promotion({ rank: 'x', men: 'y', line: 'z' }).waitAtEnd).toBe(true);
    expect(chapterEnd({ n: 1, title: 'x', text: 'y' }).waitAtEnd).toBe(true);
  });

  it('the chapter card shows only the first two sentences of the recap', () => {
    expect(chapterEnd({ n: 2, title: 'T', text: 'One. Two. Three.' }).html).toContain('One. Two.</p>');
  });
});
