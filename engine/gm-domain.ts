import { WEATHER_LOSS, weatherOf } from './texture';
import { dateFromIndex } from './calendar';
import { checkLandGrant, rankLevel } from './career';
import {
  Domain, PROJECTS, PROJECT_KINDS, ProjectKind, TAX_MAX, TAX_MIN, domainSummary, endMonth, formatMon, newDomain, setManager, setStanding, setTaxRate, startProject,
} from './domain';
import { has, today } from './engine';
import { careerOf } from './gm-career';
import { Draft, GameState } from './types';

// Li's land in Game Master mode (World Bible ch. 7, Numbers §7; owner vision: kept light, family or officers run it, Li
// gives the big orders). Claude proposes grants, projects and orders; the code checks them and runs every month that
// passes (projects finish, harvest and tax day at the end of Month 9, wages, desertion). Every change is a 'domain' event
// holding the land's state, so saves replay it. Several changes in one scene build on each other (the `cur` argument). Pure.

/** Hidden Crown Authority per kingdom (World Bible ch. 13b): it sets the share sent to the Crown. */
const AUTHORITY: Record<string, number> = { kurogane: 55, suiren: 25, hayate: 50, ushio: 30, takane: 60, tatara: 95, kitakaze: 40 };

const snap = (d: Domain, fact: string, visible = true, extra: Record<string, unknown> = {}): Draft => ({ type: 'domain', fact, visible, data: { domain: d, ...extra } });

/** A land grant (a ceremony, a promotion to Sanbyakunin-shō or higher): its size is checked against the rank (Numbers §7). */
export function landDrafts(s: GameState, x: Record<string, unknown>, notes: string[], cur: Domain | null | undefined = s.domain): Draft[] {
  const car = careerOf(s);
  if (rankLevel(car.rank) < rankLevel('sanbyakuninsho')) { notes.push('land is granted only from Sanbyakunin-shō up (below that, rewards are pay and gold)'); return []; }
  const asked = Number(x.koku) || 0;
  const koku = checkLandGrant(car.rank, asked || 1);
  if (asked && koku !== asked) notes.push(`land grant set to ${koku} koku (the range for ${car.rank} by the Numbers Sheet)`);
  const name = typeof x.name === 'string' && x.name.trim() ? x.name.trim().slice(0, 60) : 'Li\'s land';
  const old = cur;
  if (old && old.koku >= koku) { notes.push(`Li already holds ${old.koku} koku: the grant adds nothing`); return []; }
  // New land comes with its stores: about half a year's tax in the storehouse, and the duty garrison.
  const d = old
    ? { ...old, koku, name, population: Math.max(old.population, koku) }
    : newDomain({ id: 'li_land', name, koku, crownAuthority: AUTHORITY[car.kingdom] ?? 50, wallets: { li: 0, unit: 0, treasury: Math.round(koku * 0.5 * 0.5 * 1000) } });
  return [
    snap(d, `Li receives land: ${name}, about ${koku.toLocaleString('en-US')} koku a year.`),
    { type: 'flag', fact: `land ${koku} koku`, visible: false, data: { key: 'land_koku', value: koku } },
  ];
}

/** A project on Li's land (watchtower, barracks, farmland, market, roads, smithy, walls, school, shrine). */
export function projectDrafts(s: GameState, x: Record<string, unknown>, notes: string[], cur: Domain | null | undefined = s.domain): Draft[] {
  const d = cur;
  const kind = String(x.project ?? '') as ProjectKind;
  if (!d) { notes.push('Li holds no land to build on'); return []; }
  if (!PROJECT_KINDS.includes(kind)) { notes.push(`unknown project "${kind}"`); return []; }
  const r = startProject(d, kind, today(s), 'li');
  if (!r.ok) { notes.push(`${PROJECTS[kind].name} not started: ${r.reason}`); return []; }
  const p = r.domain.projects.at(-1)!;
  return [snap(r.domain, `${PROJECTS[kind].name} begun on ${d.name}: ${formatMon(p.costMon)}, ${p.workers} workers, ${p.doneDay - p.startDay} days.`)];
}

