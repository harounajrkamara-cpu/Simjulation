import { AiAdapter, PERMANENT, errorCode } from '../ai/adapter';
import { Reading, interpret } from '../ai/interpret';
import { Narration, narrate, shouldNarrate, templateText } from '../ai/narrate';
import { FactPacket, buildPacket } from '../ai/packet';
import { fromSave, li, liAge, met, options, recordNote, toSave } from '../engine/engine';
import { Reply, handleAction, handleInput, newGame, parseFreeText } from '../engine/game';
import { SkipSummary, summaryText } from '../engine/summary';
import { GmChange, gmApplyFix, gmOn, gmRewind, lastFightResult } from '../engine/gm';
import { GmFixProposal, GmPlay, gmChapter, gmFix, gmSkip, gmTurn } from '../ai/gm';
import { CHILDHOOD, TIME_JUMP, beginLife } from '../engine/prologue';
import { BattleState, MAX_PHASES, Order, battleView, ordersFor } from '../engine/battle';
import { battlePhase, battleToEnd } from '../engine/gm-battle';
import { changesLine, duelPanel, growthSnapshot, noticeable, progressChips } from '../engine/render';
import { GameEvent } from '../engine/types';
import { lastPeakDay, phase as directorPhase } from '../engine/director';
import { WOUND_LABEL } from '../engine/rules';
import { PROLOGUE, Slide } from '../engine/content';
import { GameState } from '../engine/types';
import { pageAdapter, pageDownload } from './ai-page';
import { Guidance, HOW_TO_PLAY, exampleLines, nextHint, termify } from './guide';
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
  const page = PAGES[t];
  if (page) $(`tab-${t}`).innerHTML = page(state);
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
function battleHtml(b: BattleState): string {
  const v = battleView(b);
  const rows = v.sectors.map((x) => `<tr><th>${esc(x.sector)}</th><td>${esc(x.ours)}</td><td>${esc(x.theirs)}</td><td class="src">${esc(x.source)}</td></tr>`).join('');
  return `<strong>${esc(v.title)} · phase ${v.phase + 1} of at most ${MAX_PHASES}</strong>
    <p class="duel-meta">Li's unit: ${v.li.men} of ${v.li.start} men · ${esc(v.li.morale)}</p>
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
    duel.innerHTML = `<strong>Round ${d.round + 1} of 10</strong><div class="fighters">${card('Li', d.li, d.li.observed ? `read him ${Math.min(3, d.li.observed)} of 3` : '')}<span class="vs" aria-hidden="true">対</span>${card(d.foe.name.replace(/^the /, 'The '), d.foe, d.estimate ?? '')}</div>${d.hint ? `<p class="duel-meta">What Li has read: ${esc(d.hint)}</p>` : ''}`;
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
  $('side-map').innerHTML = mapSvg(state);
  $('chronicle').innerHTML = chronicle(state);
  $('goals').innerHTML = goalsHtml(state);
  renderOptions();
  renderGuide();
  $('tools').hidden = !(ai && gmOn(state));
  $<HTMLButtonElement>('skipbtn').disabled = busy || !gmMode() || battleOn();
  $<HTMLButtonElement>('wrongbtn').disabled = busy;
  if (tab !== 'story' && PAGES[tab]) { $(`tab-${tab}`).innerHTML = PAGES[tab]!(state); markSeen(tab); }
  dots();
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

function aiFailed(e: unknown, turn: HTMLElement) {
  const code = errorCode(e);
  if (code === 'cancelled') return;
  if (PERMANENT.has(code)) { ai = null; setStoryteller(); }
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
  try {
    const r = await gmTurn(ai, state, text);
    turn.querySelector('.wet')?.remove();
    await paintPlay(turn, r, said, before, metBefore, true, fine);
    refresh();
    await afterPlays(r.events, r.turn.scene, seasonBefore, statusBefore, !!r.duelId);
  } catch (e) {
    turn.querySelector('.wet')?.remove();
    if (errorCode(e) === 'bad_answer') turn.insertAdjacentHTML('beforeend', `<p class="text info">${esc((e as Error).message)} Try again.</p>`);
    else aiFailed(e, turn);
    if (text) input.value = text;
  }
  refresh();
  persist();
  await maybeChapter();
  setBusy(false);
}

/** One Game Master scene in the log: the story (inked or at once), its chips, the GM's out-of-character note, "Why?". */
async function paintPlay(turn: HTMLElement, r: GmPlay, said: string | undefined, before: ReturnType<typeof noticeable>, metBefore: Set<string>, ink: boolean, fine: Record<string, number>) {
  const p = document.createElement('p');
  p.className = 'text';
  turn.appendChild(p);
  if (ink) await inkReveal(p, r.turn.scene);
  else p.innerHTML = termify(esc(r.turn.scene), state);
  const newPeople = Object.keys(state.relations).filter((id) => met(state, id) && !metBefore.has(id)).map((id) => state.characters[id].name);
  turn.insertAdjacentHTML('beforeend', chipsHtml([...replyParts(changesLine(before, noticeable(state)), newPeople).chips, ...growChips(fine)]));
  if (r.turn.gmNote) turn.insertAdjacentHTML('beforeend', `<p class="text gmnote">Game Master: ${esc(r.turn.gmNote)}</p>`);
  const why = [said ? `Because Li chose: ${said}.` : '', r.turn.journal ? `Li's journal: ${r.turn.journal}` : '', r.notes.length ? `The rules held: ${r.notes.join('; ')}.` : ''].filter(Boolean);
  if (why.length) turn.insertAdjacentHTML('beforeend', `<details class="why"><summary>Why?</summary><p>${esc(why.join(' '))}</p></details>`);
}

