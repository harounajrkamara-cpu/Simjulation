import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dateFromIndex } from '../engine/calendar';
import { li, startGame } from '../engine/engine';
import { PUBLIC_CLOCK, WORLD_START, publicWorld } from '../engine/world-public';
import { mapPage, mapSvg, worldView } from '../web/panels';
import { WORLD_CSS } from '../web/world-map';

// The two-view map (owner): Li's eyes by default, the world's public state one switch away. Never a hidden truth.

const KINGDOMS = ['Kurogane', 'Suiren', 'Hayate', 'Ushio', 'Takane', 'Tatara', 'Kitakaze'];
const CAPITALS = ['Seikyō', 'Hanaoka', 'Tsujikaze', 'Kaisei', 'Kumoi', 'Hinokuchi', 'Shirotori'];

/** Hidden truths (🔒 in the Atlas and World Bible ch. 10, 13b), hidden kingdom values and secrets Li must discover. */
const HIDDEN = [
  'Shirasagi ordered', 'Akabane set', 'canal', 'coup', 'Crown Authority', 'Kinugasa', 'fuse',
  'Royal Share', 'Unity', 'Succession Risk', 'Treasury', 'Discontent', 'faction',
  'Hattori', 'Twin Demon', 'Takeshi', 'Shiraiwa', 'Kage ', 'Hikari', 'Akabane', 'Shirasagi', 'Mist Valley',
  'Sayuri', 'Ofuji', 'Gōda', 'Kawabe', 'Utsugi', 'Sakaguchi', 'eunuch', 'assassin', 'usurp', 'plot', 'slander', 'bribe',
  'secret', 'hidden', 'SECRET', '🔒', 'cannot die', 'potential', 'merit law', 'refuge', 'Amenokiri',
];

const textOf = (html: string) => html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

describe('the world view (public state of the land)', () => {
  const s = startGame();
  const html = worldView(s);
  const text = textOf(html);

  it('lists all seven kingdoms with their capitals, on the map and in the text', () => {
    const svg = html.slice(html.indexOf('<svg'), html.indexOf('</svg>'));
    for (const k of KINGDOMS) { expect(text).toContain(k); expect(svg).toContain(`>${k}<`); }
    for (const c of CAPITALS) { expect(text).toContain(c); expect(svg).toContain(`>${c}<`); }
    expect(WORLD_START.kingdoms.map((k) => k.name)).toEqual(KINGDOMS);
  });

  it('shows the free lands, the public wars and the great titles', () => {
    for (const f of ['Kinza', 'Mount Shōgen', 'Horo clans', 'Amatsu-kyō']) expect(text).toContain(f);
    expect(text).toMatch(/Kurogane and Suiren\s+At war/);
    expect(text).toContain('At war with Suiren');
    expect(html).toContain('class="b-war"');
    expect(html).toContain('class="b-truce"');
    for (const t of ['The Six Pillars', 'The Three Storms', 'Ōtori Gensai', 'Kagami Sōun', 'the Silent Storm', 'the Northern Bear']) expect(text).toContain(t);
    expect(text).toContain('Empty since the last war.');
  });

  it('never shows a hidden truth, a hidden value or a real troop count', () => {
    for (const h of HIDDEN) expect(text, h).not.toContain(h);
    expect(text).not.toMatch(/\d\s?%/); // royal shares and hidden values
    expect(text).not.toMatch(/\b\d+(\.\d+)?k\b/); // family troop counts from the Atlas tables
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    const page = textOf(mapPage(s));
    for (const h of HIDDEN) expect(page, h).not.toContain(h);
  });

  it('is deterministic: the same save gives the same world, and the data is never changed by reading it', () => {
    const before = JSON.stringify(WORLD_START);
    expect(worldView(startGame())).toBe(html);
    expect(mapPage(startGame())).toBe(mapPage(startGame()));
    const late = dateFromIndex(500);
    expect(publicWorld(late)).toEqual(publicWorld(late));
    expect(JSON.stringify(WORLD_START)).toBe(before);
    const src = readFileSync(new URL('../engine/world-public.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/Math\.random|Date\.now|new Date/);
  });

  it('the world clock changes only what the whole land would hear, on its day', () => {
    const turn = PUBLIC_CLOCK.find((c) => c.kingdom?.id === 'kurogane')!.day;
    const kg = (d: number) => publicWorld(dateFromIndex(d)).kingdoms.find((k) => k.id === 'kurogane')!.ruler;
    expect(kg(turn - 1)).toContain('Chancellor');
    expect(kg(turn)).toContain('rules alone');
    expect(publicWorld(dateFromIndex(turn)).year).toBe(101);
  });

  it('marks Li at Akaishi, and nowhere when his place is unknown', () => {
    expect(html).toContain('class="here"');
    const lost = startGame();
    li(lost).location = 'a nameless road';
    expect(worldView(lost)).not.toContain('class="here"');
    const smith = startGame();
    li(smith).location = 'Hinokuchi, the forge city';
    expect(worldView(smith)).toContain('class="here"');
  });
});

describe("Li's eyes stays the default view", () => {
  const s = startGame();
  const page = mapPage(s);

  it('opens on the fogged map, with the world one switch away', () => {
    expect(page).toMatch(/id="mv-li"[^>]*checked/);
    expect(page).not.toMatch(/id="mv-world"[^>]*checked/);
    expect(page).toContain(mapSvg(s, true));
    expect(page.indexOf('class="mv-li"')).toBeLessThan(page.indexOf('class="mv-world"'));
    expect(WORLD_CSS).toMatch(/\.mapviews \.mv-world \{ display: none; \}/);
  });

  it('the switch is two radios in labels: keyboard arrows move between them, targets are at least 44px', () => {
    const radios = page.match(/<label><input type="radio" name="mapview"[^>]*>[^<]+<\/label>/g) ?? [];
    expect(radios.map((r) => r.replace(/<[^>]+>/g, ''))).toEqual(["Li's eyes", 'The world']);
    expect(page).toContain('<legend>Map view</legend>');
    expect(WORLD_CSS).toMatch(/\.mv-switch label \{[^}]*min-height: 44px/);
  });

  it('the small map keeps its signature and shows only what Li knows', () => {
    const small = mapSvg(s);
    expect(small).toContain('unknown lands');
    for (const k of ['Hayate', 'Ushio', 'Takane', 'Tatara', 'Kitakaze']) expect(small).not.toContain(k);
    const li = page.slice(page.indexOf('class="mv-li"'), page.indexOf('class="mv-world"'));
    for (const k of ['Hayate', 'Ushio', 'Takane', 'Tatara', 'Kitakaze']) expect(li).not.toContain(k);
  });
});
