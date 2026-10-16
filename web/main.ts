import { AiAdapter, PERMANENT, errorCode } from '../ai/adapter';
import { Reading, interpret } from '../ai/interpret';
import { Narration, narrate, shouldNarrate, templateText } from '../ai/narrate';
import { FactPacket, buildPacket } from '../ai/packet';
import { commitDrafts, fromSave, li, liAge, met, options, recordNote, toSave } from '../engine/engine';
import { planDrafts, PlanId } from '../engine/plan';
import { chooseTechniqueDrafts } from '../engine/abilities';
import type { CeremonyView } from '../engine/moments';
import { SparkSnapshot, sparkSnapshot, sparksSince } from '../engine/sparks';
/** The state after the last painted scene, for sparks; unset until the first scene of this page visit. */
let sparkMark: SparkSnapshot | undefined;
import { Reply, handleAction, handleInput, newGame, parseFreeText } from '../engine/game';
import { SkipSummary, summaryText } from '../engine/summary';
import { GmChange, gmApplyFix, gmOn, gmRewind, lastFightResult } from '../engine/gm';
import { afterPeak, lastPlan, nonEvent } from '../engine/pacing';
import { GmFixProposal, GmPlay, gmChapter, gmEpilogue, gmFix, gmSkip, gmTurn } from '../ai/gm';
import { canRetire, ended, oldAge } from '../engine/epilogue';
import { CHILDHOOD, TIME_JUMP, beginLife } from '../engine/prologue';
import { BattleState, MAX_PHASES, Order, battleView, ordersFor } from '../engine/battle';
import { battlePhase, battleToEnd } from '../engine/gm-battle';
import { domainLines } from '../engine/gm-domain';
import { changesLine, duelPanel, growthSnapshot, noticeable, progressChips } from '../engine/render';
import { GameEvent } from '../engine/types';
import { lastPeakDay, phase as directorPhase } from '../engine/director';
import { WOUND_LABEL } from '../engine/rules';
import { PROLOGUE, Slide } from '../engine/content';
import { GameState } from '../engine/types';
import { pageAdapter, pageDownload } from './ai-page';
import * as Film from './films/runtime';
import * as Scenes from './films/scenes';
import { loadFromCloud, saveToCloud } from './cloud-save';
import { aiVoicePossible, onAiStatus, warmAiVoice } from './voice-ai';
import { GEORGE, narrate as speak, narratorAvailable, narratorOn, narratorRate, narratorVoice, setNarrator, stopNarrator, voices } from './narrator';
import { COMMANDS, Guidance, HOW_TO_PLAY, exampleLines, nextHint, termify } from './guide';
import { ask as askGuide, isQuestion, questionOf } from './ask';
import {
  armyPage, chronicle, encyclopediaPage, goalsHtml, growthHtml, esc, journalPage, knownEntries, liCard, liPage, mapPage, mapSvg, peoplePage, plain, scene, strip,
} from './panels';

// Browser mode: the war chronicle (Game Experience ch. 3, 6). Same engine and save format as the terminal and chat modes.
const KEY = 'sengoku-soldier-save';
// Save slots (World Bible ch. 11): three separate lives. Ironman: a slot is another life, never a way back in time.
const SLOT_KEY = 'sengoku-soldier-slot';
const SLOTS = [1, 2, 3];
const slotKey = (n: number) => (n === 1 ? KEY : `${KEY}-${n}`);
let slot = 1;
try { const n = Number(localStorage.getItem(SLOT_KEY)); if (SLOTS.includes(n)) slot = n; } catch { /* storage blocked: slot 1 */ }
// How much of Li's life the player sees (owner, Oct 16; Football Manager's highlight modes): a per-viewer preference.
type Detail = 'key' | 'normal' | 'all';
const DETAIL_KEY = 'sengoku-detail';
const DETAIL_LABEL: Record<Detail, string> = { key: 'key moments', normal: 'normal', all: 'everything' };
let detail: Detail = 'normal';
try { const d = localStorage.getItem(DETAIL_KEY); if (d === 'key' || d === 'all') detail = d; } catch { /* storage blocked: normal */ }
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const log = $('log');
const input = $<HTMLInputElement>('in');
let state: GameState;

type Tab = 'story' | 'map' | 'li' | 'army' | 'people' | 'journal' | 'encyclopedia';
const PAGES: Partial<Record<Tab, (s: GameState) => string>> = {
  map: mapPage, li: liPage, army: armyPage, people: peoplePage, journal: journalPage, encyclopedia: encyclopediaPage,
};
let tab: Tab = 'story';

// ---------- "new" dots on tabs (something changed there since Li last looked) ----------
interface Seen { people: number; journal: number; encyclopedia: number; li: string }
let seen: Seen;
const liKey = (s: GameState) => JSON.stringify([li(s).styles, li(s).skills, li(s).stats].map((o) => Object.values(o).map(Math.floor)));
const metCount = (s: GameState) => Object.keys(s.relations).filter((id) => met(s, id)).length;
const look = (s: GameState): Seen => ({ people: metCount(s), journal: s.journal.length, encyclopedia: knownEntries(s).length, li: liKey(s) });

function dots() {
  const now = look(state);
  const fresh: Partial<Record<Tab, boolean>> = {
    people: now.people > seen.people, journal: now.journal > seen.journal, encyclopedia: now.encyclopedia > seen.encyclopedia, li: now.li !== seen.li,
  };
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    const on = !!fresh[b.dataset.tab as Tab] && b.dataset.tab !== tab;
    const dot = b.querySelector('.dot');
    if (on && !dot) b.insertAdjacentHTML('beforeend', '<span class="dot"><span class="sr"> (new)</span></span>');
    if (!on && dot) dot.remove();
  });
}

function markSeen(t: Tab) {
  const now = look(state);
  if (t === 'people') seen.people = now.people;
  if (t === 'journal') seen.journal = now.journal;
  if (t === 'encyclopedia') seen.encyclopedia = now.encyclopedia;
  if (t === 'li') seen.li = now.li;
}

function openTab(t: Tab) {
  tab = t;
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  for (const name of ['story', 'map', 'li', 'army', 'people', 'journal', 'encyclopedia'] as Tab[]) $(`tab-${name}`).hidden = name !== t;
  renderPage(t);
  markSeen(t);
  dots();
  if (t === 'story') input.focus({ preventScroll: true });
}

// ---------- the story column ----------

interface Parts { paras: { kind: string; text: string }[]; chips: string[] }

