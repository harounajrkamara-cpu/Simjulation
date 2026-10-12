import { KingdomId, PowerId, PublicWorld, Stance } from '../engine/world-public';

// "The world" map (zoomed out): the seven kingdoms drawn as ink, after the Atlas §2 sketch.
// Borders are shared edges, so two neighbours always meet on the same line. Only public data is drawn.

type Pt = [number, number];
const W1: Pt = [30, 134], J1: Pt = [208, 130], J2: Pt = [376, 126], J3: Pt = [470, 122], E1: Pt = [524, 98];
const J4: Pt = [208, 218], J5: Pt = [286, 214], J6: Pt = [376, 210];
const J7: Pt = [210, 280], J8: Pt = [286, 278], J9: Pt = [376, 276], J10: Pt = [466, 272], J11: Pt = [474, 300];
const E2: Pt = [504, 312], E3: Pt = [470, 350], W2: Pt = [30, 286], NE: Pt = [520, 62], NW: Pt = [46, 72];

const E: Record<string, Pt[]> = {
  kitKg: [W1, [92, 140], [150, 128], J1],
  kitH: [J1, [262, 134], [320, 124], J2],
  kitTk: [J2, [424, 130], J3],
  kitU: [J3, [500, 114], E1],
  kgH: [J1, [214, 170], [204, 196], J4],
  kgTt: [J4, [204, 250], J7],
  kurose: [J7, [160, 292], [112, 278], [64, 290], W2],
  hTt: [J4, [246, 220], J5],
  hR: [J5, [330, 206], J6],
  hTk: [J2, [382, 170], [372, 192], J6],
  ttR: [J5, [290, 248], J8],
  ttS: [J7, [248, 286], J8],
  rTk: [J6, [380, 240], J9],
  rS: [J8, [330, 282], J9],
  tkU: [J3, [476, 170], [462, 220], J10],
  tkS: [J9, [420, 268], J10],
  uS: [J10, J11],
  uKz: [J11, E2],
  sKz: [J11, [468, 326], E3],
  palisade: [NE, [470, 52], [390, 58], [300, 50], [200, 60], [120, 54], NW],
  kitWest: [NW, [24, 104], W1],
  kitEast: [E1, [546, 80], NE],
  kgCoast: [W2, [18, 240], [22, 180], W1],
  uCoast: [E1, [556, 130], [578, 190], [572, 250], [540, 296], E2],
  kzCoast: [E2, [500, 340], E3],
  sCoast: [E3, [420, 366], [330, 380], [230, 376], [130, 370], [60, 350], [26, 320], W2],
};
const r = (k: string) => [...E[k]].reverse();
const ring = (...segs: Pt[][]) => `M${segs.flatMap((s, i) => (i ? s.slice(1) : s)).map((p) => p.join(' ')).join(' L')} Z`;
const line = (pts: Pt[]) => `M${pts.map((p) => p.join(' ')).join(' L')}`;

const SHAPE: Record<KingdomId | 'kinza' | 'ruins', string> = {
  kitakaze: ring(E.kitKg, E.kitH, E.kitTk, E.kitU, E.kitEast, E.palisade, E.kitWest),
  kurogane: ring(E.kitKg, E.kgH, E.kgTt, E.kurose, E.kgCoast),
  hayate: ring(E.kitH, E.hTk, r('hR'), r('hTt'), r('kgH')),
  tatara: ring(E.hTt, E.ttR, r('ttS'), r('kgTt')),
  ruins: ring(E.hR, E.rTk, r('rS'), r('ttR')),
  takane: ring(E.kitTk, E.tkU, r('tkS'), r('rTk'), r('hTk')),
  ushio: ring(E.kitU, E.uCoast, r('uKz'), r('uS'), r('tkU')),
  kinza: ring(E.uKz, E.kzCoast, r('sKz')),
  suiren: ring(r('kurose'), E.ttS, E.rS, E.tkS, E.uS, E.sKz, E.sCoast),
};
const TRIBES = ring(E.palisade, [NW, [34, 30], [300, 12], [566, 26], NE]);

/** Where each kingdom's name sits; the capital is drawn just below it. */
export const LABEL: Record<KingdomId, Pt> = {
  kitakaze: [290, 86], kurogane: [112, 192], hayate: [292, 162], tatara: [247, 238], takane: [422, 178], ushio: [522, 192], suiren: [250, 322],
};

