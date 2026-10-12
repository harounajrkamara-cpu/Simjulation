import { describe, expect, it } from 'vitest';
import { PROLOGUE } from '../engine/content';
import { createWorld } from '../engine/data';
import { fromSave, li, options, stateHash, toSave } from '../engine/engine';
import { newGame } from '../engine/game';
import { gmMemoryText, gmOn } from '../engine/gm';
import { CHILDHOOD, TIME_JUMP, beginLife, childhoodDrafts, childhoodPicks } from '../engine/prologue';

// The opening (owner vision Oct 10): the film, the playable night in the snow (Year 95, Month 8), "Five years later".

const filmText = PROLOGUE.map((p) => `${p.label} ${p.text} ${p.quote ?? ''}`).join('\n');
const nightText = CHILDHOOD.map((c) => [c.label, c.text, c.quote, c.ask, c.then, ...c.options.flatMap((o) => [o.label, o.text, o.journal])].join('\n')).join('\n')
  + TIME_JUMP.map((p) => `${p.label} ${p.text} ${p.quote ?? ''}`).join('\n');
const canonLines = CHILDHOOD.map((c) => c.options[c.canon].journal);

describe('the opening film', () => {
  it('is a longer film that tells the legend the way the world tells it', () => {
    expect(PROLOGUE.length).toBeGreaterThanOrEqual(9);
    expect(PROLOGUE.length).toBeLessThanOrEqual(12);
    for (const w of ['Amatsu-kyō', 'The Burning', 'Seven', 'hundred years', 'Twin Demon', 'Year 90', 'Kurogane raiders', 'Year 95', 'snow', 'A father\'s name he must not say']) expect(filmText).toContain(w);
  });

  it('never names the Twin Demon, never ties him to Li and never shows his real killers', () => {
    for (const w of ['Hattori', 'Takeshi', 'Shirasagi', 'Akabane', 'Kinugasa', 'Shiraiwa', 'Yasumichi', 'Kage', 'Hikari', 'Three Families', 'cannot die']) expect(filmText).not.toContain(w);
    expect(filmText).not.toMatch(/\bLi\b/);
  });
});

