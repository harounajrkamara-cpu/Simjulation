import { AiAdapter } from '../ai/adapter';

// "Claude in the page" (Game Experience ch. 7): the published claude.ai page asks Claude with the player's own account
// through the `sample` capability. Anywhere else (local Vite page, a saved file) there is no window.claude: no-AI mode.

interface Sample {
  (input: string, opts?: Record<string, unknown>): Promise<{ text: string }>;
  json(input: string, opts?: Record<string, unknown>): Promise<unknown>;
}

export async function pageAdapter(): Promise<AiAdapter | null> {
  const claude = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (!claude?.use) return null;
  const sample = (await claude.use('sample')) as Sample | null;
  if (!sample) return null;
  return {
    name: 'Claude',
    async ask(prompt, o) {
      const opts = { modelTier: o?.tier ?? 'default', signal: o?.signal, cache: false };
      if (o?.json) return JSON.stringify(await sample.json(prompt, opts));
      return (await sample(prompt, opts)).text;
    },
  };
}