/** Li's big orders for his land: tax rate, who runs it, the garrison, relief and upkeep. */
export function domainOrderDrafts(s: GameState, x: Record<string, unknown>, notes: string[], cur: Domain | null | undefined = s.domain): Draft[] {
  let d = cur;
  if (!d) { notes.push('Li holds no land to give orders for'); return []; }
  const said: string[] = [];
  if (x.tax !== undefined) {
    const t = Number(x.tax) > 1 ? Number(x.tax) / 100 : Number(x.tax);
    d = setTaxRate(d, t);
    if (t < TAX_MIN || t > TAX_MAX) notes.push(`tax set to ${Math.round(d.taxRate * 100)}% (40–60% by the Numbers Sheet)`);
    said.push(`tax ${Math.round(d.taxRate * 100)}%`);
  }
  if (typeof x.manager === 'string') {
    if (x.manager === 'li' || s.characters[x.manager]) { d = setManager(d, x.manager); said.push(`run by ${x.manager === 'li' ? 'Li himself' : s.characters[x.manager].name}`); }
    else notes.push(`unknown steward "${x.manager}"`);
  }
  if (x.standing !== undefined) { d = setStanding(d, Number(x.standing) || 0); said.push(`${d.standing} men kept under arms`); }
  if (typeof x.relief === 'boolean') { d = { ...d, relief: x.relief }; said.push(x.relief ? 'the storehouse feeds the villages in a famine' : 'no famine relief'); }
  if (typeof x.maintain === 'boolean') { d = { ...d, maintain: x.maintain }; said.push(x.maintain ? 'dikes kept in repair' : 'dikes left alone'); }
  return said.length ? [snap(d, `Orders for ${d.name}: ${said.join(', ')}.`)] : [];
}

/** Every month that ends between two days: the land runs on its own (projects, harvest and tax day, wages, desertion). */
export function domainMonthDrafts(s: GameState, from: number, to: number): Draft[] {
  let d = s.domain;
  if (!d || to <= from) return [];
  const out: Draft[] = [];
  for (let k = from + 1; k <= to; k++) {
    if (k % 30 !== 0) continue; // day 1 of a month: the month before has ended
    const ended = dateFromIndex(k - 1);
    // The year's weather where the land lies reaches the harvest at tax day (engine/texture.ts).
    if (ended.month === 9) d = { ...d, weather: WEATHER_LOSS[weatherOf(s, careerOf(s).kingdom, ended.year)] };
    const step = endMonth(d, ended.year, ended.month);
    d = step.domain;
    const news = step.events.filter((e) => !['maintenance'].includes(e.kind)).map((e) => e.text);
    out.push(snap(d, news.length ? `${d.name}, end of Month ${ended.month}: ${news.join(' ')}` : `${d.name}: a quiet month.`, news.length > 0, { month: ended.month, year: ended.year }));
  }
  return out;
}

/** The land block of Claude's memory (no hidden values: the Crown Authority stays out). */
export function domainText(s: GameState): string {
  const d = s.domain;
  if (!d) return '';
  const v = domainSummary(d, today(s));
  const projects = v.projects.map((p) => `${p.name} (${p.daysLeft} days left)`).join(', ') || 'none';
  return `LI'S LAND: ${v.name}, ${v.land}. Treasury ${v.treasury}; tax ${v.tax}; the villages are ${v.peasants}; ${v.army.standing} men under arms (duty ${v.army.duty}${v.army.belowDuty ? ', BELOW the duty' : ''}); run by ${d.manager === 'li' ? 'Li himself' : s.characters[d.manager]?.name ?? d.manager}. Projects: ${projects}. Big orders only ("domain", "project"); the land runs on by itself each month.`;
}

/** For the dashboard (Li page and side panel). */
export function domainLines(s: GameState): string[] {
  const d = s.domain;
  if (!d) return [];
  const v = domainSummary(d, today(s));
  return [
    `${v.name} · ${v.land}`,
    `Treasury ${v.treasury} · tax ${v.tax} · villages ${v.peasants}`,
    `${v.army.standing} men under arms (duty ${v.army.duty})${v.army.belowDuty ? ' · below the duty' : ''}`,
    ...v.projects.map((p) => `Building: ${p.name} · ${p.daysLeft} days left`),
  ];
}

export const holdsLand = (s: GameState) => has(s, 'land_koku') > 0;
