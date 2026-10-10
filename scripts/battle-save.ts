// Writes a save with a battle in progress (for checking the battle panel in the browser).
import { writeFileSync } from 'node:fs';
import { commitDrafts, toSave } from '../engine/engine';
import { gmApply, parseGmTurn, startGmGame } from '../engine/gm';

const s = startGmGame();
commitDrafts(s, [
  { type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'Gochō (5) in Kurogane service' } },
  { type: 'flag', fact: 'rank', visible: false, data: { key: 'rank_level', value: 1 } },
]);
gmApply(s, parseGmTurn({ scene: 'The Suiren lines come across the ford at dawn.', summary: 'Battle at the ford.', changes: [{
  kind: 'battle', name: 'The ford at Kōri', place: 'the Kurose ford', sector: 'center',
  ally: [{ sector: 'left', name: 'Hagiwara spears', men: 2000 }, { sector: 'center', name: 'Ishizue guard', men: 2000, quality: 'veteran' }, { sector: 'right', name: 'Levy', men: 2000, quality: 'levy' }, { sector: 'reserve', name: 'Red Crane', men: 300, quality: 'veteran' }],
  enemy: [{ sector: 'left', name: 'Suiren left', men: 1600 }, { sector: 'center', name: 'Suiren center', men: 1800 }, { sector: 'right', name: 'Suiren riders', men: 1400, cavalry: 0.4 }],
}] })!);
writeFileSync(process.argv[2] ?? 'battle-save.json', JSON.stringify(toSave(s)));