/** After Game Master scenes: title cards, a freedom legend, the start of a fight. */
async function afterPlays(events: GameEvent[], scene: string, seasonBefore: string, statusBefore: string, fight: boolean) {
  await bigMoments(events, seasonBefore);
  if (li(state).status !== statusBefore) {
    const how = state.knowledge.includes('hunted') ? 'by his own feet, and hunted' : 'his paper burned';
    await legendScreen({ label: 'Legend moment', title: 'Free', native: '自由', meaning: how }, scene, state.events.at(-1)!.day);
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
    await titleCard(`Chapter ${state.gm?.chapters?.length ?? 1} closes`, (ev[0].data as { title: string }).title);
  } catch { /* the chapter closes next time */ }
}

// ---------- Game Master tools: Skip ahead, Something's wrong (owner vision Oct 10) ----------

const toolbox = $('toolbox');
const closeTools = () => { toolbox.hidden = true; toolbox.innerHTML = ''; };

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

async function runSkip(until: string, plan: string) {
  if (!ai || busy) return;
  setBusy(true);
  const head = newTurn(`Skip ahead ${until}. ${plan}`);
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
    const plays = await gmSkip(ai, state, { until, plan }, (r) => {
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
    else aiFailed(e, head);
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
  if (!ai || busy) return;
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
  if (ai && aiOn && reply.acted && shouldNarrate(events, free)) {
    const packet = buildPacket(state, events, free ? said : undefined, recent);
    turn.insertAdjacentHTML('beforeend', `<p class="text ink wet">The ink is still wet…</p>${notes.map(paraHtml).join('')}${chipsHtml(parts.chips)}`);
    refresh();
    turn.scrollIntoView({ block: 'start' });
    await narrateInto(turn, packet);
  } else {
    turn.insertAdjacentHTML('beforeend', story.concat(notes).map(paraHtml).join('') + chipsHtml(parts.chips));
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
}

/** Game Master mode outside a fight: Claude runs the turn. */
const gmMode = () => gmOn(state) && !(state.duel && !state.duel.over);
const gmChoices = () => state.gm?.suggestions?.length ? state.gm.suggestions : ['I look around and wait for what comes'];

async function send(raw: string, said = raw) {
  if (busy) return;
  fineMark = growthSnapshot(state);
  if (shownHint) markHint(shownHint); // a hint closes itself once the player acts (ch. 8 §4)
  const text = raw.trim();
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
  persist();
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
  $('howto-box').hidden = false;
  $('ht-close').focus();
}
$('howto').onclick = openHowTo;
$('nl-howto').onclick = openHowTo;
$('ht-close').onclick = () => { $('howto-box').hidden = true; };

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
  box.hidden = true;
  playPrologue();
};

/**
 * The opening (owner vision Oct 10): the film, the playable night of Year 95 (five small choices that colour the moment
 * and Li's first journal lines, never the outcome), "Five years later", then the new life begins with those memories:
 * Game Master mode when Claude is here, the classic chronicle otherwise. Skip keeps the choices made so far, canon for the rest.
 */
function playPrologue() {
  const box = $('prologue');
  type Step = { slide: Slide } | { scene: number };
  const steps: Step[] = [...PROLOGUE.map((slide) => ({ slide })), ...CHILDHOOD.map((_, scene) => ({ scene })), ...TIME_JUMP.map((slide) => ({ slide }))];
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
  if (b) send(b.dataset.key!, b.querySelector('.l')!.textContent ?? b.dataset.key!);
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
$('skipbtn').onclick = openSkip;
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
$('savebtn').onclick = () => { saveText.value = JSON.stringify(toSave(state)); renderSlots(); box.hidden = false; saveText.focus(); };

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
setStoryteller();
pageAdapter().then((a) => { ai = a; setStoryteller(); }).catch(() => setStoryteller());
