import { Group, reputation, reputationMerit } from './reputation';
import { NICKNAME_GROUPS, NICKNAME_RULES, ceremonyWitnessDrafts, recentDeed } from './moments';
import { inService } from './campaign';
import {
  Bond, CombatDeed, CommandDeed, Deed, KingdomId, MeritLedger, PoliticalDeed, RANK_IDS, RankId, ceremonyRewardMon, checkPromotion, meritOf, nextRank,
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
export const ARMY: Record<KingdomId, number> = { kurogane: 150_000, suiren: 220_000, hayate: 90_000, ushio: 100_000, takane: 55_000, tatara: 25_000, kitakaze: 45_000 };

const COMBAT: CombatDeed[] = ['standard', 'first_over_wall', 'saved_officer', 'scouting'];
const COMMAND: CommandDeed[] = ['objective', 'won', 'low_losses', 'withdrawal', 'steady_morale', 'supply_kept', 'disobeyed_paid_off', 'disobeyed_failed'];
const POLITICAL: PoliticalDeed[] = ['negotiation', 'intelligence', 'governance', 'civilians'];
/** At most this many deeds count in one scene (Claude cannot shower merit). */
export const DEEDS_PER_SCENE = 2;

export interface Career { rank: RankId; merit: MeritLedger; bond: Bond; kingdom: KingdomId }

/** Li's career as the code holds it. Li was born a peasant's son and enslaved: low-born, and "freed" once free (ch. 3). */
export function careerOf(s: GameState): Career {
  const c = li(s);
  // The kingdom he serves NOW (a 'serving' flag, set on every change of side); older saves: the last 'serves_' key.
  const served = (KINGDOMS[has(s, 'serving') - 1] ?? s.knowledge.filter((k) => k.startsWith('serves_')).at(-1)?.slice(7)) as KingdomId | undefined;
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
    vacancy: !!reason, sponsorOpinion: sponsor ? opinion(s.relations[sponsor], today(s)) : undefined, reputation: reputationMerit(s),
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
  if (careerOf(s).kingdom === kingdom && (has(s, 'serving') > 0 || s.knowledge.includes(`serves_${kingdom}`))) return [];
  return [
    ...(s.knowledge.includes(`serves_${kingdom}`) ? [] : [{ type: 'knowledge' as const, fact: `Li serves ${KINGDOM_NAME[kingdom as KingdomId]}`, visible: true, data: { key: `serves_${kingdom}` } }]),
    { type: 'flag', fact: `Li now serves ${KINGDOM_NAME[kingdom as KingdomId]}`, visible: true, data: { key: 'serving', value: KINGDOMS.indexOf(kingdom as KingdomId) + 1 } },
  ];
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
    const chk = checkPromotion({ rank: car.rank, merit: car.merit, birth: 'commoner', bond: car.bond, kingdom: car.kingdom, armyMen: ARMY[car.kingdom], vacancy: true, reputation: reputationMerit(s) });
    lines.push(`Next: ${rankLabel(next)}: score ${chk.score} of ${chk.needed}${chk.blocks.length ? ` (blocked now: ${chk.blocks.map((b) => b.reason).join('; ')})` : ' (ready when a post opens)'}.`);
  }
  // The Army tab lists the people who serve under Li by their role (goal Oct 17).
  if (rankLevel(car.rank) >= rankLevel('gocho')) lines.push('When someone comes to serve under Li, give them a role that says so ("role": "Gochō under Li", "Li\'s lieutenant"): the Army tab lists them.');
  const titles = titlesOf(s);
  if (titles.length) lines.push(`Titles the world gives him: ${titles.map((t) => `"${t}"`).join(', ')}.`);
  lines.push('Propose deeds Li truly did with witnesses ("deed"), and a promotion only when a post opens or at a reward ceremony ("promotion", naming why the post is free and, from Sanbyakunin-shō up, the sponsor). After a campaign, hold a reward ceremony ("ceremony"); the code pays merit and fills posts. Titles come from deeds ("title").');
  return lines.join('\n');
}

// ---------- reward ceremonies, titles and fame (World Bible ch. 4, 8; Numbers §7) ----------

const meritTotal = (m: MeritLedger) => m.combat + m.command + m.political;

/**
 * A reward ceremony after a campaign: 0.1 ryō per merit point earned since the last ceremony (slaves get none, Numbers
 * §7), and the ceremony fills free posts, so a promotion is tried (Numbers §6: vacancies are filled at ceremonies).
 */
export function ceremonyDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const car = careerOf(s);
  const total = meritTotal(car.merit);
  const earned = total - has(s, 'merit_ceremony');
  if (earned <= 0) { notes.push('no new merit since the last ceremony: Li stands in the crowd'); return []; }
  const reward = ceremonyRewardMon(earned, car.bond);
  const out: Draft[] = [{ type: 'flag', fact: 'ceremony held', visible: false, data: { key: 'merit_ceremony', value: total } }];
  out.push({
    type: 'story', fact: `Reward ceremony: Li's merit in this campaign is ${earned}.${reward ? '' : ' A slave receives no reward.'}`, visible: true,
    journal: `At the reward ceremony my merit was counted: ${earned}.${reward ? ` I was given ${reward} mon.` : ''}`, data: { ceremony: true, earned },
  });
  // Who stands there and how each reacts, remembered (GE ch. 3 ceremony screen; Phase 6 block D).
  out.push(...ceremonyWitnessDrafts(s, 'The reward ceremony', 'ceremony', `saw Li's merit counted at the reward ceremony (${earned})`));
  if (reward) out.push({ type: 'money', fact: `Li gets ${reward} mon (ceremony reward, 0.1 ryō per merit)`, visible: true, data: { amount: reward } });
  out.push(...promotionDrafts(s, { reason: 'the reward ceremony fills the posts left open by the campaign', sponsor: x.sponsor }, notes));
  return out;
}

/** A title or nickname the world gives Li for a deed (it spreads as rumour; never self-given). */
export function titleDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const title = typeof x.title === 'string' ? x.title.trim().slice(0, 50) : '';
  const reason = typeof x.reason === 'string' ? x.reason.trim().slice(0, 160) : '';
  if (!title || !reason) { notes.push('a title needs a name and the deed behind it'); return []; }
  const key = `title_${title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  if (s.knowledge.includes(key)) return [];
  // Nicknames per group (GE 3b, Phase 6 block D): a group names Li only after a recent deed, and once it has heard of him.
  const group = typeof x.group === 'string' ? x.group : undefined;
  if (group) {
    if (!(NICKNAME_GROUPS as readonly string[]).includes(group)) { notes.push(`no group "${group}" (soldiers, nobles, peasants, enemies)`); return []; }
    if (!recentDeed(s)) { notes.push(`the ${group} name Li only after a deed they saw or heard of (none in the last ${NICKNAME_RULES.recentDays} days)`); return []; }
    if (reputation(s, group as Group) < NICKNAME_RULES.regard) { notes.push(`the ${group} have not heard enough of Li to name him`); return []; }
  }
  const who = group ? `The ${group}` : 'People';
  return [{ type: 'knowledge', fact: `${who} call Li "${title}" (${reason})`, visible: true, journal: `${group ? `The ${group} have` : 'They have'} started to call me "${title}".`, data: { key, title, reason, group } }];
}

/** Titles the world gives Li, oldest first. */
export function titlesOf(s: GameState): string[] {
  return s.events.flatMap((e) => (e.type === 'knowledge' && typeof (e.data as { title?: unknown }).title === 'string' ? [(e.data as { title: string }).title] : []));
}
