import { inService } from './campaign';
import {
  Bond, CombatDeed, CommandDeed, Deed, KingdomId, MeritLedger, PoliticalDeed, RANK_IDS, RankId, checkPromotion, meritOf, nextRank,
  rankInfo, rankLabel, rankLevel, sizeClassOfRank,
} from './career';
import { has, li, today } from './engine';
import { opinion } from './relations';
import { Draft, GameState } from './types';

// Li's career in Game Master mode (World Bible ch. 4, Numbers §6): Claude proposes deeds and promotions, the code decides
// them with engine/career.ts. Merit is kept in flags (merit_combat, merit_command, merit_political) and the command rank as
// rank_level (0 = Ashigaru … 9 = Dai-Shōgun). A blocked promotion shows Li the reason (the barrier is shown, not hidden).

const KINGDOMS: KingdomId[] = ['kurogane', 'suiren', 'hayate', 'ushio', 'takane', 'tatara', 'kitakaze'];
const KINGDOM_NAME: Record<KingdomId, string> = {
  kurogane: 'Kurogane', suiren: 'Suiren', hayate: 'Hayate', ushio: 'Ushio', takane: 'Takane', tatara: 'Tatara', kitakaze: 'Kitakaze',
};
/** Standing armies (World Bible ch. 13, about): Rule 1 reads the army Li serves. */
const ARMY: Record<KingdomId, number> = { kurogane: 150_000, suiren: 220_000, hayate: 90_000, ushio: 100_000, takane: 55_000, tatara: 25_000, kitakaze: 45_000 };

const COMBAT: CombatDeed[] = ['standard', 'first_over_wall', 'saved_officer', 'scouting'];
const COMMAND: CommandDeed[] = ['objective', 'won', 'low_losses', 'withdrawal', 'steady_morale', 'supply_kept', 'disobeyed_paid_off', 'disobeyed_failed'];
const POLITICAL: PoliticalDeed[] = ['negotiation', 'intelligence', 'governance', 'civilians'];
/** At most this many deeds count in one scene (Claude cannot shower merit). */
export const DEEDS_PER_SCENE = 2;

export interface Career { rank: RankId; merit: MeritLedger; bond: Bond; kingdom: KingdomId }

/** Li's career as the code holds it. Li was born a peasant's son and enslaved: low-born, and "freed" once free (ch. 3). */
export function careerOf(s: GameState): Career {
  const c = li(s);
  const served = s.knowledge.find((k) => k.startsWith('serves_'))?.slice(7) as KingdomId | undefined;
  return {
    rank: RANK_IDS[Math.max(0, Math.min(9, has(s, 'rank_level')))],
    merit: { combat: has(s, 'merit_combat'), command: has(s, 'merit_command'), political: has(s, 'merit_political') },
    bond: c.status === 'slave' ? 'slave' : 'freed',
    kingdom: served && KINGDOMS.includes(served) ? served : 'kurogane',
  };
}

/** One deed Claude proposes, checked: real deeds only, merit from the table, never a kill (fights the code runs give those). */
export function deedDrafts(s: GameState, x: Record<string, unknown>, count: number, notes: string[], pending: Record<string, number> = {}): Draft[] {
  const name = String(x.deed ?? '');
  const reason = typeof x.reason === 'string' && x.reason.trim() ? x.reason.trim().slice(0, 160) : '';
  if (count >= DEEDS_PER_SCENE) { notes.push(`deed "${name}" not counted: at most ${DEEDS_PER_SCENE} deeds count in one scene`); return []; }
  if (!reason) { notes.push(`deed "${name}" not counted: merit needs witnesses and a reason`); return []; }
  const car = careerOf(s);
  let deed: Deed;
  if (COMBAT.includes(name as CombatDeed)) deed = { kind: name as CombatDeed };
  else if (COMMAND.includes(name as CommandDeed)) {
    if (car.rank === 'ashigaru') { notes.push(`deed "${name}" not counted: Li leads no unit yet`); return []; }
    deed = { kind: 'command', deed: name as CommandDeed, unit: car.rank };
  } else if (POLITICAL.includes(name as PoliticalDeed)) deed = { kind: 'political', deed: name as PoliticalDeed, amount: Number(x.amount) || 0 };
  else { notes.push(`unknown deed "${name}" ignored (kills and heads count only through fights the code runs)`); return []; }
  if (car.bond === 'slave' && !inService(s)) { notes.push(`deed "${name}" not counted: a slave earns merit only in official service`); return []; }
  const m = meritOf(deed);
  if (!m.amount) return [];
  // Several deeds in one scene add up: `pending` holds what this scene already added (flags are written as totals).
  const add = (key: string, n: number) => { const v = has(s, key) + (pending[key] ?? 0) + n; pending[key] = (pending[key] ?? 0) + n; return v; };
  const key = `merit_${m.kind}`;
  const out: Draft[] = [{ type: 'flag', fact: `${m.kind} merit ${m.amount > 0 ? '+' : ''}${m.amount} (${reason})`, visible: true, data: { key, value: add(key, m.amount) } }];
  // Combat and command merit in Kurogane service also count toward the merit law (Numbers §6: 30 combat + command).
  if (m.kind !== 'political' && inService(s) && car.kingdom === 'kurogane') {
    const v = Math.max(0, add('merit_service', m.amount));
    out.push({ type: 'flag', fact: `merit in Kurogane service: ${v}`, visible: true, data: { key: 'merit_service', value: v } });
  }
  return out;
}