/** Shared borders, keyed by the two powers in alphabetical order. */
const BORDER: Record<string, Pt[]> = {
  'kurogane|suiren': E.kurose, 'horo|kitakaze': E.palisade, 'hayate|kurogane': E.kgH, 'hayate|takane': E.hTk, 'kinza|suiren': E.sKz,
  'kitakaze|kurogane': E.kitKg, 'hayate|kitakaze': E.kitH, 'kitakaze|takane': E.kitTk, 'kitakaze|ushio': E.kitU, 'hayate|tatara': E.hTt,
  'kurogane|tatara': E.kgTt, 'suiren|tatara': E.ttS, 'suiren|takane': E.tkS, 'suiren|ushio': E.uS, 'kinza|ushio': E.uKz, 'takane|ushio': E.tkU,
};
const DRAWN: Partial<Record<Stance, string>> = { war: 'b-war', truce: 'b-truce', tension: 'b-tension' };

/** Akaishi, where the Li's eyes map sits. */
export const AKAISHI: Pt = [176, 266];
const NEAR_AKAISHI = ['kori_camp', 'sasabe', 'akaishi'];

/** Li's mark on the world map: Akaishi for the stage 1 places, else a kingdom or capital named in the place, else none. */
export function liPoint(w: PublicWorld, location: string): Pt | null {
  if (NEAR_AKAISHI.includes(location)) return AKAISHI;
  const loc = location.toLowerCase();
  const k = w.kingdoms.find((x) => loc.includes(x.id) || loc.includes(x.capital.toLowerCase()));
  return k ? [LABEL[k.id][0] + 18, LABEL[k.id][1] + 14] : null;
}

const t = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function cross([x, y]: Pt): string {
  return `<path class="x-war" d="M${x - 5} ${y - 5} L${x + 5} ${y + 5} M${x + 5} ${y - 5} L${x - 5} ${y + 5}"></path>`;
}

export function worldSvg(w: PublicWorld, li: Pt | null): string {
  const name = (id: PowerId) => w.kingdoms.find((k) => k.id === id)?.name ?? w.free.find((f) => f.id === id)?.name ?? id;
  const drawn = w.relations.map((x) => ({ x, pts: BORDER[[x.a, x.b].sort().join('|')] })).filter((d) => DRAWN[d.x.stance] && d.pts);
  const lines = drawn.map((d) => `<path class="${DRAWN[d.x.stance]}" d="${line(d.pts)}"></path>`).join('');
  const crosses = drawn.filter((d) => d.x.stance === 'war').map((d) => cross(d.pts[Math.floor(d.pts.length / 2)])).join('');
  const kingdoms = w.kingdoms.map((k) => {
    const [x, y] = LABEL[k.id];
    return `<text class="kname" x="${x}" y="${y}">${t(k.name)}</text><rect class="cap" x="${x - 3}" y="${y + 8}" width="6" height="6"></rect><text class="capname" x="${x}" y="${y + 26}">${t(k.capital)}</text>`;
  }).join('');
  const wars = w.relations.filter((x) => x.stance === 'war').map((x) => `${name(x.a)} and ${name(x.b)}`);
  const label = `Map of the land in Year ${w.year}: Kitakaze in the north with the Horo clans beyond its palisade; Kurogane, Hayate, Tatara, the Ash Plain with Mount Shōgen, Takane and Ushio across the middle; Suiren and the city of Kinza in the south.${wars.length ? ` At war: ${wars.join('; ')}.` : ''}${li ? ' A red dot marks Li.' : ''}`;
  return `<svg class="map wmap" viewBox="0 0 600 400" role="img" aria-label="${t(label).replace(/"/g, '&quot;')}">
    <path class="tribes" d="${TRIBES}"></path>
    ${(Object.keys(SHAPE) as (keyof typeof SHAPE)[]).map((id) => `<path class="k k-${id}" d="${SHAPE[id]}"></path>`).join('')}
    ${lines}
    <path class="river" d="${line(E.kurose)}"></path>
    ${crosses}
    <text class="unknown tname" x="290" y="38">Horo clans</text>
    <path class="peak" d="M312 222 L302 238 L322 238 Z"></path><text class="small" x="326" y="236">Mt Shōgen</text>
    <circle class="ruin" cx="304" cy="258" r="3.5"></circle><text class="small faint" x="312" y="262">Amatsu-kyō</text>
    <rect class="cap" x="481" y="319" width="6" height="6"></rect><text class="small" x="508" y="334">Kinza</text>
    ${kingdoms}
    <text class="water" x="96" y="304">Kurose</text>
    <text class="water" x="592" y="374" text-anchor="end">Eastern Sea</text>
    <rect class="zoom" x="138" y="246" width="82" height="44"></rect><text class="small zoomname" x="140" y="242">Li's eyes</text>
    ${li ? `<circle class="here" cx="${li[0]}" cy="${li[1]}" r="4.5"></circle>` : ''}
    <text class="small" x="${AKAISHI[0] + 8}" y="${AKAISHI[1] + 14}">Akaishi</text>
  </svg>`;
}