/** Split the engine's reply text into story paragraphs, change chips and notes. */
function replyParts(text: string, newPeople: string[]): Parts {
  const lines = text.split('\n').filter((l) => !/^(📅|📍)/.test(l) && !/^\d\. /.test(l) && !/^Or (type freely|write what Li does)/.test(l));
  const blocks = lines.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
    .filter((b) => !b.startsWith('⚔ DUEL') && !b.startsWith('What Li has read'));
  const parts: Parts = { paras: [], chips: newPeople.map((n) => `<span class="chip new">New: ${esc(n)}</span>`) };
  for (const block of blocks) {
    for (const part of block.split('\n').filter((l) => l.startsWith('Changes:') || l.startsWith('(Healing'))) {
      if (part.startsWith('Changes:')) {
        for (const c of part.slice(8).split(' · ').map((x) => x.trim()).filter(Boolean)) {
          parts.chips.push(`<span class="chip ${c.startsWith('▲') ? 'up' : c.startsWith('▼') ? 'down' : ''}">${esc(c)}</span>`);
        }
      } else parts.chips.push(`<span class="chip">${esc(part.replace(/[()]/g, ''))}</span>`);
    }
    const body = block.split('\n').filter((l) => !l.startsWith('Changes:') && !l.startsWith('(Healing')).join('\n').trim();
    if (!body) continue;
    const kind = /^[◆]/.test(body) ? 'spark' : /^⚠/.test(body) ? 'alert' : /^(==|Commands:|Pick an option|— Month|Li's journal)/.test(body) || /^Li does not know/.test(body) ? 'info' : '';
    for (const para of body.split(/\n(?=[◆⚠])/)) parts.paras.push({ kind, text: plain(para.replace(/^[◆⚠]\s*/, '')) });
  }
  return parts;
}

const paraHtml = (p: { kind: string; text: string }) => `<p class="text ${p.kind}">${p.kind ? esc(p.text) : termify(esc(p.text), state)}</p>`;
const growChips = (before: Record<string, number>) => progressChips(before, growthSnapshot(state)).map((c) => `<span class="chip grow">${esc(c)}</span>`);
/** Exact stats when the current turn began (for the progress chips). */
let fineMark: Record<string, number> = {};
const chipsHtml = (chips: string[]) => (chips.length ? `<div class="chips">${chips.join('')}</div>` : '');

/** Start a new turn in the log (older turns fade back). */
function newTurn(said?: string): HTMLElement {
  log.querySelectorAll('.turn:not(.old)').forEach((t) => { t.classList.add('old'); t.classList.remove('fresh'); });
  const turn = document.createElement('article');
  turn.className = 'turn fresh';
  turn.innerHTML = said ? `<p class="said">${esc(said)}</p>` : '';
  log.appendChild(turn);
  while (log.children.length > 40) log.firstElementChild!.remove();
  return turn;
}

function show(text: string, said?: string, newPeople: string[] = []) {
  const turn = newTurn(said);
  const p = replyParts(text, newPeople);
  turn.insertAdjacentHTML('beforeend', p.paras.map(paraHtml).join('') + chipsHtml(p.chips));
  turn.scrollIntoView({ block: 'start' });
  refresh();
}

/** Ink: the approved narration appears word by word; a click finishes it (ch. 7). */
function inkReveal(el: HTMLElement, text: string): Promise<void> {
  const words = text.split(/(\s+)/);
  if (settings.ink === 'instant' || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return Promise.resolve(); }
  return new Promise((done) => {
    let i = 0;
    el.textContent = '';
    const finish = () => { clearInterval(timer); el.textContent = text; el.removeEventListener('click', finish); done(); };
    const timer = window.setInterval(() => {
      if (i >= words.length) return finish();
      el.append(words.slice(i, i + 3).join(''));
      i += 3;
    }, settings.ink === 'slow' ? 110 : 45);
    el.addEventListener('click', finish);
  });
}

const battleOn = () => !!state.battle && !state.battle.over;

/** The battle panel (WB 6b): every sector, Li's exact, the rest as reports with source, age and confidence. */
/** The battle map (GE Phase 3; goal Oct 17): sectors as Li knows them (the same view as the table, fog kept). */
function battleMap(v: ReturnType<typeof battleView>): string {
  const cols = ['left', 'center', 'right'] as const;
  const mood = (t: string) => (/Shattered/.test(t) ? 'shattered' : /Routing/.test(t) ? 'routing' : /Wavering/.test(t) ? 'wavering' : 'steady');
  const at = (sector: string) => v.sectors.find((x) => x.sector === sector);
  const block = (sector: string, k: number, row: 'theirs' | 'ours') => {
    const x = at(sector);
    if (!x) return '';
    const text = row === 'ours' ? x.ours : x.theirs;
    const y = row === 'theirs' ? 18 : 108;
    return `<g class="bm-unit ${row} ${mood(text)}"><rect x="${12 + k * 130}" y="${y}" width="118" height="62" rx="4"/><text x="${71 + k * 130}" y="${y + 26}" text-anchor="middle">${esc(sector)}</text><text x="${71 + k * 130}" y="${y + 46}" text-anchor="middle" class="bm-n">${esc(text.split(' · ')[0])}</text></g>`;
  };
  const li = v.sectors.find((x) => x.exact);
  const k = li ? cols.indexOf(li.sector as (typeof cols)[number]) : -1;
  const reserve = at('reserve');
  return `<svg class="battlemap" viewBox="0 0 404 ${reserve ? 230 : 182}" role="img" aria-label="Battle map as Li knows it">
    <text x="8" y="12" class="bm-side">Enemy</text><text x="8" y="104" class="bm-side">Ours</text>
    <line x1="8" x2="396" y1="92" y2="92" class="bm-front"/>
    ${cols.map((c, n) => block(c, n, 'theirs') + block(c, n, 'ours')).join('')}
    ${reserve ? `<g class="bm-unit ours ${mood(reserve.ours)}"><rect x="142" y="184" width="118" height="40" rx="4"/><text x="201" y="208" text-anchor="middle">reserve · ${esc(reserve.ours.split(' · ')[0])}</text></g>` : ''}
    ${k >= 0 ? `<g class="bm-li"><circle cx="${116 + k * 130}" cy="120" r="6"/><text x="${92 + k * 130}" y="124">Li</text></g>` : li?.sector === 'reserve' && reserve ? '<g class="bm-li"><circle cx="250" cy="196" r="6"/><text x="226" y="200">Li</text></g>' : ''}
  </svg>`;
}

function battleHtml(b: BattleState): string {
  const v = battleView(b);
  const rows = v.sectors.map((x) => `<tr><th>${esc(x.sector)}</th><td>${esc(x.ours)}</td><td>${esc(x.theirs)}</td><td class="src">${esc(x.source)}</td></tr>`).join('');
  return `<strong>${esc(v.title)} · phase ${v.phase + 1} of at most ${MAX_PHASES}</strong>
    <p class="duel-meta">Li's unit: ${v.li.men} of ${v.li.start} men · ${esc(v.li.morale)}</p>
    ${battleMap(v)}
    <table class="table battle"><tr><th></th><td>Ours</td><td>Theirs</td><td class="src">Known from</td></tr>${rows}</table>`;
}

function renderOptions() {
  const panel = duelPanel(state);
  const duel = $('duel');
  if (battleOn()) {
    duel.hidden = false;
    duel.innerHTML = battleHtml(state.battle!);
    const orders = [...ordersFor(state.battle!), { order: 'auto', label: 'Fight on to the end (simulate)', risk: undefined as string | undefined }];
    $('opts').innerHTML = orders.map((o, k) => `<button type="button" class="opt" data-battle="${o.order}"${busy ? ' disabled' : ''}><span class="k">${k + 1}</span><span class="l">${esc(o.label)}</span>${o.risk ? `<span class="t"><span class="risk">${esc(o.risk)}</span></span>` : ''}</button>`).join('');
    return;
  }
  duel.hidden = !panel;
  if (panel && state.duel) {
    const d = state.duel;
    const track = (w: number) => `<span class="track" aria-label="${WOUND_LABEL[w as 0]}">${[0, 1, 2, 3].map((k) => `<i class="${k < w ? 'hit' : ''}"></i>`).join('')}</span>`;
    const card = (name: string, f: typeof d.li, sub: string) => `<div class="fighter"><span class="name">${esc(name)}</span><span class="sub">${esc(WOUND_LABEL[f.wound])} · fatigue ${f.fatigue} of 3${sub ? ` · ${esc(sub)}` : ''}</span>${track(f.wound)}</div>`;
    // The Zone counted in rounds and uses (VISIE §3): "Zone: 2 rounds left · 1 of 3 uses".
    const zone = d.zone ? `<p class="duel-meta">Zone: ${d.zone.left ? `<b>${d.zone.left} round${d.zone.left > 1 ? 's' : ''} left</b>` : 'ready'} · ${d.zone.used} of ${d.zone.uses} uses</p>` : '';
    duel.innerHTML = `<strong>Round ${d.round + 1} of 10</strong><div class="fighters">${card('Li', d.li, d.li.observed ? `read him ${Math.min(3, d.li.observed)} of 3` : '')}<span class="vs" aria-hidden="true">対</span>${card(d.foe.name.replace(/^the /, 'The '), d.foe, d.estimate ?? '')}</div>${d.hint ? `<p class="duel-meta">What Li has read: ${esc(d.hint)}</p>` : ''}${zone}${(state.characters[d.foe.id]?.abilities ?? []).length ? '<p class="duel-meta">His abilities: ???</p>' : ''}`;
  }
  if (gmMode()) {
    $('opts').innerHTML = gmChoices().map((t, k) => `<button type="button" class="opt" data-key="${esc(t)}"${busy ? ' disabled' : ''}><span class="k">${k + 1}</span><span class="l">${esc(t)}</span></button>`).join('');
    return;
  }
  $('opts').innerHTML = options(state).map((o) => {
    const t = [o.test ? esc(plain(o.test)) : '', o.risk ? `<span class="risk">⚠&#xFE0E; ${esc(o.risk)}</span>` : ''].filter(Boolean).join(' · ');
    return `<button type="button" class="opt" data-key="${esc(o.key)}"${busy ? ' disabled' : ''}><span class="k">${esc(o.key)}</span><span class="l">${esc(o.label)}</span>${t ? `<span class="t">${t}</span>` : ''}</button>`;
  }).join('');
}

function refresh() {
  const st = strip(state);
  $('s-date').textContent = st.date;
  $('s-place').textContent = st.place;
  $('s-cond').textContent = st.cond;
  $('s-money').textContent = st.money;
  const sc = scene(state);
  $('scene-label').textContent = sc.label;
  $('scene-title').textContent = sc.title;
  document.querySelector('.scene')!.classList.toggle('day', sc.day);
  $('side-li').innerHTML = liCard(state);
  $('side-grow').innerHTML = growthHtml(state);
  $('side-land').hidden = !state.domain;
  $('side-land-list').innerHTML = domainLines(state).map((l) => `<li>${esc(l)}</li>`).join('');
  $('side-map').innerHTML = mapSvg(state);
  $('chronicle').innerHTML = chronicle(state);
  $('goals').innerHTML = goalsHtml(state);
  renderOptions();
  renderGuide();
  const gmTools = !!ai && gmOn(state);
  $('wishbtn').hidden = !gmTools;
  $('skipbtn').hidden = !gmTools;
  $('detailbtn').hidden = !gmTools;
  $('retirebtn').hidden = !(canRetire(state) || oldAge(state));
  $('retirebtn').textContent = oldAge(state) ? 'Epilogue (Li is old)' : 'Retire';
  $('detailbtn').textContent = `Show: ${DETAIL_LABEL[detail]}`;
  $('wrongbtn').hidden = !gmTools;
  $('waitbtn').hidden = gmTools;
  $<HTMLButtonElement>('skipbtn').disabled = busy || !gmMode() || battleOn();
  $<HTMLButtonElement>('wrongbtn').disabled = busy;
  if (tab !== 'story' && PAGES[tab]) { renderPage(tab); markSeen(tab); }
  dots();
}

/** Draw a tab's page. If something in it breaks, say so on the page instead of leaving it blank (owner, Oct 12). */
function renderPage(t: Tab) {
  const page = PAGES[t];
  if (!page) return;
  try { $(`tab-${t}`).innerHTML = page(state); } catch (e) {
    console.error(e);
    $(`tab-${t}`).innerHTML = `<p class="empty">This page could not be drawn (${esc(String((e as Error).message ?? e))}). Your game is safe; please tell Claude what you did just before.</p>`;
  }
}

// ---------- the AI layer (GE ch. 5, 7) ----------

let ai: AiAdapter | null = null;
let aiOn = true;
let busy = false;
const recent: string[] = [];
const storyteller = $<HTMLButtonElement>('storyteller');

function setStoryteller() {
  const on = !!ai && aiOn;
  storyteller.textContent = on ? 'Storyteller: Claude' : 'Storyteller: plain';
  storyteller.setAttribute('aria-pressed', String(on));
  storyteller.title = ai ? 'Switch between Claude and the plain chronicle' : 'Claude is only available in the published claude.ai page';
  storyteller.disabled = !ai;
}

function aiFailed(e: unknown, turn: HTMLElement, gm = false) {
  const code = errorCode(e);
  if (code === 'cancelled') return;
  if (PERMANENT.has(code)) { ai = null; setStoryteller(); }
  // Game Master mode does not switch to the plain chronicle: nothing happened, so say that (owner, Oct 12: the old line confused him).
  if (gm && !PERMANENT.has(code)) {
    turn.insertAdjacentHTML('beforeend', `<p class="text info">${code === 'rate_limited' ? 'Claude needs a rest (usage limit). Nothing happened in the story; try again later.' : 'Claude did not answer this time. Nothing happened in the story; press Send to try again.'}</p>`);
    return;
  }
  const why = code === 'rate_limited' ? 'Claude needs a rest (usage limit); the plain chronicle continues.' : PERMANENT.has(code) ? 'Claude is not available here; the chronicle continues in plain text.' : 'Claude did not answer this time; the plain chronicle is shown.';
  turn.insertAdjacentHTML('beforeend', `<p class="text info">${esc(why)}</p>`);
}

function setBusy(on: boolean) {
  busy = on;
  document.querySelector('.choose')!.classList.toggle('busy', on);
  $('opts').querySelectorAll('button').forEach((b) => ((b as HTMLButtonElement).disabled = on));
  $<HTMLButtonElement>('skipbtn').disabled = on || !gmMode() || battleOn();
  $<HTMLButtonElement>('wrongbtn').disabled = on;
}

/** One Game Master turn (owner decision Oct 7): Claude writes the scene, the code checks and records it. */
async function gmStep(text?: string, said = text) {
  if (ended(state)) return; // the life is complete after the epilogue (review Oct 17)
  if (!ai) {
    show('Game Master mode needs Claude, and Claude is only here when this page is opened on claude.ai. Start a New life and pick "Classic chronicle" to play without it.', said);
    return;
  }
  setBusy(true);
  const turn = newTurn(said);
  turn.insertAdjacentHTML('beforeend', '<p class="text ink wet">The ink is still wet…</p>');
  turn.scrollIntoView({ block: 'start' });
  const before = noticeable(state);
  const fine = growthSnapshot(state);
  const metBefore = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
  const statusBefore = li(state).status;
  const seasonBefore = state.seasonKey;
  let routine = false;
  let spar = false;
  try {
    const r = await gmTurn(ai, state, text);
    turn.querySelector('.wet')?.remove();
    await paintPlay(turn, r, said, before, metBefore, true, fine);
    refresh();
    await afterPlays(r.events, r.turn.scene, seasonBefore, statusBefore, !!r.duelId, said);
    // A scene that turns nothing is routine too (McKee: "no scene that doesn't turn"; owner, Oct 16).
    routine = (!!r.turn.routine || nonEvent(r.turn, r.events)) && !r.duelId && !battleOn() && li(state).status === statusBefore;
    spar = !!r.duelId && !!r.turn.fight?.spar;
  } catch (e) {
    turn.querySelector('.wet')?.remove();
    if (errorCode(e) === 'bad_answer') {
      // Say why, and keep the refused scenes in the console, so every refusal can be diagnosed (owner playtest v30).
      console.warn('[Game Master] scene refused:', (e as Error).message, (e as { scenes?: string[] }).scenes ?? []);
      // The reason is shown at once (owner, Oct 16: the closed "Why?" hid it twice); the refused scene stays one click away.
      const refused = ((e as { scenes?: string[] }).scenes ?? []).filter(Boolean).at(-1);
      turn.insertAdjacentHTML('beforeend', `<p class="text info">Claude's scene was not used. Nothing happened in the story; press Send to try again.<br>Reason: ${esc((e as Error).message)}</p>${refused ? `<details class="why"><summary>The refused scene</summary><p>${esc(refused)}</p></details>` : ''}`);
    }
    else aiFailed(e, turn, true);
    if (text) input.value = text;
  }
  refresh();
  persist();
  await maybeChapter();
  setBusy(false);
  if (routine) goOn(turn); else autoRun = 0;
  if (spar) sparPlaysOut(turn);
}

/** A spar plays itself out (the duel engine's "simulate") unless the player takes over (owner, Oct 15). */
function sparPlaysOut(turn: HTMLElement) {
  turn.insertAdjacentHTML('beforeend', '<p class="text info auto-on">The spar plays out… <button type="button" class="quiet-tool takeover">Fight it yourself</button></p>');
  turn.querySelector<HTMLButtonElement>('.takeover')!.onclick = () => stopAuto();
  autoTimer = setTimeout(() => {
    autoTimer = undefined;
    document.querySelectorAll('.auto-on').forEach((x) => x.remove());
    if (!busy && !input.value.trim() && state.duel && !state.duel.over) send('5', 'Let the spar play out');
  }, 2500);
}

// ---------- pacing: routine plays itself (owner, Oct 12; montage and "how much do I see" Oct 16) ----------
// After a routine scene the story goes on by itself to the next moment that matters. "Everything": scene by scene, at
// most AUTO_MAX in a row. "Normal" and "Key moments": one montage (Skip ahead with the player's last plan) that stops at
// the next thing that matters: fewer, faster Claude calls. Typing, a choice or "Take over" stops it.
const AUTO_MAX = 4;
const MONTAGE_SCENES = 4;
let autoRun = 0;
let autoTimer: ReturnType<typeof setTimeout> | undefined;
function stopAuto() { if (autoTimer) clearTimeout(autoTimer); autoTimer = undefined; document.querySelectorAll('.auto-on').forEach((x) => x.remove()); }
function goOn(turn: HTMLElement) {
  if (detail === 'all' && autoRun >= AUTO_MAX) { autoRun = 0; turn.insertAdjacentHTML('beforeend', '<p class="text info">The days go on quietly. Your move.</p>'); return; }
  // Normal: after a big moment the player gets one calm scene (the L4D Director's relax), then the montage runs again.
  if (detail === 'normal' && afterPeak(state)) return;
  turn.insertAdjacentHTML('beforeend', '<p class="text info auto-on">The story goes on… <button type="button" class="quiet-tool takeover">Take over</button></p>');
  turn.querySelector<HTMLButtonElement>('.takeover')!.onclick = () => { stopAuto(); autoRun = 0; input.focus(); };
  autoTimer = setTimeout(() => {
    autoTimer = undefined;
    document.querySelectorAll('.auto-on').forEach((x) => x.remove());
    if (busy || input.value.trim()) { autoRun = 0; return; }
    if (detail === 'all') { autoRun++; gmStep(); } else runSkip('until something important happens', lastPlan(state), MONTAGE_SCENES, 'The days go on');
  }, detail === 'all' ? 2500 : detail === 'normal' ? 1500 : 300);
}
// Li's plan (night Oct 16): choosing one is an event, so the memory and Claude keep it.
$('tab-li').addEventListener('click', (ev) => {
  // A style technique (WB ch. 5: choose 1 of 2 at mastery 30/50/70/100) is an event too.
  const tech = (ev.target as HTMLElement).closest<HTMLElement>('[data-tech]');
  if (tech && !busy) {
    const [style, level, pick] = tech.dataset.tech!.split(':');
    commitDrafts(state, chooseTechniqueDrafts(state, style, Number(level), Number(pick) as 1 | 2));
    persist();
    refresh();
    return;
  }
  const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-plan]');
  if (!b || busy) return;
  commitDrafts(state, planDrafts(state, b.dataset.plan as PlanId));
  persist();
  refresh();
});
$('detailbtn').onclick = () => {
  detail = detail === 'normal' ? 'key' : detail === 'key' ? 'all' : 'normal';
  try { localStorage.setItem(DETAIL_KEY, detail); } catch { /* this session only */ }
  refresh();
};
input.addEventListener('input', () => { if (autoTimer) { stopAuto(); autoRun = 0; } });

