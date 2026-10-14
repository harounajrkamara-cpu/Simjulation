import { AiAdapter } from '../ai/adapter';

// "Claude in the page" (Game Experience ch. 7): the published claude.ai page asks Claude with the player's own account
// through the `sample` capability. Anywhere else (local Vite page, a saved file) there is no window.claude: no-AI mode.

interface Sample {
  (input: string, opts?: Record<string, unknown>): Promise<{ text: string }>;
  json(input: string, opts?: Record<string, unknown>): Promise<unknown>;
}

export async function pageAdapter(): Promise<AiAdapter | null> {
  // 1. Claude on claude.ai (the player's own account)
  const claude = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (claude?.use) {
    const sample = (await claude.use('sample')) as Sample | null;
    if (sample) {
      return {
        name: 'Claude',
        async ask(prompt, o) {
          const opts = { modelTier: o?.tier ?? 'default', signal: o?.signal, cache: false };
          if (o?.json) return JSON.stringify(await sample.json(prompt, opts));
          return (await sample(prompt, opts)).text;
        },
      };
    }
  }
  // 2. Local GM proxy (for local dev / GM mode without claude.ai)
  //    Set in browser console: localStorage.setItem('settings', JSON.stringify({mode:'gm',ai:'local'}))
  const settings = localStorage.getItem('settings');
  if (settings) {
    const s = JSON.parse(settings);
    if (s.ai === 'local' || s.ai === 'proxy') {
      try {
        const health = await fetch('http://localhost:20129/health', { signal: AbortSignal.timeout(1000) });
        if (health.ok) {
          return {
            name: 'Local Model Router',
            async ask(prompt, o) {
              const body: Record<string, unknown> = {
                model: o?.tier ?? 'default',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
              };
              if (o?.json) body.response_format = { type: 'json_object' };
              const res = await fetch('http://localhost:20129/chat/completions', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(body),
                signal: o?.signal,
              });
              if (!res.ok) throw Object.assign(new Error(`Proxy ${res.status}`), { code: 'upstream_error' });
              const data = await res.json();
              const text = data.choices?.[0]?.message?.content ?? '';
              return o?.json ? text : text;
            },
          };
        }
      } catch { /* proxy not running: fall through to null */ }
    }
  }
  // 3. No AI available
  return null;
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