/** A promotion Claude proposes (a ceremony, a post that opened), decided by Numbers §6. Blocks are shown to Li with their reason. */
export function promotionDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const car = careerOf(s);
  const reason = typeof x.reason === 'string' ? x.reason.trim().slice(0, 160) : '';
  const sponsor = typeof x.sponsor === 'string' && s.relations[x.sponsor] ? x.sponsor : undefined;
  const chk = checkPromotion({
    rank: car.rank, merit: car.merit, birth: 'commoner', bond: car.bond, kingdom: car.kingdom, armyMen: ARMY[car.kingdom],
    vacancy: !!reason, sponsorOpinion: sponsor ? opinion(s.relations[sponsor], today(s)) : undefined,
  });
  if (!chk.ok || !chk.target) {
    notes.push(`not promoted${chk.target ? ` to ${rankInfo(chk.target).title}` : ''}: ${chk.blocks.map((b) => (b.code === 'vacancy' ? 'no free position was named' : b.reason)).join('; ')}`);
    return [];
  }
  const label = rankLabel(chk.target);
  return [
    { type: 'flag', fact: `rank: ${label}`, visible: false, data: { key: 'rank_level', value: rankLevel(chk.target) } },
    { type: 'status', fact: `Li is promoted to ${label}`, visible: true, journal: `I was made ${label}. ${reason}`.trim(), data: { char: s.liId, status: li(s).status, role: `${label} in ${KINGDOM_NAME[car.kingdom]} service` } },
  ];
}

/** Li now serves another kingdom (VISIE: allegiance is free). */
export function serveDrafts(s: GameState, kingdom: string, notes: string[]): Draft[] {
  if (!KINGDOMS.includes(kingdom as KingdomId)) { notes.push(`unknown kingdom "${kingdom}"`); return []; }
  if (careerOf(s).kingdom === kingdom && s.knowledge.includes(`serves_${kingdom}`)) return [];
  return [{ type: 'knowledge', fact: `Li serves ${KINGDOM_NAME[kingdom as KingdomId]}`, visible: true, data: { key: `serves_${kingdom}` } }];
}

/** The career block of Claude's memory: what Li holds and what the next step needs. */
export function careerText(s: GameState): string {
  const car = careerOf(s);
  const next = nextRank(car.rank);
  const lines = [
    `CAREER (the code decides merit and promotions; World Bible ch. 4): rank ${rankLabel(car.rank)}${car.rank === 'ashigaru' && car.bond === 'slave' ? ' (a slave, not a soldier yet)' : ''}, serves ${KINGDOM_NAME[car.kingdom]}${car.bond === 'freed' ? ', a freed slave (low-born: nobles grumble, promotions need more)' : ''}.`,
    `Merit (whole career): combat ${car.merit.combat}, command ${car.merit.command}, political ${car.merit.political}. Unit size class ${sizeClassOfRank(car.rank)}.`,
  ];
  if (next) {
    const chk = checkPromotion({ rank: car.rank, merit: car.merit, birth: 'commoner', bond: car.bond, kingdom: car.kingdom, armyMen: ARMY[car.kingdom], vacancy: true });
    lines.push(`Next: ${rankLabel(next)}: score ${chk.score} of ${chk.needed}${chk.blocks.length ? ` (blocked now: ${chk.blocks.map((b) => b.reason).join('; ')})` : ' (ready when a post opens)'}.`);
  }
  lines.push('Propose deeds Li truly did with witnesses ("deed"), and a promotion only when a post opens or at a reward ceremony ("promotion", naming why the post is free and, from Sanbyakunin-shō up, the sponsor).');
  return lines.join('\n');
}
