import { fromSave, li, met, options, toSave } from '../engine/engine';
import { handleInput, newGame } from '../engine/game';
import { duelPanel } from '../engine/render';
import { GameState } from '../engine/types';
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

/** Turn the engine's reply text into story paragraphs, change chips and notes. */
function renderReply(text: string, newPeople: string[]): string {
  const lines = text.split('\n').filter((l) => !/^(📅|📍)/.test(l) && !/^\d\. /.test(l) && !/^Or (type freely|write what Li does)/.test(l));
  const blocks = lines.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
    .filter((b) => !b.startsWith('⚔ DUEL') && !b.startsWith('What Li has read'));
  const out: string[] = [];
  const chips: string[] = newPeople.map((n) => `<span class="chip new">New: ${esc(n)}</span>`);
  for (const block of blocks) {
    for (const part of block.split('\n').filter((l) => l.startsWith('Changes:') || l.startsWith('(Healing'))) {
      if (part.startsWith('Changes:')) {
        for (const c of part.slice(8).split(' · ').map((x) => x.trim()).filter(Boolean)) {
          chips.push(`<span class="chip ${c.startsWith('▲') ? 'up' : c.startsWith('▼') ? 'down' : ''}">${esc(c)}</span>`);
        }
      } else chips.push(`<span class="chip">${esc(part.replace(/[()]/g, ''))}</span>`);
    }
    const body = block.split('\n').filter((l) => !l.startsWith('Changes:') && !l.startsWith('(Healing')).join('\n').trim();
    if (!body) continue;
    const kind = /^[◆]/.test(body) ? 'spark' : /^⚠/.test(body) ? 'alert' : /^(==|Commands:|Pick an option|— Month|Li's journal)/.test(body) || /^Li does not know/.test(body) ? 'info' : '';
    for (const para of body.split(/\n(?=[◆⚠])/)) out.push(`<p class="text ${kind}">${esc(plain(para.replace(/^[◆⚠]\s*/, '')))}</p>`);
  }
  if (chips.length) out.push(`<div class="chips">${chips.join('')}</div>`);
  return out.join('');
}

function show(text: string, said?: string, newPeople: string[] = []) {
  log.querySelectorAll('.turn:not(.old)').forEach((t) => { t.classList.add('old'); t.classList.remove('fresh'); });
  const turn = document.createElement('article');
  turn.className = 'turn fresh';
  turn.innerHTML = (said ? `<p class="said">${esc(said)}</p>` : '') + renderReply(text, newPeople);
  log.appendChild(turn);
  while (log.children.length > 40) log.firstElementChild!.remove();
  turn.scrollIntoView({ block: 'start' });
  refresh();
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
    return `<button type="button" class="opt" data-key="${esc(o.key)}"><span class="k">${esc(o.key)}</span><span class="l">${esc(o.label)}</span>${t ? `<span class="t">${t}</span>` : ''}</button>`;
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
  if (tab !== 'story' && PAGES[tab]) { $(`tab-${tab}`).innerHTML = PAGES[tab]!(state); markSeen(tab); }
  dots();
}

// ---------- input ----------

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(toSave(state))); } catch { /* storage blocked: the game still runs */ }
}

function send(text: string, said = text) {
  const before = new Set(Object.keys(state.relations).filter((id) => met(state, id)));
  const r = handleInput(state, text);
  if (r.command === 'new') return start(true);
  if (r.command === 'save') { persist(); return show('Saved in this browser. Use "Save file" to copy it somewhere safe.', said); }
  if (r.command === 'load') { if (!resume()) show('No saved game in this browser.', said); return; }
  const newPeople = Object.keys(state.relations).filter((id) => met(state, id) && !before.has(id)).map((id) => state.characters[id].name);
  show(r.text, said, newPeople);
  persist();
}

function resume(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    state = fromSave(JSON.parse(raw));
    seen = look(state);
    log.innerHTML = '';
    show('The chronicle continues.');
    return true;
  } catch (e) {
    // No game state may exist yet: start() shows this note together with the new game.
    note = `${(e as Error).message} A new life begins.`;
    return false;
  }
}

let note = '';

function start(fresh = false) {
  if (!fresh && resume()) return;
  log.innerHTML = '';
  const g = newGame();
  state = g.state;
  seen = look(state);
  show(note ? `${note}\n\n${g.text}` : g.text);
  note = '';
  persist();
}

$('opts').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.opt');
  if (b) send(b.dataset.key!, b.querySelector('.l')!.textContent ?? b.dataset.key!);
});
$('f').addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) { send(input.value); input.value = ''; }
});
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => (b.onclick = () => openTab(b.dataset.tab as Tab)));
// Number keys pick an option while the input is empty (desktop speed).
document.addEventListener('keydown', (e) => {
  if (tab !== 'story' || e.ctrlKey || e.metaKey || e.altKey || !/^[1-9]$/.test(e.key)) return;
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