/** One Game Master scene in the log: the story (inked or at once), its chips, the GM's out-of-character note, "Why?". */
async function paintPlay(turn: HTMLElement, r: GmPlay, said: string | undefined, before: ReturnType<typeof noticeable>, metBefore: Set<string>, ink: boolean, fine: Record<string, number>) {
  const p = document.createElement('p');
  p.className = 'text';
  turn.appendChild(p);
  speak(r.turn.scene, ink); // a skip queues its scenes; a turn starts fresh
  if (ink) await inkReveal(p, r.turn.scene);
  else p.innerHTML = termify(esc(r.turn.scene), state);
  const newPeople = Object.keys(state.relations).filter((id) => met(state, id) && !metBefore.has(id)).map((id) => state.characters[id].name);
  turn.insertAdjacentHTML('beforeend', chipsHtml([...replyParts(changesLine(before, noticeable(state)), newPeople).chips, ...growChips(fine)]));
  // Sparks (night Oct 16): what turned since the last scene, as short gold lines (Game Experience Bible: ~every 10 minutes).
  if (sparkMark) for (const line of sparksSince(state, sparkMark)) turn.insertAdjacentHTML('beforeend', `<p class="text spark">◆ ${esc(line)}</p>`);
  sparkMark = sparkSnapshot(state);
  if (r.turn.gmNote) turn.insertAdjacentHTML('beforeend', `<p class="text gmnote">Game Master: ${esc(r.turn.gmNote)}</p>`);
  const why = [said ? `Because Li chose: ${said}.` : '', r.turn.journal ? `Li's journal: ${r.turn.journal}` : '', r.notes.length ? `The rules held: ${r.notes.join('; ')}.` : ''].filter(Boolean);
  if (why.length) turn.insertAdjacentHTML('beforeend', `<details class="why"><summary>Why?</summary><p>${esc(why.join(' '))}</p></details>`);
}

/**
 * The short films (docs/FILMS.md) for the big moments in these events, in story order: the Zone, the name, a death,
 * a promotion, the first battle. Each plays once, when it happens.
 */
