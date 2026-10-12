import { buildPacket } from '../ai/packet';
import { shouldNarrate } from '../ai/narrate';
import { handleInput, newGame } from '../engine/game';
import { optionsText, shortDashboard } from '../engine/render';
import { loadFrom, saveTo } from './storage';

// Chat mode: one input per call, so Claude can play the game with the owner in a conversation.
//   npm run turn -- new        start a new game
//   npm run turn -- "2"        choose option 2
//   npm run turn -- show       show the current situation
const FILE = process.env.SAVE ?? 'saves/chat.json';
const input = process.argv.slice(2).join(' ');

const wantsNew = input.trim().toLowerCase() === 'new';
let state;
try {
  state = wantsNew ? undefined : loadFrom(FILE);
} catch (e) {
  console.log(`⚠ ${(e as Error).message}\nStart a new game with: npm run turn -- new`);
  process.exit(1);
}
if (!state || wantsNew) {
  const g = newGame();
  saveTo(FILE, g.state);
  console.log(g.text);
} else if (input.trim().toLowerCase() === 'show' || !input.trim()) {
  console.log(`${shortDashboard(state)}\n\n${optionsText(state)}`);
} else {
  const r = handleInput(state, input);
  if (r.command === 'save') saveTo(FILE.replace('.json', '.slot1.json'), state);
  console.log(r.command === 'save' ? 'Saved.' : r.text);
  // For the play skill: the facts the narrator may use (Game Experience ch. 7), only after story moments.
  const free = !/^\d$/.test(input.trim()) && !/^(HELP|STATUS|INFOCHAR|RELATIONS|RECAP|LOG|SAVE|LOAD|WAIT|SKIP)\b/i.test(input.trim());
  if (r.acted && r.events && shouldNarrate(r.events, free)) {
    const p = buildPacket(state, r.events, free ? input : undefined);
    console.log(`\n--- narrator packet (play skill: tell only this) ---\n${JSON.stringify({ tier: p.tier, words: p.words, place: p.place, facts: p.facts, coreLines: p.coreLines, people: p.people.map((x) => `${x.name} (${x.personality}; toward Li: ${x.viewOfLi})`) }, null, 1)}`);
  }
  saveTo(FILE, state);
}