/** Ink colours for the world view (the Map tab only). Each kingdom is tinted after its Atlas §6 colours. */
export const WORLD_CSS = `
.mapviews { position: relative; }
.mv-switch { display: inline-flex; margin: 4px 0 20px; padding: 0; border: 1px solid var(--line-2); border-radius: 4px; overflow: hidden; }
.mv-switch legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.mv-switch label { position: relative; display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; padding: 0 18px; color: var(--paper-2); font-size: 16px; cursor: pointer; }
.mv-switch label + label { border-left: 1px solid var(--line-2); }
.mv-switch label:hover { color: var(--paper); }
.mv-switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.mv-switch label:has(input:checked) { background: var(--ink-2); color: var(--paper); font-weight: 600; box-shadow: inset 0 -2px 0 var(--seal); }
.mv-switch label:has(input:focus-visible) { outline: 2px solid var(--gold); outline-offset: -2px; }
@supports selector(:has(*)) {
  .mapviews .mv-world { display: none; }
  .mapviews:has(#mv-world:checked) .mv-world { display: block; }
  .mapviews:has(#mv-world:checked) .mv-li { display: none; }
}
.mv-map { max-width: 760px; }
.mv-key { display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 10px 0 0; font-size: 14px; color: var(--faded); }
.mv-key svg { width: 28px; height: 12px; margin-right: 6px; vertical-align: middle; }
.wcard { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; background: var(--ink-2); border: 1px solid var(--line); border-left: 3px solid var(--line-2); border-radius: 4px; }
.wcard h3 { margin: 0; font: 600 19px var(--display); color: var(--paper); }
.wcard h3 .sub { font: italic 400 15px var(--body); color: var(--faded); }
.wcard p { margin: 0; font-size: 15px; color: var(--paper-2); }
.wcard .size { color: var(--faded); }
.wcard ol, .wcard ul { margin: 4px 0 0; padding-left: 20px; font-size: 15px; color: var(--paper-2); }
.wcard li { margin: 0 0 4px; }
.wcard .open { color: var(--faded); font-style: italic; }
.wcard.c-kurogane { border-left-color: #8E8776; } .wcard.c-suiren { border-left-color: #D8B4BC; } .wcard.c-hayate { border-left-color: #C0704F; }
.wcard.c-ushio { border-left-color: #6F93B8; } .wcard.c-takane { border-left-color: #8DB08F; } .wcard.c-tatara { border-left-color: #D08A4A; }
.wcard.c-kitakaze { border-left-color: #A9B8D0; }
.st-war { color: var(--risk); font-weight: 600; } .st-truce { color: var(--gold); font-weight: 600; } .st-other { color: var(--paper); font-weight: 600; }
.mv-years th { width: 9em; }
.mv-famous { max-width: 760px; }
.wmap .k { stroke: #8E8776; stroke-width: 1.2; stroke-linejoin: round; }
.wmap .k-kurogane { fill: #2A2D33; } .wmap .k-suiren { fill: #2F282C; } .wmap .k-hayate { fill: #33271F; } .wmap .k-ushio { fill: #1C2633; }
.wmap .k-takane { fill: #1F2B24; } .wmap .k-tatara { fill: #35261A; } .wmap .k-kitakaze { fill: #222A36; }
.wmap .k-ruins { fill: #1A1B1E; stroke-dasharray: 2 3; } .wmap .k-kinza { fill: #2E2B20; }
.wmap .tribes { fill: #15181D; }
.wmap .river { stroke-linejoin: round; }
.wmap .kname { font: 600 15px var(--display); fill: var(--paper); text-anchor: middle; letter-spacing: .04em; }
.wmap .capname { font-size: 10.5px; font-style: italic; fill: var(--paper-2); text-anchor: middle; }
.wmap .small { font-size: 10.5px; fill: var(--paper-2); }
.wmap .faint { fill: var(--faded); font-style: italic; }
.wmap .tname { font-style: italic; text-anchor: middle; }
.mapviews .cap { fill: var(--gold); }
.wmap .peak { fill: var(--paper-2); }
.wmap .ruin { fill: none; stroke: var(--faded); stroke-width: 1.5; }
.wmap .zoom { fill: none; stroke: var(--gold); stroke-width: 1; stroke-dasharray: 3 3; }
.wmap .zoomname { fill: var(--gold); }
.mapviews .b-war { fill: none; stroke: #C8452F; stroke-width: 6; stroke-dasharray: 3 5; }
.mapviews .x-war { stroke: var(--risk); stroke-width: 2.5; stroke-linecap: round; }
.mapviews .b-truce { fill: none; stroke: var(--gold); stroke-width: 2.5; stroke-dasharray: 6 4; }
.mapviews .b-tension { fill: none; stroke: var(--faded); stroke-width: 2.5; stroke-dasharray: 1 5; stroke-linecap: round; }
`;
