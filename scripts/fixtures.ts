// Saves just before big moments, for the UI check (npm run ui:check). Prints JSON to stdout.
import { startGame, takeAction, toSave, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

const quiet = (s: GameState) => { const p = s.date.part; takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' }); };

// The evening before the raid (Month 2, Day 6): one more turn brings the night and the fire on the river.
const beforeRaid = startGame();
while (!(today(beforeRaid) === 35 && beforeRaid.date.part === 'evening')) quiet(beforeRaid);

// The raid won, then the afternoon before the band names him at the fire.
const beforeNickname = startGame();
while (!beforeNickname.duel) quiet(beforeNickname);
handleInput(beforeNickname, 'attack');
for (let g = 0; beforeNickname.duel && g < 10; g++) handleInput(beforeNickname, 'feint');
while (!(today(beforeNickname) === 39 && beforeNickname.date.part === 'afternoon')) quiet(beforeNickname);

console.log(JSON.stringify({ beforeRaid: toSave(beforeRaid), beforeNickname: toSave(beforeNickname) }));
