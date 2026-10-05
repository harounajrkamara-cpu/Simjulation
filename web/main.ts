import { fromSave, options, toSave } from '../engine/engine';
import { handleInput, newGame } from '../engine/game';
import { optionsText, shortDashboard } from '../engine/render';
import { GameState } from '../engine/types';

// Browser mode. The save format is the same as the terminal/chat mode (export/import to move between them).
const KEY = 'sengoku-soldier-save';
const log = document.getElementById('log')!;
const opts = document.getElementById('opts')!;
const input = document.getElementById('in') as HTMLInputElement;
let state: GameState;

function show(text: string, you?: string) {
  const div = document.createElement('div');
  div.className = 'turn';
  if (you) { const p = document.createElement('p'); p.className = 'you'; p.textContent = `> ${you}`; log.appendChild(p); }
  // Options are shown as buttons, so cut them from the text.
  div.textContent = text.split('\n').filter((l) => !/^\d\. /.test(l) && !l.startsWith('Or type freely')).join('\n').trim();
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  renderOptions();
}

function renderOptions() {
  opts.innerHTML = '';
  for (const o of options(state)) {
    const b = document.createElement('button');
    b.textContent = `${o.key}. ${o.label}${o.test ? `  (${o.test})` : ''}${o.risk ? `  ⚠ ${o.risk}` : ''}`;
    b.onclick = () => send(o.key);
    opts.appendChild(b);
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(toSave(state))); } catch { /* storage may be blocked */ }
}

function send(text: string) {
  const r = handleInput(state, text);
  if (r.command === 'new') return start(true);
  if (r.command === 'save') { save(); return show('Saved in this browser.', text); }
  if (r.command === 'load') { load(); return; }
  show(r.text, text);
  save();
}

function load(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    state = fromSave(JSON.parse(raw));
    show(`Continuing your game.\n\n${shortDashboard(state)}`);
    return true;
  } catch (e) {
    show(`⚠ ${(e as Error).message}`);
    return false;
  }
}

function start(fresh = false) {
  log.innerHTML = '';
  if (!fresh && load()) return;
  const g = newGame();
  state = g.state;
  show(g.text);
  save();
}

document.getElementById('f')!.addEventListener('submit', (e) => { e.preventDefault(); if (input.value.trim()) { send(input.value); input.value = ''; } });
document.querySelectorAll<HTMLButtonElement>('[data-cmd]').forEach((b) => (b.onclick = () => send(b.dataset.cmd!)));
document.getElementById('new')!.onclick = () => { if (confirm('Start a new game? Your current game will be replaced.')) start(true); };
document.getElementById('export')!.onclick = () => {
  const blob = new Blob([JSON.stringify(toSave(state))], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sengoku-soldier-save.json'; a.click();
};
const file = document.getElementById('import') as HTMLInputElement;
document.getElementById('importBtn')!.onclick = () => file.click();
file.onchange = async () => {
  const f = file.files?.[0]; if (!f) return;
  try { state = fromSave(JSON.parse(await f.text())); log.innerHTML = ''; show(`Save imported.\n\n${shortDashboard(state)}\n\n${optionsText(state)}`); save(); }
  catch (e) { show(`⚠ ${(e as Error).message}`); }
};

start();