async function filmsFor(events: GameEvent[], said?: string) {
  const knows = (key: string) => events.some((e) => e.type === 'knowledge' && (e.data as { key?: string }).key === key);
  if (knows('shinken_no_ryu')) await Film.play(Scenes.zone());
  if (knows('said_hattori')) {
    const words = (said ?? '').replace(/\([^)]*\)/g, '').trim();
    const shout = words.match(/[^.!?]*hattori[^.!?]*[.!?]?/i)?.[0].trim() || 'I am Li Hattori';
    await Film.play(Scenes.nameReveal({ words: shout.replace(/^["']|["']$/g, '').slice(0, 60) }));
  }
  for (const e of events.filter((x) => x.type === 'status')) {
    const d = e.data as { char: string; alive?: boolean; role?: string };
    if (d.alive === false && d.char !== state.liId && met(state, d.char)) {
      await Film.play(Scenes.death({ name: state.characters[d.char]?.name ?? d.char, line: e.fact }));
    }
  }
  const promo = events.find((e) => e.type === 'status' && /promoted to/.test(e.fact));
  if (promo) {
    const label = promo.fact.replace(/^Li is promoted to /, '');
    const m = label.match(/^(.*?) \((.*)\)$/);
    await Film.play(Scenes.promotion({ rank: m?.[1] ?? label, men: m ? `${m[2]} men` : '', line: promo.journal ?? '' }));
  }
  // Life milestones (goal Oct 17): each big goal reached gets its own card.
  const flag = (re: RegExp) => events.find((e) => e.type === 'flag' && re.test(String((e.data as { key?: string }).key)) && Number((e.data as { value?: number }).value) > 0);
  const marks: { kicker: string; title: string; line: string; seal: string }[] = [];
  const wed = flag(/^spouse_/);
  if (wed) marks.push({ kicker: 'A marriage', title: wed.fact.replace(/ \(.*\)$/, ''), line: wed.journal ?? '', seal: '縁' });
  for (const e of events.filter((x) => x.type === 'person' && String((x.data as { id?: string }).id).startsWith('child_'))) marks.push({ kicker: 'A child is born', title: String((e.data as { name?: string }).name), line: e.journal ?? '', seal: '子' });
  const land = flag(/^land_koku$/);
  // Only his first land: a later, larger grant is not a new milestone (review Oct 17).
  if (land && state.events.filter((e) => (e.data as { key?: string }).key === 'land_koku').length === 1) marks.push({ kicker: 'Land of his own', title: state.domain?.name ?? 'Li\'s land', line: `About ${Number((land.data as { value: number }).value).toLocaleString('en-US')} koku a year.`, seal: '地' });
  if (knows('family_found')) marks.push({ kicker: 'Home', title: 'He found them', line: 'His mother and sisters, alive.', seal: '家' });
  else if (knows('family_alive')) marks.push({ kicker: 'A lead', title: 'They are alive', line: 'Somewhere, his family lives.', seal: '家' });
  if (knows('father_killers')) marks.push({ kicker: 'The truth', title: 'Who killed his father', line: 'Now he knows the names.', seal: '真' });
  else if (knows('father_truth')) marks.push({ kicker: 'The truth', title: 'It was murder', line: 'His father did not fall in battle.', seal: '真' });
  const side = flag(/^court_member$/);
  if (side) marks.push({ kicker: 'At court', title: side.fact.replace(/^Li joins /, ''), line: side.journal ?? '', seal: '朝' });
  for (const m of marks) await Film.play(Scenes.milestone(m));
  const start = events.find((e) => e.type === 'battle' && (e.data as { battle?: { phase?: number } }).battle?.phase === 0);
  if (start) {
    const b = (start.data as { battle: { name: string; units: { side: string; start: number }[] } }).battle;
    const sum = (side: string) => b.units.filter((u) => u.side === side).reduce((s, u) => s + u.start, 0);
    const first = state.events.filter((e) => e.type === 'battle' && (e.data as { battle?: { phase?: number } }).battle?.phase === 0).length === 1;
    if (first) await Film.play(Scenes.firstBattle({ name: b.name, numbers: `About ${sum('ally').toLocaleString('en-US')} against about ${sum('enemy').toLocaleString('en-US')}` }));
    else await titleCard('Battle', b.name);
  }
}

/** The first duel Li wins (decided by the duel engine) gets its own film; a deadly one is "first blood". */
async function victoryFilm(events: GameEvent[]) {
  const end = events.find((e) => e.type === 'story' && (e.data as { result?: string }).result === 'won' && (e.data as { duelEnd?: string }).duelEnd);
  if (!end) return;
  const wins = state.events.filter((e) => e.type === 'story' && (e.data as { result?: string }).result === 'won' && (e.data as { duelEnd?: string }).duelEnd).length;
  if (wins !== 1) return;
  const id = (end.data as { duelEnd: string }).duelEnd;
  // Both modes record the duel's start with its state (and, for Game Master fights, the template).
  const start = [...state.events].reverse().find((e) => e.type === 'duel' && (e.data as { state?: { id?: string } }).state?.id === id)?.data as { state: { foe: { name: string } }; template?: { maxWound: number } } | undefined;
  const foe = (start?.state.foe.name ?? 'the foe').replace(/^the /, 'The ');
  const maxWound = start?.template?.maxWound ?? state.gm?.duels[id]?.maxWound ?? (id === 'spar' ? 1 : 3);
  await Film.play(Scenes.victory({ foe, deadly: maxWound >= 3 }));
}

/** After Game Master scenes: title cards, a freedom legend, the start of a fight. */
async function afterPlays(events: GameEvent[], scene: string, seasonBefore: string, statusBefore: string, fight: boolean, said?: string) {
  await filmsFor(events, said);
  await bigMoments(events, seasonBefore);
  if (li(state).status !== statusBefore) {
    const how = state.knowledge.includes('hunted') ? 'By his own feet, and hunted' : 'His paper burned';
    await Film.play(Scenes.freedom({ how }));
  }
  if (fight) await titleCard('A fight', state.duel?.foe.name.replace(/^the /, 'The ') ?? 'A fight');
}

/** Close a chapter when it is due: Claude writes its recap once (never rewritten), a title card names it. Silent on failure. */
async function maybeChapter() {
  if (!ai || !gmOn(state)) return;
  try {
    const ev = await gmChapter(ai, state);
    if (!ev.length) return;
    persist();
    refresh();
    const ch = ev[0].data as { title: string; text: string };
    await Film.play(Scenes.chapterEnd({ n: state.gm?.chapters?.length ?? 1, title: ch.title, text: ch.text }));
  } catch { /* the chapter closes next time */ }
}

// ---------- Game Master tools: Skip ahead, Something's wrong (owner vision Oct 10) ----------

const toolbox = $('toolbox');
const closeTools = () => { toolbox.hidden = true; toolbox.innerHTML = ''; };

/** Retire, or old age: confirm, then the epilogue closes the chronicle (GE ch. 9 decision 2; goal Oct 17). */
function openRetire() {
  if (busy || ended(state)) return;
  const why = oldAge(state) ? 'old age' : 'retired';
  toolbox.innerHTML = `<p class="text info">${why === 'retired' ? 'Li lays down his command and retires.' : 'Li has grown old.'} The chronicle ends with an epilogue: what became of him, his people and the kingdoms. This cannot be undone.</p>
    <div class="row"><button type="button" class="yes">Write the epilogue</button><button type="button" class="no">Not yet</button></div>`;
  toolbox.hidden = false;
  toolbox.querySelector<HTMLButtonElement>('.no')!.onclick = closeTools;
  toolbox.querySelector<HTMLButtonElement>('.yes')!.onclick = async () => {
    closeTools();
    setBusy(true);
    const turn = newTurn(why === 'retired' ? 'I lay down my command.' : undefined);
    turn.insertAdjacentHTML('beforeend', '<p class="text ink wet">The last pages are written…</p>');
    const ev = await gmEpilogue(ai, state, why);
    turn.querySelector('.wet')?.remove();
    const e = ev.find((x) => x.type === 'story');
    if (e) {
      const title = String((e.data as { epilogueTitle?: string }).epilogueTitle ?? 'Epilogue');
      turn.insertAdjacentHTML('beforeend', `<p class="label">Epilogue · ${esc(title)}</p><p class="text">${esc(e.fact)}</p><p class="text info">Li's chronicle is complete. Start a New life to play again.</p>`);
      persist();
      refresh();
      await Film.play(Scenes.chapterEnd({ n: (state.gm?.chapters?.length ?? 0) + 1, title: `Epilogue: ${title}`, text: e.fact.slice(0, 300) }));
    }
    setBusy(false);
  };
}

function openSkip() {
  if (busy || !ai || !gmMode() || battleOn()) return;
  const next = Math.floor(liAge(state)) + 1;
  toolbox.innerHTML = `<p class="text info">Skip ahead: the story runs on, scene by scene, with Li's plan, and stops at anything important.</p>
    <label>Until when?<input id="sk-until" list="sk-until-list" autocomplete="off" placeholder="until something important happens"></label>
    <datalist id="sk-until-list"><option value="until Li is ${next}"><option value="until the next battle"><option value="until something important happens"><option value="for three months"></datalist>
    <label>What does Li do meanwhile?<input id="sk-plan" autocomplete="off" placeholder="I do my work and train with the sticks every night"></label>
    <div class="row"><button type="button" class="yes">Skip</button><button type="button" class="no">Cancel</button></div>`;
  toolbox.hidden = false;
  const until = toolbox.querySelector<HTMLInputElement>('#sk-until')!;
  const plan = toolbox.querySelector<HTMLInputElement>('#sk-plan')!;
  toolbox.querySelector<HTMLButtonElement>('.no')!.onclick = closeTools;
  toolbox.querySelector<HTMLButtonElement>('.yes')!.onclick = () => {
    const u = until.value.trim() || 'until something important happens';
    const p = plan.value.trim() || 'his usual work and routine';
    closeTools();
    runSkip(u, p);
  };
  until.focus();
}

async function runSkip(until: string, plan: string, maxScenes?: number, label = `Skip ahead ${until}. ${plan}`) {
  if (!ai || busy || ended(state)) return;
  setBusy(true);
  const head = newTurn(label);
  head.insertAdjacentHTML('beforeend', '<p class="text info wet">The days pass…</p>');
  head.scrollIntoView({ block: 'start' });
  const from = strip(state).date;
  const before = noticeable(state);
  const seasonBefore = state.seasonKey;
  const statusBefore = li(state).status;
  const events: GameEvent[] = [];
  let last: GmPlay | undefined;
  let prev = before;
  let prevFine = growthSnapshot(state);
  let metPrev = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
  try {
    const plays = await gmSkip(ai, state, { until, plan, maxScenes }, (r) => {
      events.push(...r.events);
      last = r;
      paintPlay(newTurn(), r, undefined, prev, metPrev, false, prevFine);
      prev = noticeable(state);
      prevFine = growthSnapshot(state);
      metPrev = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
      refresh();
      persist();
    });
    head.querySelector('.wet')?.remove();
    const why = last?.duelId ? 'a fight begins' : last?.turn.stop ? 'something important' : 'the skip has run its course';
    head.insertAdjacentHTML('beforeend', `<p class="text info">From ${esc(from)} to ${esc(strip(state).date)} in ${plays.length} scene${plays.length === 1 ? '' : 's'}. It stopped: ${why}.</p>`);
    head.insertAdjacentHTML('beforeend', chipsHtml(replyParts(changesLine(before, noticeable(state)), []).chips));
    refresh();
    if (last) await afterPlays(events, last.turn.scene, seasonBefore, statusBefore, !!last.duelId);
  } catch (e) {
    head.querySelector('.wet')?.remove();
    if (errorCode(e) === 'bad_answer') head.insertAdjacentHTML('beforeend', `<p class="text info">${esc((e as Error).message)} The scenes before it are kept.</p>`);
    else aiFailed(e, head, true);
  }
  refresh();
  persist();
  await maybeChapter();
  setBusy(false);
}

const who = (id: string) => state.characters[id]?.name ?? id;

/** A proposed correction in plain words. Hidden values (the five relation numbers, plans, memories) stay without numbers. */
function changeText(c: GmChange): string {
  const x = c as Record<string, unknown>;
  const why = typeof x.reason === 'string' && x.reason ? ` (${x.reason})` : '';
  switch (c.kind) {
    case 'fact': return `${c.what}: ${c.text}`;
    case 'relation': return `${who(c.npc)}'s ${c.field} toward Li ${c.delta >= 0 ? 'rises' : 'falls'}${why}`;
    case 'money': return `Money ${c.amount >= 0 ? '+' : ''}${c.amount} mon${why}`;
    case 'wound': return `Li's condition: ${WOUND_LABEL[Math.max(0, Math.min(3, Math.round(c.level))) as 0 | 1 | 2 | 3]}${why}`;
    case 'fatigue': return 'Li\'s tiredness is corrected';
    case 'person': return `${c.name} is added to the people Li knows`;
    case 'dies': return `${who(c.npc)} is dead${why}`;
    case 'thread': return `Storyline: ${c.text}`;
    case 'lore': return `Encyclopedia: ${c.title}`;
    case 'memory': return `What ${who(c.npc)} remembers about Li is corrected`;
    case 'agenda': return `${who(c.npc)}'s own plans are corrected`;
    case 'knowledge': return 'Something Li knows is corrected';
    case 'train': return `Training is corrected (${c.focus})`;
    case 'skill': return `A skill is corrected (${c.skill})`;
    default: return `A correction (${c.kind})`;
  }
}

function openWrong() {
  if (busy || !ai || !gmOn(state)) return;
  toolbox.innerHTML = `<p class="text info">Tell the Game Master what is wrong, in plain words. Real errors get fixed; a fair loss or a bad choice stays (no going back in time).</p>
    <label>What is wrong?<textarea id="wr-text" placeholder="Hachi talked in the last scene, but he died last month."></textarea></label>
    <div class="row"><button type="button" class="yes">Check it</button><button type="button" class="no">Cancel</button></div>`;
  toolbox.hidden = false;
  const area = toolbox.querySelector<HTMLTextAreaElement>('#wr-text')!;
  toolbox.querySelector<HTMLButtonElement>('.no')!.onclick = closeTools;
  toolbox.querySelector<HTMLButtonElement>('.yes')!.onclick = () => { if (area.value.trim()) runWrong(area.value.trim()); };
  area.focus();
}

async function runWrong(report: string) {
  if (!ai || busy || ended(state)) return;
  setBusy(true);
  toolbox.innerHTML = '<p class="text info wet">The Game Master checks the memory…</p>';
  let p: GmFixProposal;
  try {
    p = await gmFix(ai, state, report);
  } catch (e) {
    const code = errorCode(e);
    toolbox.innerHTML = `<p class="text info">${esc(code === 'bad_answer' ? (e as Error).message : 'Claude did not answer this time. Try again later.')}</p><div class="row"><button type="button" class="no">Close</button></div>`;
    toolbox.querySelector<HTMLButtonElement>('.no')!.onclick = closeTools;
    return setBusy(false);
  }
  const list = p.changes.map((c) => `<li>${esc(changeText(c))}</li>`).join('');
  const act = p.changes.length > 0 || p.rewindScenes > 0;
  toolbox.innerHTML = `<p class="text">${esc(p.explanation)}</p>${list ? `<ul>${list}</ul>` : ''}
    ${p.rewindScenes ? `<p class="text alert">Bug fix: the last ${p.rewindScenes === 1 ? 'scene is' : `${p.rewindScenes} scenes are`} taken back and the story goes on from before ${p.rewindScenes === 1 ? 'it' : 'them'}.</p>` : ''}
    <div class="row">${act ? '<button type="button" class="yes">Apply the fix</button>' : ''}<button type="button" class="no">${act ? 'Cancel' : 'Close'}</button></div>`;
  setBusy(false);
  toolbox.querySelector<HTMLButtonElement>('.no')!.onclick = closeTools;
  const yes = toolbox.querySelector<HTMLButtonElement>('.yes');
  if (!yes) return;
  yes.onclick = () => {
    closeTools();
    const rewound = p.rewindScenes > 0;
    if (rewound) state = gmRewind(state, p.rewindScenes, report);
    const ev = gmApplyFix(state, p, report);
    persist();
    if (rewound) {
      log.innerHTML = '';
      const lastScene = [...state.events].reverse().find((e) => e.type === 'scene');
      show(`${lastScene ? `${lastScene.fact}\n\n` : ''}${ev[0]?.fact ?? 'Corrected.'}`);
    } else show(ev[0]?.fact ?? 'Corrected.', `Something's wrong: ${report}`);
  };
}

/** Show a resolved turn: narrated by Claude when it is a story moment, template text otherwise. */
async function finish(reply: Reply, turn: HTMLElement, said: string | undefined, free: boolean, before: Set<string>, seasonBefore = state.seasonKey) {
  const newPeople = Object.keys(state.relations).filter((id) => met(state, id) && !before.has(id)).map((id) => state.characters[id].name);
  // After a WAIT the summary gets its own screen; the turn keeps only its changes line.
  const text = reply.summary ? reply.text.replace(summaryText(reply.summary), reply.summary.changes ? `Changes: ${reply.summary.changes}` : '') : reply.text;
  const parts = replyParts(text, newPeople);
  parts.chips.push(...growChips(fineMark));
  const events = reply.events ?? [];
  await bigMoments(events, seasonBefore);
  if (reply.summary) await skipScreen(reply.summary);
  const story = parts.paras.filter((p) => !p.kind);
  const notes = parts.paras.filter((p) => p.kind);
  // In Game Master mode the code's own lines (a fight's rounds) show as they are; Claude tells the aftermath next.
  if (ai && aiOn && reply.acted && shouldNarrate(events, free) && !gmOn(state)) {
    const packet = buildPacket(state, events, free ? said : undefined, recent);
    turn.insertAdjacentHTML('beforeend', `<p class="text ink wet">The ink is still wet…</p>${notes.map(paraHtml).join('')}${chipsHtml(parts.chips)}`);
    refresh();
    turn.scrollIntoView({ block: 'start' });
    await narrateInto(turn, packet);
  } else {
    turn.insertAdjacentHTML('beforeend', story.concat(notes).map(paraHtml).join('') + chipsHtml(parts.chips));
    speak(story.map((p) => p.text).join(' '));
    refresh();
    turn.scrollIntoView({ block: 'start' });
  }
  addWhy(turn, said, events);
  restPoint(turn);
  persist();
}

/** "Why?" (ch. 8 rule 6, ch. 12b #11): what caused this turn's results, in words Li could know. */
function addWhy(turn: HTMLElement, said: string | undefined, events: GameEvent[]) {
  const lines = events.filter((e) => e.journal).map((e) => e.journal!);
  if (!said && !lines.length) return;
  if (!turn.querySelector('.chips') && !lines.length) return;
  const cause = said ? `Because Li chose: ${said}.` : '';
  turn.insertAdjacentHTML('beforeend', `<details class="why"><summary>Why?</summary><p>${esc([cause, ...lines.map((l) => `Li's journal: ${l}`)].filter(Boolean).join(' '))}</p></details>`);
}

async function narrateInto(turn: HTMLElement, packet: FactPacket) {
  const el = turn.querySelector<HTMLElement>('.ink')!;
  el.classList.add('wet');
  el.textContent = 'The ink is still wet…';
  turn.querySelector('.rewrite')?.remove();
  let n: Narration;
  try {
    n = await narrate(ai!, packet);
  } catch (e) {
    aiFailed(e, turn);
    n = { text: templateText(packet), source: 'template', problems: [] };
  }
  el.classList.remove('wet');
  speak(n.text);
  await inkReveal(el, n.text);
  recordNote(state, 'narration', `narration (${n.source})`, { text: n.text, source: n.source, problems: n.problems });
  recent.push(n.text);
  if (recent.length > 3) recent.shift();
  if (n.source === 'ai') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rewrite';
    b.textContent = 'Rewrite';
    b.title = 'Same events, new words';
    b.onclick = async () => { if (busy || !ai) return; setBusy(true); await narrateInto(turn, packet); setBusy(false); };
    el.after(b);
  }
  persist();
}

function confirmReading(turn: HTMLElement, r: Extract<Reading, { kind: 'action' }>): Promise<boolean> {
  return new Promise((resolve) => {
    const box = document.createElement('div');
    box.className = 'confirm';
    const opt = options(state).find((o) => o.label === r.label);
    box.innerHTML = `<p class="text info">Li will: ${esc(r.label)}${opt?.risk ? ` <span class="risk">⚠&#xFE0E; ${esc(opt.risk)}</span>` : ''}</p>
      <div class="row"><button type="button" class="yes">Do it</button><button type="button" class="no">Change</button></div>`;
    turn.appendChild(box);
    const answer = (ok: boolean) => { box.remove(); resolve(ok); };
    box.querySelector<HTMLButtonElement>('.yes')!.onclick = () => answer(true);
    box.querySelector<HTMLButtonElement>('.no')!.onclick = () => answer(false);
    box.querySelector<HTMLButtonElement>('.yes')!.focus();
  });
}

const situation = () => `${strip(state).date} · ${strip(state).place} · ${state.duel && !state.duel.over ? 'in a fight' : state.date.part}`;
const COMMAND = /^(HELP|STATUS|INFOCHAR|RELATIONS|RECAP|LOG|SAVE|LOAD|NEW|WAIT|SKIP)\b/i;

// ---------- input ----------

function persist() {
  try { localStorage.setItem(slotKey(slot), JSON.stringify(toSave(state))); localStorage.setItem(SLOT_KEY, String(slot)); } catch { /* storage blocked: the game still runs */ }
  scheduleCloud();
}

// ---------- the save in the player's account (web/cloud-save.ts) ----------
let cloudTimer: number | undefined;
let cloudNote = 'Saved in this browser only (your account save works on the claude.ai page).';
/** The account copy follows the browser copy a moment later (many quick turns make one write). */
// Never write to the account before the account was read (Oct 17: a fresh page on a new device wrote an empty new game
// over the account's longer life 2 s after opening, before checkCloud could load it).
let cloudReady = false;
function scheduleCloud() {
  if (!cloudReady) return;
  clearTimeout(cloudTimer);
  const s = state;
  const n = slot;
  cloudTimer = window.setTimeout(async () => {
    const ok = await saveToCloud(n, toSave(s), describe(s));
    if (ok) cloudNote = `Saved in your claude.ai account too (life ${n}, ${describe(s)}). It continues on any device.`;
    $('cloudnote').textContent = cloudNote;
  }, 2000);
}
/** At start: when the account holds a longer version of this life (played on another device), continue from it. */
async function checkCloud() {
  let c: Awaited<ReturnType<typeof loadFromCloud>>;
  try { c = await loadFromCloud(slot); } finally { cloudReady = true; }
  if (!c || busy || c.save.events.length <= state.events.length) return;
  try {
    state = fromSave(c.save);
    seen = look(state);
    log.innerHTML = '';
    show(`Continued from your claude.ai account: ${c.describe}.`);
    refresh();
  } catch { /* an older version: the browser save stays */ }
}

/** Game Master mode outside a fight: Claude runs the turn. */
const gmMode = () => gmOn(state) && !(state.duel && !state.duel.over);
const gmChoices = () => state.gm?.suggestions?.length ? state.gm.suggestions : ['I look around and wait for what comes'];

async function send(raw: string, said = raw) {
  stopNarrator();
  if (busy) return;
  stopAuto(); autoRun = 0; // the player acts: the story stops going on by itself
  fineMark = growthSnapshot(state);
  if (shownHint) markHint(shownHint); // a hint closes itself once the player acts (ch. 8 §4)
  const text = raw.trim();
  // After the epilogue the life is complete (GE ch. 9): only a new life, loading or saving.
  if (ended(state) && !/^(NEW|LOAD|SAVE)\b/i.test(text)) return show("Li's chronicle is complete. Start a New life to play again.", said);
  if (isQuestion(text)) return askQuestion(text, said);
  if (/^help$/i.test(text)) return openHowTo();
  if (gmMode() && !/^(HELP|STATUS|INFOCHAR|RELATIONS|RECAP|LOG|SAVE|LOAD|NEW)\b/i.test(text)) return gmStep(text, said);
  if (!options(state).some((o) => o.key === text) && !COMMAND.test(text)) bumpFree();
  const before = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
  const seasonBefore = state.seasonKey;
  const isKey = options(state).some((o) => o.key === text);
  if (isKey || COMMAND.test(text) || !ai || !aiOn) {
    const r = handleInput(state, text);
    if (r.command === 'new') return start(true);
    if (r.command === 'save') { persist(); return show('Saved in this browser. Use "Save file" to copy it somewhere safe.', said); }
    if (r.command === 'load') { if (!resume()) show('No saved game in this browser.', said); return; }
    setBusy(true);
    await finish(r, newTurn(said), said, !isKey && !COMMAND.test(text), before, seasonBefore);
    await victoryFilm(r.events ?? []);
    setBusy(false);
    // A fight the Game Master started is over: Claude tells what happens next, true to the result.
    if (gmOn(state) && !state.duel && lastFightResult(state)) await gmStep();
    return;
  }
  // Free text with Claude: interpret → (confirm) → engine → narrate.
  const teller = ai.name; // ai can become null mid-turn after a permanent error
  setBusy(true);
  const turn = newTurn(said);
  turn.insertAdjacentHTML('beforeend', '<p class="text info wet reading">Li weighs it…</p>');
  turn.scrollIntoView({ block: 'start' });
  let reading: Reading;
  try {
    reading = await interpret(ai, state, text, situation());
  } catch (e) {
    aiFailed(e, turn);
    reading = { kind: 'none' };
  }
  turn.querySelector('.reading')?.remove();
  if (reading.kind === 'none') {
    // Claude found nothing that fits; the rules reader may still know it, otherwise it explains what is possible.
    const p = parseFreeText(state, text);
    const opt = p.action && options(state).find((o) => o.action.kind === p.action!.kind && (o.action.target ?? '') === (p.action!.target ?? ''));
    if (p.action) reading = { kind: 'action', action: p.action, label: opt?.label ?? p.action.kind.replace('_', ' '), confidence: 1, tone: 'neutral', says: null, risky: !!opt?.risk };
    else { turn.insertAdjacentHTML('beforeend', `<p class="text info">${esc(`That is not something Li can do here and now. ${(p.ask ?? '').replace('I did not understand that. ', '')}`.trim())}</p>`); refresh(); return setBusy(false); }
  }
  if (reading.kind === 'ask') { turn.insertAdjacentHTML('beforeend', `<p class="text info">${esc(reading.question)}</p>`); refresh(); return setBusy(false); }
  if (reading.kind === 'command') { await finish(handleInput(state, reading.command), turn, said, false, before, seasonBefore); return setBusy(false); }
  if (reading.risky || reading.confidence < 0.75) {
    // The game stays busy while the box is open, so no other turn can slip in before the answer.
    if (!(await confirmReading(turn, reading))) { turn.insertAdjacentHTML('beforeend', '<p class="text info">Then write it again, or pick an option.</p>'); setBusy(false); input.value = raw; input.focus(); return; }
  }
  recordNote(state, 'intent', `intent: ${reading.label}`, { input: text, action: reading.action, tone: reading.tone, says: reading.says, confidence: reading.confidence, by: teller });
  await finish(handleAction(state, reading.action), turn, said, true, before, seasonBefore);
  setBusy(false);
}

function resume(): boolean {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return false;
    state = fromSave(JSON.parse(raw));
    seen = look(state);
    sessionJournal = state.journal.length;
    log.innerHTML = '';
    const last = [...state.events].reverse().find((e) => e.type === 'narration' || e.type === 'scene');
    const lastText = last?.type === 'scene' ? last.fact : (last?.data as { text?: string } | undefined)?.text;
    show(lastText ? `${lastText}\n\nThe chronicle continues.` : 'The chronicle continues.');
    return true;
  } catch (e) {
    // No game state may exist yet: start() shows this note together with the new game.
    note = `${(e as Error).message} A new life begins.`;
    return false;
  }
}

let note = '';

let hadSave = false;
function start(fresh = false) {
  if (!fresh && resume()) { hadSave = true; return; }
  log.innerHTML = '';
  const g = newGame();
  state = g.state;
  seen = look(state);
  recent.length = 0;
  show(note ? `${note}\n\n${g.text}` : g.text);
  note = '';
  // Saved only when the player presses Begin, in the life the player chose (Oct 17), never over another life before that.
  if (fresh || !hadSave) resetGuide();
  openNewLife(); // a new life starts with the settings and the prologue (GE ch. 8)
}

// ---------- GUIDE hints, example lines, How to play, title cards (GE ch. 3b, 8) ----------

const GUIDE_KEY = 'sengoku-soldier-guide';
let guideSeen = new Set<string>();
let freeTurns = 0;
let shownHint: string | undefined;
try { const g = JSON.parse(localStorage.getItem(GUIDE_KEY) ?? '{}'); guideSeen = new Set(g.seen ?? []); freeTurns = g.free ?? 0; } catch { /* fresh */ }
const saveGuide = () => { try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ seen: [...guideSeen], free: freeTurns })); } catch { /* fine */ } };
function resetGuide() { guideSeen = new Set(); freeTurns = 0; saveGuide(); }
function markHint(id: string) { guideSeen.add(id); shownHint = undefined; saveGuide(); }
function bumpFree() { freeTurns++; saveGuide(); }

function renderGuide() {
  const h = nextHint(state, settings.guide as Guidance, guideSeen);
  shownHint = h?.id;
  $('guide').hidden = !h;
  if (h) $('guide-text').textContent = h.text;
  // Example lines until the player has written freely three times (ch. 8 rule 5).
  const ex = $('examples');
  ex.innerHTML = freeTurns >= 3 || settings.guide === 'off' ? '' : exampleLines(state).map((l) => `<button type="button" data-line="${esc(l)}">${esc(l)}</button>`).join('');
}
$('guide-close').onclick = () => { if (shownHint) markHint(shownHint); renderGuide(); };
$('examples').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-line]');
  if (b) { input.value = b.dataset.line!; input.focus(); }
});

function openHowTo() {
  $('ht-list').innerHTML = HOW_TO_PLAY.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join('');
  $('ht-cmds').innerHTML = COMMANDS.map(([cat, items]) => `<h2 class="label">${esc(cat)}</h2><dl class="cmds">${items.map(([c, d]) => `<dt>${esc(c)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`).join('');
  $('howto-box').hidden = false;
  $('ht-close').focus();
}
$('howto').onclick = openHowTo;
$('nl-howto').onclick = openHowTo;
$('ht-close').onclick = () => { $('howto-box').hidden = true; };
$('helpbtn').onclick = openHowTo;
$('waitbtn').onclick = () => { if (!busy) send('wait 7', 'Wait a week'); };
$('wishbtn').onclick = () => {
  const v = input.value.replace(/\s+$/, '');
  input.value = `${v}${v ? ' ' : ''}()`;
  input.focus();
  input.setSelectionRange(input.value.length - 1, input.value.length - 1);
};
$('askbtn').onclick = () => {
  if (input.value.trim() && !isQuestion(input.value)) input.value = `? ${input.value.trim()}`;
  if (isQuestion(input.value) && questionOf(input.value)) { const v = input.value; input.value = ''; send(v); return; }
  input.value = '? ';
  input.placeholder = 'what should I do now?';
  input.focus();
};

/** A question to the guide (web/ask.ts): out of the story, time does not move, nothing is saved. */
async function askQuestion(text: string, said: string) {
  const q = questionOf(text);
  setBusy(true);
  const turn = newTurn(said);
  turn.insertAdjacentHTML('beforeend', '<p class="text info wet reading">The guide thinks…</p>');
  turn.scrollIntoView({ block: 'start' });
  const recentStory = Array.from(log.querySelectorAll(".turn")).slice(-3, -1).map((t) => (t as HTMLElement).innerText).join('\n');
  let a: { text: string; from: 'claude' | 'game' };
  try { a = await askGuide(ai && aiOn ? ai : null, state, q, recentStory); }
  catch { a = await askGuide(null, state, q); }
  turn.querySelector('.reading')?.remove();
  turn.insertAdjacentHTML('beforeend', `<div class="ask-box"><span class="label">Guide${a.from === 'game' ? ' (from the game)' : ''} · time did not move</span><p>${esc(a.text)}</p></div>`);
  input.placeholder = 'I ask Sukezō where we are';
  setBusy(false);
}

/** Timeskip summary (World Bible ch. 9): what happened to Li, his people and the world while the days passed. */
function skipScreen(x: SkipSummary): Promise<void> {
  const list = (title: string, lines: string[]) => (lines.length ? `<section><h2 class="label">${esc(title)}</h2><ul>${lines.map((l) => `<li>${esc(plain(l))}</li>`).join('')}</ul></section>` : '');
  $('sk-title').textContent = x.days === 1 ? '1 day passes' : `${x.days} days pass`;
  $('sk-when').textContent = `${x.from} → ${x.to}`;
  $('sk-body').innerHTML = (x.stopped ? '<p class="stop">The days stop: something happens.</p>' : '')
    + list('Li', x.li) + list('His people', x.people) + list('The world', x.world)
    + list('Changes', x.changes ? x.changes.split(' · ') : ['Nothing Li can notice.']);
  const box = $('skipbox');
  box.hidden = false;
  $('sk-close').focus();
  return new Promise((done) => { $('sk-close').onclick = () => { box.hidden = true; done(); }; });
}

/** A ceremony (GE ch. 3): who stands there and how each reacts, by their own opinion; they remember it. */
function ceremonyScreen(v: CeremonyView): Promise<void> {
  $('sk-title').textContent = v.title;
  $('sk-when').textContent = v.rows.length ? 'Who stands there, and how they take it' : 'No one Li knows is there';
  $('sk-body').innerHTML = `<ul>${v.rows.map((r) => `<li><b>${esc(r.name)}</b>, ${esc(r.role)}: ${esc(r.reaction)}</li>`).join('')}</ul><p class="lead">They will remember it.</p>`;
  const box = $('skipbox');
  box.hidden = false;
  $('sk-close').focus();
  return new Promise((done) => { $('sk-close').onclick = () => { box.hidden = true; done(); }; });
}

/** Full-screen brush title for 2–3 seconds; a click or key ends it (GE ch. 3b "title card"). */
function titleCard(label: string, title: string, ms = 2600): Promise<void> {
  const box = $('titlecard');
  $('tc-label').textContent = label;
  $('tc-title').textContent = title;
  box.hidden = false;
  return new Promise((done) => {
    const end = () => { clearTimeout(t); box.hidden = true; box.onclick = null; document.removeEventListener('keydown', end); done(); };
    const t = window.setTimeout(end, settings.ink === 'instant' ? 900 : ms);
    box.onclick = end;
    document.addEventListener('keydown', end, { once: true });
  });
}

// ---------- big moments and rest points (GE ch. 3b, 9) ----------

interface Card { label: string; title: string; native?: string; meaning?: string; witnesses?: string }

/** Title cards for big story moments and the turn of a season; the legend screen for legend moments. */
async function bigMoments(events: GameEvent[], seasonBefore: string) {
  for (const e of events) {
    if (e.type !== 'story') continue;
    const d = e.data as { tier?: string; card?: Card };
    if (d.tier === 'title' && d.card) await titleCard(d.card.label, d.card.title);
    if (d.tier === 'legend' && d.card) await legendScreen(d.card, e.fact, e.day);
    const cv = (e.data as { ceremonyView?: CeremonyView }).ceremonyView;
    if (cv) await ceremonyScreen(cv);
  }
  if (state.seasonKey !== seasonBefore) {
    const [year, name] = state.seasonKey.split('-');
    await titleCard('A new season', `${name} · Year ${year}`);
  }
}

function legendScreen(c: Card, text: string, day: number): Promise<void> {
  // Witnesses: the band at the fire (Ishizue's men keep to the fort).
  const witnesses = ['raizen', 'gonza', 'rokubei', 'hisame', 'sukezo', 'hachi'].filter((id) => met(state, id) && state.characters[id].alive).map((id) => state.characters[id].name);
  $('lg-native').textContent = c.native ?? '';
  $('legend').querySelector('.lg-seal')!.textContent = c.native?.endsWith('龍') ? '龍' : (c.native ?? '兵')[0];
  $('lg-text').textContent = text.split(/(?<=\.)\s/)[0];
  $('lg-title').textContent = c.title;
  $('lg-meaning').textContent = c.meaning ? `— ${c.meaning} —` : '';
  const heard = c.witnesses ?? `Heard by: ${witnesses.join(' · ')} and the men of the Red Crane`;
  $('lg-meta').textContent = `Month ${Math.floor(day / 30) % 12 + 1}, Day ${(day % 30) + 1} · ${heard}. Written in the Journal.`;
  const box = $('legend');
  box.hidden = false;
  $('lg-close').focus();
  return new Promise((done) => { $('lg-close').onclick = () => { box.hidden = true; done(); }; });
}

/** "A good place to rest" (GE ch. 9 §4): once the quiet after a peak begins, a short summary of the session. */
let sessionJournal = 0;
let restShownForPeak: number | undefined;
function restPoint(turn: HTMLElement) {
  const peak = lastPeakDay(state);
  if (peak === undefined || restShownForPeak === peak || directorPhase(state) !== 'relax') return;
  restShownForPeak = peak;
  const lines = state.journal.slice(sessionJournal).slice(-4).map((j) => j.text);
  sessionJournal = state.journal.length;
  turn.insertAdjacentHTML('beforeend', `<aside class="rest"><span class="label">A good place to rest</span>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}<p>The game is saved. Goals: survive · win his freedom.</p></aside>`);
}

// ---------- New life and the prologue (GE ch. 8) ----------

interface Settings { mode: 'gm' | 'classic'; ai: 'claude' | 'plain'; guide: 'full' | 'light' | 'off'; ink: 'slow' | 'fast' | 'instant' }
const SETTINGS_KEY = 'sengoku-soldier-settings';
function loadSettings(): Settings {
  try { return { mode: 'gm', ai: 'claude', guide: 'full', ink: 'fast', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }; }
  catch { return { mode: 'gm', ai: 'claude', guide: 'full', ink: 'fast' }; }
}
let settings = loadSettings();
aiOn = settings.ai === 'claude';

function openNewLife() {
  const box = $('newlife');
  for (const [name, value] of Object.entries(settings)) {
    const r = box.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
    if (r) r.checked = true;
  }
  // Which life (save slot) this new life goes into (Oct 17).
  $('nl-lives').innerHTML = SLOTS.map((n) => `<label><input type="radio" name="life" value="${n}"${n === slot ? ' checked' : ''}> <span><b>Life ${n}</b><br><small>${esc(slotLine(n))}</small></span></label>`).join('');
  box.hidden = false;
  $('begin').focus();
}

$('begin').onclick = () => {
  const box = $('newlife');
  const pick = (name: string) => box.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
  settings = { mode: (pick('mode') ?? 'gm') as Settings['mode'], ai: (pick('ai') ?? 'claude') as Settings['ai'], guide: (pick('guide') ?? 'full') as Settings['guide'], ink: (pick('ink') ?? 'fast') as Settings['ink'] };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* not kept: fine */ }
  aiOn = settings.ai === 'claude';
  setStoryteller();
  const life = Number(pick('life'));
  if (SLOTS.includes(life) && life !== slot) { slot = life; try { localStorage.setItem(SLOT_KEY, String(slot)); } catch { /* fine */ } }
  box.hidden = true;
  persist();
  playPrologue();
};

/**
 * The opening (owner vision Oct 10): the film, the playable night of Year 95 (five small choices that colour the moment
 * and Li's first journal lines, never the outcome), "Five years later", then the new life begins with those memories:
 * Game Master mode when Claude is here, the classic chronicle otherwise. Skip keeps the choices made so far, canon for the rest.
 */
async function playPrologue() {
  await Film.play(Scenes.opening()); // the opening film (docs/FILMS.md), then the playable night
  const box = $('prologue');
  type Step = { slide: Slide } | { scene: number };
  const steps: Step[] = [...CHILDHOOD.map((_, scene) => ({ scene })), ...TIME_JUMP.map((slide) => ({ slide }))];
  const picks: (number | undefined)[] = [];
  let i = 0;
  let after: string | undefined; // what happened after a pick, shown before moving on
  const opts = $('pr-opts');
  const paint = (label: string, text: string, quote: string, mood?: string) => {
    box.className = `overlay prologue${mood ? ` ${mood}` : ''}`;
    $('pr-label').textContent = label;
    $('pr-text').textContent = text;
    $('pr-quote').textContent = quote;
    // Restart the ink animation for each step.
    for (const id of ['pr-text', 'pr-quote']) { const el = $(id); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
  };
  const showStep = () => {
    const st = steps[i];
    let choosing = false;
    if ('slide' in st) paint(st.slide.label, st.slide.text, st.slide.quote ?? '', st.slide.mood);
    else {
      const sc = CHILDHOOD[st.scene];
      if (after !== undefined) paint(sc.label, after, '', 'snow');
      else {
        paint(sc.label, sc.text, sc.quote ?? '', 'snow');
        choosing = true;
        $('pr-ask').textContent = sc.ask;
        opts.innerHTML = sc.options.map((o, k) => `<button type="button" data-k="${k}">${esc(o.label)}</button>`).join('');
      }
    }
    $('pr-ask').hidden = !choosing;
    opts.hidden = !choosing;
    if (!choosing) opts.innerHTML = '';
    $('pr-next').hidden = choosing;
    $('pr-dots').innerHTML = steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    $('pr-next').textContent = i === steps.length - 1 ? 'Begin the chronicle' : 'Continue';
    (choosing ? opts.querySelector<HTMLButtonElement>('button') : $('pr-next'))?.focus();
  };
  opts.onclick = (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-k]');
    const st = steps[i];
    if (!b || !('scene' in st)) return;
    const sc = CHILDHOOD[st.scene];
    const k = Number(b.dataset.k);
    picks[st.scene] = k;
    after = [sc.options[k].text, sc.then].filter(Boolean).join('\n\n');
    showStep();
  };
  const close = (skipped: boolean) => {
    box.hidden = true;
    box.className = 'overlay prologue';
    // The new life begins here, with the night's memories first.
    const gm = settings.mode === 'gm' && !!ai;
    const life = beginLife({ gm, picks, skipped });
    state = life.state;
    seen = look(state);
    recent.length = 0;
    log.innerHTML = '';
    if (life.text) show(life.text);
    persist();
    refresh();
    titleCard('Chapter 1', 'The Red Crane').then(() => {
      input.focus({ preventScroll: true });
      if (gmOn(state) && !state.gm?.scenes.length) gmStep(); // Claude opens the story
      else if (settings.mode === 'gm' && !ai) show('Game Master mode needs Claude, which is only here when the page is opened on claude.ai. The classic chronicle plays instead.');
    });
  };
  $('pr-next').onclick = () => {
    const st = steps[i];
    if ('scene' in st && after === undefined) return; // a choice first
    after = undefined;
    if (++i >= steps.length) close(false); else showStep();
  };
  $('pr-skip').onclick = () => close(true);
  box.hidden = false;
  showStep();
}

$('opts').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opt');
  if (b?.dataset.battle) { runBattle(b.dataset.battle as Order | 'auto', b.querySelector('.l')!.textContent ?? ''); return; }
  if (!b) return;
  // Game Master mode (owner, Oct 12): a click puts the choice in the box, to change or add a (wish) before Send.
  // A double click, Enter, or the number key sends it as it is.
  if (gmMode()) { input.value = b.dataset.key!; input.focus(); input.setSelectionRange(input.value.length, input.value.length); return; }
  send(b.dataset.key!, b.querySelector('.l')!.textContent ?? b.dataset.key!);
});
$('opts').addEventListener('dblclick', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opt');
  if (b && !b.dataset.battle && gmMode() && !busy) { input.value = ''; send(b.dataset.key!); }
});

/** One battle phase (or the rest of the battle) with Li's order; the code decides it. At the end Claude tells the aftermath. */
async function runBattle(order: Order | 'auto', label: string) {
  if (busy || !battleOn()) return;
  setBusy(true);
  const before = noticeable(state);
  const fine = growthSnapshot(state);
  const events = order === 'auto' ? battleToEnd(state) : battlePhase(state, order);
  const turn = newTurn(label);
  const lines = events.filter((e) => e.visible && e.type === 'battle').map((e) => `Phase ${(e.data as { battle?: { phase?: number } }).battle?.phase ?? ''} · ${e.fact}`);
  const end = events.find((e) => e.type === 'story' && (e.data as { battleEnd?: string }).battleEnd);
  turn.insertAdjacentHTML('beforeend', lines.slice(-4).map((l) => `<p class="text">${esc(l)}</p>`).join('') + (end ? `<p class="text info">${esc(end.fact)}</p>` : ''));
  turn.insertAdjacentHTML('beforeend', chipsHtml([...replyParts(changesLine(before, noticeable(state)), []).chips, ...growChips(fine)]));
  turn.scrollIntoView({ block: 'start' });
  refresh();
  persist();
  setBusy(false);
  if (end) { await titleCard('The battle is over', (end.data as { winner: string }).winner === 'ally' ? 'Victory' : (end.data as { winner: string }).winner === 'enemy' ? 'Defeat' : 'Night falls'); if (ai && gmOn(state)) await gmStep(); }
}
$('f').addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim() && !busy) { const v = input.value; input.value = ''; send(v); }
});
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => (b.onclick = () => openTab(b.dataset.tab as Tab)));
storyteller.onclick = () => { aiOn = !aiOn; setStoryteller(); };

