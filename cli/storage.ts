import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fromSave, toSave } from '../engine/engine';
import { GameState } from '../engine/types';

// Saves are the event log (World Bible ch. 11). The same file works in the terminal, chat mode and browser.

export function saveTo(path: string, s: GameState): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(toSave(s)));
}

export function loadFrom(path: string): GameState | undefined {
  if (!existsSync(path)) return undefined;
  return fromSave(JSON.parse(readFileSync(path, 'utf8')));
}
