// Quick balance look at the battle engine (Numbers §12: a normal battle without a rout costs each side under ~10%).
import { battleReport, createBattle, runPhase } from '../engine/battle';

function fight(label: string, ally: number[], enemy: number[], order: 'hold' | 'push' = 'hold') {
  const secs = ['left', 'center', 'right'] as const;
  let b = createBattle({
    id: 'sim', name: label, place: 'the plain', liSector: 'center', liMen: 100, liLeads: true, liInt: 20, liRank: 4,
    ally: ally.map((men, k) => ({ sector: secs[k], name: `Ally ${secs[k]}`, men })),
    enemy: enemy.map((men, k) => ({ sector: secs[k], name: `Enemy ${secs[k]}`, men })),
  });
  while (!b.over) b = runPhase(b, order).battle;
  console.log(`\n== ${label}: ${b.over.winner} after ${b.phase} phases (${b.over.reason})\n-- ours\n${battleReport(b, 'ally')}\n-- theirs\n${battleReport(b, 'enemy')}`);
}
fight('equal', [1000, 1000, 1000], [1000, 1000, 1000]);
fight('1.3 to 1', [1300, 1300, 1300], [1000, 1000, 1000]);
fight('2 to 1', [2000, 2000, 2000], [1000, 1000, 1000]);
fight('weak left', [500, 1200, 1200], [1100, 1000, 1000]);
