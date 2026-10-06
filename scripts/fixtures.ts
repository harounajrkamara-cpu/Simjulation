// Saves just before big moments, for the UI check (npm run ui:check). Prints JSON to stdout.
import { ESCAPE_NEEDS } from '../engine/campaign';
import { gonzaPatrols, li, options, startGame, takeAction, toSave, today } from '../engine/engine';
import { opinion } from '../engine/relations';
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

// In the levy, the night before the Gochō's raid (Year 100, Month 6, Day 22).
const beforeFord = startGame();
while (!(today(beforeFord) === 90 && beforeFord.date.part === 'morning')) { if (beforeFord.duel) handleInput(beforeFord, 'counter'); else quiet(beforeFord); }
handleInput(beforeFord, '1');
while (!(today(beforeFord) === 170 && beforeFord.date.part === 'night')) { if (beforeFord.duel) handleInput(beforeFord, 'counter'); else quiet(beforeFord); }

// A boy who studies with Sukezō and trains at night until he can run: the first good night, before he goes.
const beforeEscape = startGame();
for (let g = 0; g < 40000; g++) {
  const s = beforeEscape;
  const c = li(s);
  const ready = (c.skills.stealth ?? 0) >= ESCAPE_NEEDS.stealth && (c.skills.endurance ?? 0) >= ESCAPE_NEEDS.endurance;
  if (s.date.part === 'night' && ready && options(s).some((o) => o.action.kind === 'escape') && c.fatigue <= 1 && !gonzaPatrols(s)) break;
  const choice = options(s).find((o) => o.action.kind === 'choose');
  if (choice) { handleInput(s, options(s).find((o) => /Stay with|Look away|Walk past/.test(o.label))?.key ?? choice.key); continue; }
  if (s.duel) { handleInput(s, 'counter'); continue; }
  if (s.date.part === 'evening') {
    const sk = s.relations.sukezo;
    const talkFirst = !s.flags.lessons_open || (!s.knowledge.includes('papers_in_iron_box') && (s.flags.lessons ?? 0) >= 10 && opinion(sk, today(s)) >= 40);
    takeAction(s, talkFirst && sk.lastTalkDay !== today(s) ? { kind: 'talk', target: 'sukezo' } : { kind: 'lesson' });
  } else if (s.date.part === 'night') takeAction(s, !ready && c.fatigue < 2 && c.wound < 2 && !gonzaPatrols(s) ? { kind: 'train', target: 'two_swords' } : { kind: 'sleep' });
  else takeAction(s, { kind: 'chores' });
}

console.log(JSON.stringify({ beforeRaid: toSave(beforeRaid), beforeNickname: toSave(beforeNickname), beforeFord: toSave(beforeFord), beforeEscape: toSave(beforeEscape) }));