describe('the playable night', () => {
  it('has three to five small choices, each with a canon default', () => {
    expect(CHILDHOOD.length).toBeGreaterThanOrEqual(3);
    expect(CHILDHOOD.length).toBeLessThanOrEqual(5);
    for (const c of CHILDHOOD) {
      expect(c.options.length).toBeGreaterThanOrEqual(2);
      expect(c.options[c.canon]).toBeDefined();
      for (const o of c.options) expect(o.journal).toMatch(/\bI\b/); // Li's own voice
    }
  });

  it('keeps the canon: the promise, the white rock, the bundle, the fall, the slavers, only "Li"', () => {
    expect(nightText).toContain('"Listen to me, Li. Never say the name Hattori. Not to anyone."');
    for (const w of ['white rock', 'lantern', 'bundle', 'wooden dragon', 'slope', 'cart', 'Five years later', 'Red Crane', 'Year 100']) expect(nightText).toContain(w);
    // Every answer to the slavers ends with "Li" and nothing else.
    for (const o of CHILDHOOD.find((c) => c.id === 'slavers')!.options) expect(o.text).toMatch(/"Li[.,]?"/);
    // Only what Li knows (WB 10.2): no guide's name or house, no truths about his father.
    for (const w of ['Shiraiwa', 'Yasumichi', 'Takane', 'Takeshi', 'Twin Demon', 'Kage', 'Hikari', 'Kinza', 'cannot die']) expect(nightText).not.toContain(w);
  });

  it('has no emoji anywhere in the opening', () => {
    expect(`${filmText}\n${nightText}`).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('fills a skipped or invalid pick with the canon choice', () => {
    expect(childhoodPicks()).toEqual(CHILDHOOD.map((c) => c.canon));
    expect(childhoodPicks([2, undefined, 9, -1, 1.5])).toEqual([2, CHILDHOOD[1].canon, CHILDHOOD[2].canon, CHILDHOOD[3].canon, CHILDHOOD[4].canon]);
  });
});

describe('the night becomes Li\'s first journal lines', () => {
  it('records the chosen memories first, before the chronicle begins (classic)', () => {
    const picks = [2, 1, 1, 1, 2];
    const { state: s, text } = beginLife({ gm: false, picks });
    const lines = picks.map((p, i) => CHILDHOOD[i].options[p].journal);
    expect(s.journal.slice(0, lines.length).map((j) => j.text)).toEqual(lines);
    for (const [i, p] of picks.entries()) expect(s.knowledge).toContain(CHILDHOOD[i].options[p].key);
    expect(s.flags.opening_childhood).toBe(1);
    expect(text).toContain('Kōri fort');
    expect(s.journal.at(-1)!.text).not.toBe(lines.at(-1)); // the chronicle's own first lines follow
  });

  it('skipping gives the canon night', () => {
    const { state: s } = beginLife({ gm: false, skipped: true });
    expect(s.journal.slice(0, canonLines.length).map((j) => j.text)).toEqual(canonLines);
    expect(s.flags.opening_childhood).toBe(2);
    // Skipping half way keeps what was picked and uses the canon for the rest.
    const half = beginLife({ gm: false, picks: [1, 2], skipped: true }).state;
    expect(half.journal.slice(0, 3).map((j) => j.text)).toEqual([CHILDHOOD[0].options[1].journal, CHILDHOOD[1].options[2].journal, canonLines[2]]);
  });

  it('colours the moment, never the outcome: same start whatever the picks', () => {
    const a = beginLife({ gm: false, picks: [0, 0, 0, 0, 0] }).state;
    const b = beginLife({ gm: false, picks: [2, 2, 1, 2, 2] }).state;
    const base = createWorld(1);
    for (const s of [a, b]) {
      expect(li(s).stats).toEqual(base.characters.li.stats);
      expect(li(s).styles).toEqual(base.characters.li.styles);
      expect(li(s).skills).toEqual(base.characters.li.skills);
      expect(s.money).toBe(base.money);
      expect(li(s).status).toBe('slave');
      expect(s.date).toEqual(base.date);
      expect(s.relations).toEqual(base.relations);
      // The canon knowledge is there in every life (WB 10.2).
      for (const k of ['white_rock_crest', 'wooden_dragon', 'own_name']) expect(s.knowledge).toContain(k);
    }
    expect(options(a)).toEqual(options(b));
    expect(options(a)).toEqual(options(newGame().state));
  });

  it('is deterministic and replays from the save', () => {
    const one = beginLife({ gm: false, picks: [1, 0, 1, 2, 1] }).state;
    const two = beginLife({ gm: false, picks: [1, 0, 1, 2, 1] }).state;
    expect(stateHash(one)).toBe(stateHash(two));
    expect(one.events).toEqual(two.events);
    const back = fromSave(toSave(one));
    expect(stateHash(back)).toBe(stateHash(one));
    expect(back.journal).toEqual(one.journal);
    expect(childhoodDrafts([1, 0, 1, 2, 1])).toEqual(childhoodDrafts([1, 0, 1, 2, 1]));
  });

  it('works in Game Master mode too: no fixed beats, and Claude reads the night in the memory', () => {
    const { state: s, text } = beginLife({ gm: true, picks: [0, 1] });
    expect(gmOn(s)).toBe(true);
    expect(text).toBe('');
    expect(s.events.filter((e) => e.type === 'story')).toHaveLength(0);
    expect(s.journal.map((j) => j.text)).toEqual([CHILDHOOD[0].options[0].journal, CHILDHOOD[1].options[1].journal, ...canonLines.slice(2)]);
    const mem = gmMemoryText(s);
    expect(mem).toContain(CHILDHOOD[1].options[1].journal);
    expect(mem).toContain(CHILDHOOD[1].options[1].key);
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });
});
