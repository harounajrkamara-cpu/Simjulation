// Life simulator (owner, Oct 17: "let the machine play thousands of lives"). Whole lives played through the REAL referee
// (engine/gm.ts gmApply: every check Claude's scenes go through), fights in the real duel engine, battles in the real battle
// engine, the world's houses, fuses, aging and kingdoms running as in play. Only Claude's prose is missing: a scripted
// Game Master proposes the changes a scene would. No dice: each life varies by its number in a fixed way.
// Run: npx tsx scripts/life-sim.ts [lives per style, default 20]   → docs/reports/life-sim.md
import { mkdirSync, writeFileSync } from 'node:fs';
import { ageOn } from '../engine/calendar';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { has, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { careerOf } from '../engine/gm-career';
import { battleToEnd } from '../engine/gm-battle';
import { RANK_IDS, rankLevel } from '../engine/career';
import { ladderStep } from '../engine/fate';
import { liAbilities } from '../engine/abilities';
import { houses } from '../engine/houses';
import { FUSES, NEVER } from '../engine/fuses';
import type { GameState } from '../engine/types';

type Style = 'strong' | 'fighter' | 'steady' | 'careful' | 'reckless';
const STYLES: Style[] = ['strong', 'fighter', 'steady', 'careful', 'reckless'];
/** How often (in scenes) a style looks for a fight, does a deed in season, and how strong a foe it takes on. */
const MIX: Record<Style, { fight: number; deed: number; foeUp: number }> = {
  strong: { fight: 3, deed: 1, foeUp: -1 }, fighter: { fight: 2, deed: 2, foeUp: 1 }, steady: { fight: 4, deed: 3, foeUp: 0 }, careful: { fight: 8, deed: 5, foeUp: 0 }, reckless: { fight: 2, deed: 3, foeUp: 2 },
};
const LETTERS = ['F', 'E', 'D', 'C', 'B', 'A'] as const;
const sc = (t: Partial<GmTurn>): GmTurn => ({ scene: 'The days go on.', summary: 'x', ...t });

interface Life { style: Style; n: number; free?: number; route?: string; ranks: Partial<Record<string, number>>; land?: number; married?: number; ladderMax: number; captive: number; injuries: number; zone: boolean; friendsDead: number; betrayals: number; fights: number; won: number; stuckYears: number; endAge: number; endRank: string }

function play(style: Style, n: number): { life: Life; s: GameState } {
  const s = startGmGame(1 + n); // each life its own world (weather, …)
  // Each scene of each life varies in a fixed way (a hash of life and scene): no dice, but no two lives alike.
  const vary = (k: number, salt = 0) => { let h = 7 + n * 131 + salt * 17; for (const ch of String(k * 31 + n)) h = (h * 31 + ch.charCodeAt(0)) % 100_003; return h; };
  const c = s.characters[s.liId];
  const mix = MIX[style];
  const life: Life = { style, n, ranks: {}, ladderMax: 0, captive: 0, injuries: 0, zone: false, friendsDead: 0, betrayals: 0, fights: 0, won: 0, stuckYears: 0, endAge: 0, endRank: 'ashigaru' };
  const age = () => ageOn(c.born, s.date);
  const step = (t: Partial<GmTurn>) => gmApply(s, sc(t));
  let scene = 0, lastRankChange = today(s), lastRank = 'ashigaru';
  const sponsor = 'hagiwara_tadaoki';
  while (age() < 60 && rankLevel(careerOf(s).rank) < 9) {
    scene++;
    const month = s.date.month;
    const inSeason = month >= 4 && month <= 9;
    const free = c.status !== 'slave';
    const changes: GmTurn['changes'] = [{ kind: 'train', focus: vary(scene, 1) % 3 ? 'two_swords' : free ? 'LEA' : 'VAL', days: 20 } as never];
    // Into service: the levy is called in the first summer (a careful boy waits a year).
    if (!has(s, 'levy_service') && month >= 6 && (style !== 'careful' || s.date.year >= 101)) changes.push({ kind: 'service', reason: 'Li steps forward when the Hagiwara levy is called' } as never);
    // Deeds in the campaign season, witnessed (the scripted Game Master's rate by style).
    if (has(s, 'levy_service') && inSeason && vary(scene, 2) % mix.deed === 0) {
      const lvl = rankLevel(careerOf(s).rank);
      changes.push({ kind: 'deed', deed: lvl === 0 ? (vary(scene, 3) % 2 ? 'standard' : 'saved_officer') : (vary(scene, 3) % 2 ? 'won' : 'objective'), reason: 'in the campaign; the officers saw it' } as never);
    }
    // Freedom when a rule allows it (merit law, or an officer's head).
    if (!free && (has(s, 'merit_service') >= 30 || has(s, 'kogashira_head'))) changes.push({ kind: 'freedom', route: has(s, 'kogashira_head') ? 'head' : 'merit' } as never);
    // A sponsor who comes to know and like Li (a superior, Numbers §6).
    if (free && !has(s, `met_${sponsor}`)) changes.push({ kind: 'person', id: sponsor } as never);
    // Good service, scene after scene (it fades over three years, Numbers §8), so the regard must be kept up.
    if (free && has(s, `met_${sponsor}`)) changes.push(...(['trust', 'respect', 'affection'] as const).map((field) => ({ kind: 'relation', npc: sponsor, field, delta: 4, reason: 'Li serves him well' }) as never));
    // The reward ceremony after the season, and the posts it fills.
    if (free && month === 10) changes.push({ kind: 'ceremony', sponsor } as never);
    if (free && (month === 10 || scene % 5 === 0)) changes.push({ kind: 'promotion', reason: 'an officer fell; the post is free', sponsor } as never);
    // Land once he is a Sanbyakunin-shō; a wife at 20; a child every few years.
    if (!s.domain && rankLevel(careerOf(s).rank) >= rankLevel('sanbyakuninsho')) changes.push({ kind: 'land', koku: 300, name: `Village ${n}`, reason: 'granted for the campaign' } as never);
    if (free && age() >= 20 && !has(s, 'met_wife')) changes.push({ kind: 'person', id: 'wife', name: 'Aiko', role: 'a weaver', desc: 'x', goal: 'x', trust: 80, affection: 80 } as never);
    if (free && age() >= 20 && has(s, 'met_wife') && !life.married) { changes.push({ kind: 'marry', npc: 'wife', reason: 'love' } as never); life.married = age(); }
    step({ days: 30, changes });
    // A fight now and then, against the kind of foe this life meets (the duel engine decides it, simulated).
    if (vary(scene, 5) % mix.fight === 0 && !s.duel && (c.wound === 0 || style === 'reckless')) {
      const mine = Math.min(5, Math.floor((c.stats.VAL + Math.max(0, ...Object.values(c.styles))) / 30));
      const foe = LETTERS[Math.min(5, Math.max(0, mine + (vary(scene, 4) % 3) + mix.foeUp - 1))];
      const deadly = has(s, 'levy_service') > 0 && inSeason;
      step({ fight: { foe: 'a Suiren raider', rank: foe, look: 'a raider', deadly, witnessedEnemy: deadly } as never });
      if (s.duel && !s.duel.over) { handleInput(s, '5'); life.fights++; if (s.duel?.result === 'won' || s.events.slice(-30).some((e) => (e.data as { result?: string }).result === 'won')) life.won++; }
      step({ days: 1 });
    }
    // An officer's battle in the season (the battle engine decides it).
    if (rankLevel(careerOf(s).rank) >= 1 && month === 7 && vary(scene, 6) % 2 === 0 && !s.battle) {
      step({ changes: [{ kind: 'battle', name: `The ford, ${s.date.year}`, place: 'the Kurose', sector: 'center', ally: [{ sector: 'center', name: 'Hagiwara foot', men: 1200 }, { sector: 'left', name: 'Kamio spears', men: 800 }], enemy: [{ sector: 'center', name: 'Suiren levy', men: 1000 }, { sector: 'right', name: 'Tōno riders', men: 600, cavalry: 0.6 }] } as never] });
      battleToEnd(s);
      step({ days: 1 });
    }
    // Watch the life.
    const rank = careerOf(s).rank;
    if (rank !== lastRank) { life.ranks[rank] = age(); lastRank = rank; lastRankChange = today(s); }
    if (free && !life.free) { life.free = age(); life.route = String(s.events.slice().reverse().find((e) => e.type === 'status' && (e.data as { char?: string }).char === s.liId)?.fact ?? ''); }
    life.ladderMax = Math.max(life.ladderMax, ladderStep(s));
    if (has(s, 'captive')) life.captive++;
    if (today(s) - lastRankChange > 3 * 360 && free) { life.stuckYears = Math.max(life.stuckYears, Math.floor((today(s) - lastRankChange) / 360)); }
  }
  life.injuries = Object.keys(s.flags).filter((k) => k.startsWith('injury_li_')).length;
  life.zone = liAbilities(s).some((a) => a.id === 'zone');
  life.friendsDead = Object.keys(s.relations).filter((id) => has(s, `met_${id}`) && s.characters[id] && !s.characters[id].alive).length;
  life.betrayals = (s.gm?.clocks ?? []).filter((x) => x.id.startsWith('betray_')).length;
  life.endAge = age();
  life.endRank = careerOf(s).rank;
  return { life, s };
}

const perStyle = Number(process.argv[2] ?? 20);
const lives: Life[] = [];
let world: GameState | undefined;
const t0 = Date.now();
for (const style of STYLES) for (let n = 0; n < perStyle; n++) { const r = play(style, n); lives.push(r.life); world ??= r.s; }
const secs = ((Date.now() - t0) / 1000).toFixed(0);

const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—');
const pct = (xs: Life[], f: (l: Life) => boolean) => `${Math.round((100 * xs.filter(f).length) / Math.max(1, xs.length))}%`;
const rows = STYLES.map((st) => {
  const ls = lives.filter((l) => l.style === st);
  const rankAge = (r: string) => avg(ls.map((l) => l.ranks[r]).filter((x): x is number => x !== undefined));
  return `| ${st} | ${avg(ls.filter((l) => l.free).map((l) => l.free!))} (${pct(ls, (l) => !!l.free)}) | ${rankAge('gocho')} | ${rankAge('kogashira')} | ${rankAge('hyakuningashira')} | ${rankAge('sanbyakuninsho')} | ${rankAge('senninsho')} | ${rankAge('taisho')} | ${pct(ls, (l) => l.endRank === 'daishogun')} | ${avg(ls.map((l) => l.won / Math.max(1, l.fights) * 100))}% | ${avg(ls.map((l) => l.ladderMax))} | ${pct(ls, (l) => l.captive > 0)} | ${avg(ls.map((l) => l.injuries))} | ${pct(ls, (l) => l.zone)} | ${avg(ls.map((l) => l.friendsDead))} | ${avg(ls.map((l) => l.betrayals))} | ${Math.max(...ls.map((l) => l.stuckYears))} |`;
});
const w = world!;
const report = [
  '# Life simulator report',
  '',
  `${lives.length} lives (${perStyle} per play style), ${secs} s. Played through the real referee, duel engine and battle engine (\`scripts/life-sim.ts\`). A scripted Game Master stands in for Claude, so the story is missing; the rules are not. Re-run: \`npx tsx scripts/life-sim.ts ${perStyle}\`.`,
  '',
  '**Targets** (Numbers §12, strong player in Kurogane): freedom 13–15 · Gochō ~15 · Kogashira ~16 · Hyakunin-gashira 18–19 · Sanbyakunin-shō + land 20–21 · Sennin-shō 22–24 · Taishō 27–32 · Dai-Shōgun 32+ (rare) · no career stuck more than 3 years.',
  '',
  '| Style | Free at (share) | Gochō | Kogashira | Hyakunin | Sanbyakunin | Sennin | Taishō | Dai-Shōgun | Fights won | Ladder max | Ever captive | Injuries | Zone woke | Friends dead | Betrayals | Most years stuck |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  `**One world after a full life** (life 1): houses ${houses(w).length} (split off by gekokujō: ${houses(w).filter((h) => h.id.includes('_') && !['li'].includes(h.id) && !['asagiri', 'hasunuma'].includes(h.id) && h.land.startsWith('land torn')).length}); fuses: ${FUSES.map((f) => `${f.name} ${has(w, `fuse_${f.id}`) === NEVER ? 'never happened' : f.outcomes[has(w, `fuse_${f.id}`) - 1]?.id ?? 'not yet'}`).join(' · ')}; world people dead by the end: ${Object.values(w.characters).filter((x) => x.world && !x.alive).length} of ${Object.values(w.characters).filter((x) => x.world).length}.`,
  '',
  'Styles: **fighter** looks for a fight every 2nd scene and does many deeds; **steady** every 4th; **careful** every 8th, joins the levy a year later; **reckless** fights foes two ranks above him.',
].join('\n');
mkdirSync('docs/reports', { recursive: true });
writeFileSync('docs/reports/life-sim.md', report);
console.log(report);
