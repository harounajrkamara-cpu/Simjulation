import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { handleInput, newGame } from '../engine/game';
import { optionsText, shortDashboard } from '../engine/render';
import { loadFrom, saveTo } from './storage';

// Interactive terminal mode: npm run play
const AUTOSAVE = 'saves/autosave.json';
const SLOT = 'saves/slot1.json';

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  let state;
  try {
    state = loadFrom(AUTOSAVE);
  } catch (e) {
    console.log(`⚠ ${(e as Error).message} Starting a new game.`);
  }
  if (state) console.log(`Continuing your game.\n\n${shortDashboard(state)}\n\n${optionsText(state)}`);
  else {
    const g = newGame();
    state = g.state;
    console.log(`SENGOKU SOLDIER\n\n${g.text}`);
  }
  for (;;) {
    const line = await rl.question('\n> ');
    if (['quit', 'exit'].includes(line.trim().toLowerCase())) break;
    const r = handleInput(state, line);
    if (r.command === 'save') { saveTo(SLOT, state); console.log('Saved to saves/slot1.json.'); continue; }
    if (r.command === 'load') { const l = loadFrom(SLOT); if (l) { state = l; console.log(`Loaded.\n\n${shortDashboard(state)}\n\n${optionsText(state)}`); } else console.log('No save in slot 1.'); continue; }
    if (r.command === 'new') { const g = newGame(); state = g.state; console.log(g.text); continue; }
    console.log(`\n${r.text}`);
    saveTo(AUTOSAVE, state); // autosave every turn (ch. 11)
  }
  saveTo(AUTOSAVE, state);
  rl.close();
}
main();