// ---------- the narrator (web/narrator.ts) ----------
const narratorBtn = $<HTMLButtonElement>('narratorbtn');
const setNarratorBtn = () => { narratorBtn.textContent = narratorOn() ? 'Narrator: on' : 'Narrator: off'; narratorBtn.setAttribute('aria-pressed', String(narratorOn())); };
function fillVoices() {
  const sel = $<HTMLSelectElement>('nr-voice');
  const vs = voices();
  const george = aiVoicePossible() ? `<option value="${GEORGE}">George (AI voice, best)</option>` : '';
  sel.innerHTML = george + vs.map((v) => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('') || '<option value="">No voice found on this device</option>';
  sel.value = narratorVoice();
}
narratorBtn.hidden = !narratorAvailable() && !aiVoicePossible();
onAiStatus((st) => {
  $('nr-status').textContent = st.state === 'loading' ? `George is getting ready: downloading his voice, ${st.pct}% (only the first time, about 330 MB).`
    : st.state === 'ready' ? 'George is ready.'
    : st.state === 'failed' ? `George cannot speak on this page (${st.why}). The browser voice reads instead.`
    : aiVoicePossible() ? 'George is the AI voice: the first time, his voice downloads once (about 330 MB).' : 'This browser cannot run George (no WebGPU); the browser voices are used.';
});
setNarratorBtn();
if (narratorAvailable()) window.speechSynthesis.onvoiceschanged = fillVoices;
narratorBtn.onclick = () => {
  fillVoices();
  $<HTMLInputElement>('nr-on').checked = narratorOn();
  $<HTMLSelectElement>('nr-rate').value = String(narratorRate());
  $('narratorbox').hidden = false;
};
$('nr-on').onchange = () => { setNarrator({ on: $<HTMLInputElement>('nr-on').checked }); setNarratorBtn(); };
$('nr-voice').onchange = () => { setNarrator({ voice: $<HTMLSelectElement>('nr-voice').value }); if ($<HTMLSelectElement>('nr-voice').value === GEORGE) warmAiVoice(); };
$('nr-rate').onchange = () => setNarrator({ rate: Number($<HTMLSelectElement>('nr-rate').value) || 1 });
$('nr-test').onclick = () => { if (!narratorOn()) { setNarrator({ on: true }); $<HTMLInputElement>('nr-on').checked = true; setNarratorBtn(); } speak('Li carries the water past the horse lines. Somewhere in the dark, a guard coughs.'); };
$('nr-close').onclick = () => { $('narratorbox').hidden = true; };
$('skipbtn').onclick = openSkip;
$('retirebtn').onclick = openRetire;
$('wrongbtn').onclick = openWrong;
// Number keys pick an option while the input is empty (desktop speed).
document.addEventListener('keydown', (e) => {
  if (tab !== 'story' || busy || e.ctrlKey || e.metaKey || e.altKey || !/^[1-9]$/.test(e.key)) return;
  if (document.activeElement === input && input.value) return;
  if (document.activeElement instanceof HTMLTextAreaElement) return;
  if (battleOn()) { const b = $('opts').querySelectorAll<HTMLButtonElement>('[data-battle]')[Number(e.key) - 1]; if (b) { e.preventDefault(); b.click(); } return; }
  if (gmMode()) { const t = gmChoices()[Number(e.key) - 1]; if (t) { e.preventDefault(); send(t); } return; }
  const o = options(state).find((x) => x.key === e.key);
  if (o) { e.preventDefault(); send(o.key, o.label); }
});

// New life needs a second press (dialog boxes are not available everywhere).
const newBtn = $<HTMLButtonElement>('new');
let armed: number | undefined;
const disarm = () => { armed = undefined; newBtn.textContent = 'New life'; newBtn.classList.remove('armed'); };
newBtn.onclick = () => {
  if (armed) { clearTimeout(armed); disarm(); start(true); return; }
  newBtn.textContent = 'Press again: start over';
  newBtn.classList.add('armed');
  armed = window.setTimeout(disarm, 4000);
};

// Save file: copy or paste the event log as text.
const box = $('savebox');
const saveText = $<HTMLTextAreaElement>('savetext');
$('savebtn').onclick = () => { saveText.value = JSON.stringify(toSave(state)); renderSlots(); $('cloudnote').textContent = cloudNote; box.hidden = false; saveText.focus(); };

/** One line about the life in a slot (replayed from its save; an old save says so). */
function slotLine(n: number): string {
  if (n === slot) return `${describe(state)} · playing now`;
  let raw: string | null = null;
  try { raw = localStorage.getItem(slotKey(n)); } catch { /* blocked */ }
  if (!raw) return 'Empty: begin a new life here';
  try { return describe(fromSave(JSON.parse(raw))); } catch { return 'A life from an older game version (it will start over)'; }
}
function describe(g: GameState): string {
  const c = li(g);
  return `Year ${g.date.year}, Month ${g.date.month}, Day ${g.date.day} · age ${Math.floor(liAge(g))} · ${c.status === 'slave' ? 'slave' : 'free'}${g.knowledge.includes('nickname_kurose_no_ryu') ? ' · Kurose no Ryū' : ''}`;
}
function renderSlots() {
  $('slots').innerHTML = SLOTS.map((n) => `<button type="button" class="slot${n === slot ? ' on' : ''}" data-slot="${n}"${n === slot ? ' aria-current="true"' : ''}><b>Life ${n}</b> <span>${esc(slotLine(n))}</span></button>`).join('');
}
$('slots').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-slot]');
  const n = Number(b?.dataset.slot);
  if (!b || n === slot || busy) return;
  persist();
  slot = n;
  try { localStorage.setItem(SLOT_KEY, String(slot)); } catch { /* fine */ }
  box.hidden = true;
  hadSave = false;
  start();
});
$('closesave').onclick = () => { box.hidden = true; };
$('downloadsave').onclick = async () => {
  const b = $<HTMLButtonElement>('downloadsave');
  try { b.textContent = await pageDownload(`sengoku-soldier-life-${slot}-year-${state.date.year}.json`, JSON.stringify(toSave(state))); }
  catch { b.textContent = 'Not possible here: use Copy'; }
  setTimeout(() => { b.textContent = 'Download save'; }, 3000);
};
$('copysave').onclick = async () => {
  try { await navigator.clipboard.writeText(saveText.value); $('copysave').textContent = 'Copied'; }
  catch { saveText.focus(); saveText.select(); $('copysave').textContent = 'Press Ctrl+C to copy'; }
};
$('loadsave').onclick = () => {
  try {
    state = fromSave(JSON.parse(saveText.value));
    seen = look(state);
    box.hidden = true;
    log.innerHTML = '';
    show('Save loaded. The chronicle continues.');
    persist();
  } catch (e) {
    show(`That save could not be loaded: ${(e as Error).message}`);
  }
};

start();
// The title screen first (GE ch. 3): Continue · New life · How to play · Load save.
{
  const ts = $('titlescreen');
  const go = (then?: () => void) => () => { ts.hidden = true; then?.(); };
  $<HTMLButtonElement>('ts-continue').hidden = !hadSave;
  $('ts-continue').onclick = go();
  $('ts-new').onclick = go(() => { if (hadSave) openNewLife(); });
  $('ts-howto').onclick = go(() => $('howto').click());
  $('ts-load').onclick = go(() => $('savebtn').click());
  ts.hidden = false;
  (hadSave ? $('ts-continue') : $('ts-new')).focus();
}
setStoryteller();
pageAdapter().then((a) => { ai = a; setStoryteller(); }).catch(() => setStoryteller()).finally(() => checkCloud());
// For checking the films by hand (browser console): __films.Film.play(__films.Scenes.zone())
(window as unknown as { __films: unknown }).__films = { Film, Scenes };
