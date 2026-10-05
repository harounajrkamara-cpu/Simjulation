import { fromSave, options, toSave } from '../engine/engine';
import { handleInput, newGame } from '../engine/game';
import { duelPanel, shortDashboard } from '../engine/render';
import { GameState } from '../engine/types';

// Browser mode (local `npm run web` and the published page). Same engine and save format as terminal/chat mode.
const KEY = 'sengoku-soldier-save';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const log = $('log');
const opts = $('opts');
const input = $<HTMLInputElement>('in');
let state: GameState;

function classify(block: string): string {
  if (/^(📅|📍)/.test(block)) return 'meta';
  if (block.startsWith('Changes:')) return 'meta changes';
  if (block.startsWith('⚔ DUEL')) return 'meta duel';
  if (/^(==|— Month|Commands:)/.test(block)) return 'meta info';
  return 'story';
}

function show(text: string, you?: string) {
  const turn = document.createElement('div');
  turn.className = 'turn';
  if (you) {
    const y = document.createElement('div');
    y.className = 'you';
    y.textContent = `› ${you}`;
    turn.appendChild(y);
  }
  // Options and the duel panel are rendered separately, so drop them from the text.
  const kept = text.split('\n').filter((l) => !/^\d\. /.test(l) && !l.startsWith('Or type freely'));
  const blocks = kept.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
    .filter((b) => !b.startsWith('⚔ DUEL') && !b.startsWith('What you have read'));
  // Keep dashboard lines together as one block.
  for (const b of blocks) {
    const p = document.createElement('div');
    p.className = classify(b);
    p.textContent = b;
    turn.appendChild(p);
  }
  log.appendChild(turn);
  log.scrollTop = log.scrollHeight;
  renderOptions();
}

function renderOptions() {
  opts.innerHTML = '';
  const panel = duelPanel(state);
  if (panel) {
    const d = document.createElement('div');
    d.className = 'meta duel';
    d.textContent = panel;
    opts.appendChild(d);
  }
  for (const o of options(state)) {
    const b = document.createElement('button');
    b.type = 'button';
    const k = document.createElement('span'); k.className = 'k'; k.textContent = o.key;
    const l = document.createElement('span'); l.textContent = o.label;
    b.append(k, l);
    if (o.test || o.risk) {
      const t = document.createElement('span'); t.className = 't';
      t.textContent = o.test ?? '';
      if (o.risk) { const r = document.createElement('span'); r.className = 'risk'; r.textContent = `${o.test ? ' · ' : ''}⚠ ${o.risk}`; t.appendChild(r); }
      b.appendChild(t);
    }
    b.onclick = () => send(o.key);
    opts.appendChild(b);
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(toSave(state))); } catch { /* storage blocked: the game still runs */ }
}

function send(text: string) {
  const r = handleInput(state, text);
  if (r.command === 'new') return start(true);
  if (r.command === 'save') { persist(); return show('Saved in this browser. Use "Save file" to copy it somewhere safe.', text); }
  if (r.command === 'load') { if (!resume()) show('No saved game in this browser.', text); return; }
  show(r.text, text);
  persist();
}

function resume(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    state = fromSave(JSON.parse(raw));
    log.innerHTML = '';
    show(`Continuing your game.\n\n${shortDashboard(state)}`);
    return true;
  } catch (e) {
    show(`⚠ ${(e as Error).message} Starting a new game.`);
    return false;
  }
}

function start(fresh = false) {
  if (!fresh && resume()) return;
  log.innerHTML = '';
  const g = newGame();
  state = g.state;
  show(g.text);
  persist();
}

$('f').addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim()) { send(input.value); input.value = ''; }
});
document.querySelectorAll<HTMLButtonElement>('[data-cmd]').forEach((b) => (b.onclick = () => send(b.dataset.cmd!)));

// New game needs a second tap (dialog boxes are not available everywhere).
const newBtn = $<HTMLButtonElement>('new');
let armed: number | undefined;
newBtn.onclick = () => {
  if (armed) { clearTimeout(armed); armed = undefined; newBtn.textContent = 'New game'; newBtn.classList.remove('armed'); start(true); return; }
  newBtn.textContent = 'Tap again to restart';
  newBtn.classList.add('armed');
  armed = window.setTimeout(() => { armed = undefined; newBtn.textContent = 'New game'; newBtn.classList.remove('armed'); }, 4000);
};

// Save file: copy/paste the event log as text.
const box = $('savebox');
const saveText = $<HTMLTextAreaElement>('savetext');
$('savebtn').onclick = () => { saveText.value = JSON.stringify(toSave(state)); box.hidden = false; };
$('closesave').onclick = () => { box.hidden = true; };
$('copysave').onclick = async () => {
  try { await navigator.clipboard.writeText(saveText.value); $('copysave').textContent = 'Copied'; }
  catch { saveText.focus(); saveText.select(); $('copysave').textContent = 'Press Ctrl+C / Copy'; }
};
$('loadsave').onclick = () => {
  try {
    state = fromSave(JSON.parse(saveText.value));
    box.hidden = true;
    log.innerHTML = '';
    show(`Save loaded.\n\n${shortDashboard(state)}`);
    persist();
  } catch (e) {
    show(`⚠ That save could not be loaded: ${(e as Error).message}`);
  }
};

start();
