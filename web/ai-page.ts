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

/**
 * Offer a file to the player: on claude.ai through the `downloads` capability (the viewer confirms), elsewhere with a
 * plain browser download. Resolves with a short word for the button, or rejects with the reason.
 */
export async function pageDownload(filename: string, data: string): Promise<string> {
  const claude = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  const d = claude?.use ? ((await claude.use('downloads')) as { save(o: { filename: string; data: string }): Promise<unknown> } | null) : null;
  if (d) {
    try { await d.save({ filename, data }); return 'Saved'; }
    catch (e) { const code = (e as { code?: string })?.code; if (code === 'declined') return 'Not saved'; throw e; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return 'Downloaded';
}
