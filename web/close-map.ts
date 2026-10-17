import { GameState } from '../engine/types';
import { PLACES } from '../engine/data';

// The close-up map (owner wish Oct 11: "here is the drill field, the cook fire, the tents, you are here"; later Li's own
// land with real upgrades; goal Oct 17). The camp places come from Li's life sheet; Li's place is read from his recorded
// location. The land shows what the code built (engine/domain.ts projects).

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** Camp places: [label, words that mean Li is there, x, y]. */
const CAMP: [string, RegExp, number, number][] = [
  ["Raizen's tent", /raizen'?s tent|crane tent|the tent with the/i, 300, 70],
  ['Cook fire', /cook ?fire|sukez|stewpot|kitchen/i, 190, 150],
  ["Soldiers' fire", /soldiers'? fire/i, 410, 150],
  ['Horse lines', /horse lines?|stable|horses/i, 110, 240],
  ['Fodder store', /fodder|store|oats/i, 250, 250],
  ['Drill field', /drill|practice field|training ground/i, 430, 260],
  ['Palisade gate', /gate|palisade/i, 300, 330],
  ['Kurose ford', /ford|kurose|river/i, 540, 330],
];

const PROJECTS: Record<string, [string, number, number]> = {
  watchtower: ['Watchtower', 90, 70], barracks: ['Barracks', 220, 80], farmland: ['New fields', 470, 250], market: ['Market', 330, 170],
  roads: ['Roads', 330, 300], smithy: ['Smithy', 160, 190], walls: ['Walls', 330, 40], school: ['School', 470, 120], shrine: ['Shrine', 120, 300],
};

export function closeMapHtml(s: GameState): string {
  const d = s.domain;
  if (d) {
    const built = new Set(d.built);
    const running = new Set(d.projects.map((p) => p.kind));
    const items = Object.entries(PROJECTS).map(([k, [label, x, y]]) => {
      const cls = built.has(k as never) ? 'built' : running.has(k as never) ? 'building' : 'empty';
      return `<g class="cm-p ${cls}"><rect x="${x - 46}" y="${y - 18}" width="92" height="36" rx="4"/><text x="${x}" y="${y + 4}" text-anchor="middle">${esc(label)}${cls === 'building' ? ' …' : ''}</text></g>`;
    }).join('');
    return `<p class="lead">${esc(d.name)}: about ${d.koku.toLocaleString('en-US')} koku a year. Built places stand solid; places being built show scaffolding; the rest is open ground.</p>
      <svg class="closemap" viewBox="0 0 600 360" role="img" aria-label="Li's land, close up"><rect x="4" y="4" width="592" height="352" rx="6" class="cm-ground"/>
      <g class="cm-p hall"><rect x="280" y="140" width="100" height="40" rx="4"/><text x="330" y="165" text-anchor="middle">Li's hall</text></g>${items}</svg>
      <p class="mv-key"><span>Solid: built</span><span>Dashed: being built</span><span>Faint: not yet</span></p>`;
  }
  const where = PLACES[s.characters[s.liId].location] ?? s.characters[s.liId].location;
  const here = CAMP.findIndex(([, re]) => re.test(where));
  const spots = CAMP.map(([label, , x, y], k) => `<g class="cm-p${k === here ? ' here' : ''}"><rect x="${x - 58}" y="${y - 18}" width="116" height="36" rx="4"/><text x="${x}" y="${y + 4}" text-anchor="middle">${esc(label)}</text></g>`).join('');
  const marker = here >= 0 ? `<g class="cm-li"><circle cx="${CAMP[here][2] + 52}" cy="${CAMP[here][3] - 18}" r="8"/><text x="${CAMP[here][2] + 64}" y="${CAMP[here][3] - 14}">Li is here</text></g>` : '';
  return `<p class="lead">The Red Crane camp below Kōri fort, as Li walks it every day.${here < 0 ? ` Li is at: ${esc(where)}.` : ''}</p>
    <svg class="closemap" viewBox="0 0 600 360" role="img" aria-label="The camp, close up"><rect x="4" y="4" width="592" height="352" rx="6" class="cm-ground"/>
    <path d="M520 360 C540 300 580 280 600 250 L600 360 Z" class="cm-water"/>${spots}${marker}</svg>`;
}

export const CLOSE_CSS = `
.closemap { width: 100%; max-width: 760px; height: auto; display: block; }
.closemap .cm-ground { fill: var(--ink-2); stroke: var(--line); }
.closemap .cm-water { fill: #2B3C4E; opacity: .8; }
.closemap .cm-p rect { fill: var(--ink); stroke: var(--line-2); stroke-width: 1.5; }
.closemap .cm-p text { font-family: var(--body); font-size: 13px; fill: var(--paper-2); }
.closemap .cm-p.here rect, .closemap .cm-p.hall rect, .closemap .cm-p.built rect { stroke: var(--gold); }
.closemap .cm-p.building rect { stroke: var(--gold); stroke-dasharray: 5 4; }
.closemap .cm-p.empty { opacity: .45; }
.closemap .cm-li circle { fill: var(--seal); }
.closemap .cm-li text { font-family: var(--body); font-size: 13px; fill: var(--paper); font-weight: 600; }
.mapviews .mv-near { display: none; }
.mapviews:has(#mv-near:checked) .mv-near { display: block; }
.mapviews:has(#mv-near:checked) .mv-li { display: none; }
`;
