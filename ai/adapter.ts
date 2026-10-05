// One interface for every AI source (Game Experience ch. 7): the claude.ai page (the player's own Claude account),
// own key / local AI later, or none. The engine never sees this; only the web and chat layers do.

export type ModelTier = 'quick' | 'default' | 'complex';

export interface AskOptions { json?: boolean; tier?: ModelTier; signal?: AbortSignal }

export interface AiAdapter {
  name: string;
  ask(prompt: string, opts?: AskOptions): Promise<string>;
}

/** Errors that mean "this player cannot use AI here": switch to the no-AI mode for the rest of the visit. */
export const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired']);

export function errorCode(e: unknown): string {
  return typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'upstream_error';
}
