import { AiAdapter, PERMANENT, errorCode } from '../ai/adapter';
import { Reading, interpret } from '../ai/interpret';
import { Narration, narrate, shouldNarrate, templateText } from '../ai/narrate';
import { FactPacket, buildPacket } from '../ai/packet';
import { fromSave, li, met, options, recordNote, toSave } from '../engine/engine';
import { Reply, handleAction, handleInput, newGame, parseFreeText } from '../engine/game';
import { GameEvent } from '../engine/types';
import { PROLOGUE } from '../engine/content';
import { duelPanel } from '../engine/render';
import { GameState } from '../engine/types';
import { pageAdapter } from './ai-page';
import { Guidance, HOW_TO_PLAY, exampleLines, nextHint, termify } from './guide';
import {
  armyPage, chronicle, encyclopediaPage, esc, journalPage, knownEntries, liCard, liPage, mapPage, mapSvg, peoplePage, plain, scene, strip,
} from './panels';

// Browser mode: the war chronicle (Game Experience ch. 3, 6). Same engine and save format as the terminal and chat modes.
const KEY = 'sengoku-soldier-save';
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

function renderOptions() {
  const panel = duelPanel(state);
  const duel = $('duel');
  duel.hidden = !panel;
  if (panel) {
    const [head, ...rest] = panel.split('\n');
    duel.innerHTML = `<strong>${esc(plain(head))}</strong>${esc(rest.join('\n'))}`;
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
  $('side-map').innerHTML = mapSvg(state);
  $('chronicle').innerHTML = chronicle(state);
  renderOptions();
  renderGuide();
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
}

/** Show a resolved turn: narrated by Claude when it is a story moment, template text otherwise. */
async function finish(reply: Reply, turn: HTMLElement, said: string | undefined, free: boolean, before: Set<string>) {
  const newPeople = Object.keys(state.relations).filter((id) => met(state, id) && !before.has(id)).map((id) => state.characters[id].name);
  const parts = replyParts(reply.text, newPeople);
  const events = reply.events ?? [];
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
  try { localStorage.setItem(KEY, JSON.stringify(toSave(state))); } catch { /* storage blocked: the game still runs */ }
}

async function send(raw: string, said = raw) {
  if (busy) return;
  if (shownHint) markHint(shownHint); // a hint closes itself once the player acts (ch. 8 §4)
  const text = raw.trim();
  if (!options(state).some((o) => o.key === text) && !COMMAND.test(text)) bumpFree();
  const before = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
  const isKey = options(state).some((o) => o.key === text);
  if (isKey || COMMAND.test(text) || !ai || !aiOn) {
    const r = handleInput(state, text);
    if (r.command === 'new') return start(true);
    if (r.command === 'save') { persist(); return show('Saved in this browser. Use "Save file" to copy it somewhere safe.', said); }
    if (r.command === 'load') { if (!resume()) show('No saved game in this browser.', said); return; }
    setBusy(true);
    await finish(r, newTurn(said), said, !isKey && !COMMAND.test(text), before);
    return setBusy(false);
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
  if (reading.kind === 'command') { await finish(handleInput(state, reading.command), turn, said, false, before); return setBusy(false); }
  if (reading.risky || reading.confidence < 0.75) {
    // The game stays busy while the box is open, so no other turn can slip in before the answer.
    if (!(await confirmReading(turn, reading))) { turn.insertAdjacentHTML('beforeend', '<p class="text info">Then write it again, or pick an option.</p>'); setBusy(false); input.value = raw; input.focus(); return; }
  }
  recordNote(state, 'intent', `intent: ${reading.label}`, { input: text, action: reading.action, tone: reading.tone, says: reading.says, confidence: reading.confidence, by: teller });
  await finish(handleAction(state, reading.action), turn, said, true, before);
  setBusy(false);
}

function resume(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    state = fromSave(JSON.parse(raw));
    seen = look(state);
    log.innerHTML = '';
    const last = [...state.events].reverse().find((e) => e.type === 'narration');
    show(last ? `${(last.data as { text: string }).text}\n\nThe chronicle continues.` : 'The chronicle continues.');
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

// ---------- New life and the prologue (GE ch. 8) ----------

interface Settings { ai: 'claude' | 'plain'; guide: 'full' | 'light' | 'off'; ink: 'slow' | 'fast' | 'instant' }
const SETTINGS_KEY = 'sengoku-soldier-settings';
function loadSettings(): Settings {
  try { return { ai: 'claude', guide: 'full', ink: 'fast', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }; }
  catch { return { ai: 'claude', guide: 'full', ink: 'fast' }; }
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
  settings = { ai: (pick('ai') ?? 'claude') as Settings['ai'], guide: (pick('guide') ?? 'full') as Settings['guide'], ink: (pick('ink') ?? 'fast') as Settings['ink'] };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* not kept: fine */ }
  aiOn = settings.ai === 'claude';
  setStoryteller();
  box.hidden = true;
  playPrologue();
};

function playPrologue() {
  const box = $('prologue');
  let i = 0;
  const show = () => {
    const slide = PROLOGUE[i];
    $('pr-label').textContent = slide.label;
    $('pr-text').textContent = slide.text;
    $('pr-quote').textContent = slide.quote ?? '';
    // Restart the ink animation for each slide.
    for (const id of ['pr-text', 'pr-quote']) { const el = $(id); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
    $('pr-dots').innerHTML = PROLOGUE.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
    $('pr-next').textContent = i === PROLOGUE.length - 1 ? 'Begin the chronicle' : 'Continue';
  };
  const close = () => { box.hidden = true; titleCard('Chapter 1', 'The Red Crane').then(() => input.focus({ preventScroll: true })); };
  $('pr-next').onclick = () => { if (++i >= PROLOGUE.length) close(); else show(); };
  $('pr-skip').onclick = close;
  box.hidden = false;
  show();
  $('pr-next').focus();
}

$('opts').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opt');
  if (b) send(b.dataset.key!, b.querySelector('.l')!.textContent ?? b.dataset.key!);
});
$('f').addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim() && !busy) { const v = input.value; input.value = ''; send(v); }
});
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => (b.onclick = () => openTab(b.dataset.tab as Tab)));
storyteller.onclick = () => { aiOn = !aiOn; setStoryteller(); };
// Number keys pick an option while the input is empty (desktop speed).
document.addEventListener('keydown', (e) => {
  if (tab !== 'story' || busy || e.ctrlKey || e.metaKey || e.altKey || !/^[1-9]$/.test(e.key)) return;
  if (document.activeElement === input && input.value) return;
  if (document.activeElement instanceof HTMLTextAreaElement) return;
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
$('savebtn').onclick = () => { saveText.value = JSON.stringify(toSave(state)); box.hidden = false; saveText.focus(); };
$('closesave').onclick = () => { box.hidden = true; };
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
