// Local model router: tries multiple providers, auto-falls back on error.
// Model ranking (best → fallback): Claude > Gemini Pro > DeepSeek > Ollama > OmniRoute.
// Config via .env (never commit keys): ANTHROPIC_API_KEY, GOOGLE_API_KEY,
// DEEPSEEK_API_KEY, OPENAI_API_KEY, OLLAMA_URL, OMNIROUTE_URL, OMNIROUTE_KEY.

import type { AiAdapter } from './adapter';

type AskFn = (prompt: string, opts?: unknown) => Promise<string>;
type ProviderEntry = { name: string; envKey: string; ask: AskFn };

// ── Anthropic (Claude) ───────────────────────────────────────────
const anthropic: ProviderEntry = {
  name: 'claude',
  envKey: 'ANTHROPIC_API_KEY',
  ask: async (prompt, _opts) => {
    const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-7-sonnet-20250219';
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 8192, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) {
      const code = resp.status === 401 ? 'auth_error' : resp.status === 429 ? 'rate_limit' : resp.status === 400 ? 'invalid_request' : 'upstream_error';
      throw Object.assign(new Error(`Claude API ${resp.status}: ${resp.statusText}`), { code });
    }
    const data = await resp.json();
    return data.content[0]?.text ?? '';
  },
};

// ── Google (Gemini Pro) ──────────────────────────────────────────
const google: ProviderEntry = {
  name: 'gemini',
  envKey: 'GOOGLE_API_KEY',
  ask: async (prompt, _opts) => {
    const model = process.env.GOOGLE_MODEL ?? 'gemini-2.5-pro-preview-0602';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    });
    if (!resp.ok) {
      const code = resp.status === 401 ? 'auth_error' : resp.status === 429 ? 'rate_limit' : 'upstream_error';
      throw Object.assign(new Error(`Gemini API ${resp.status}: ${resp.statusText}`), { code });
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  },
};

// ── DeepSeek ─────────────────────────────────────────────────────
const deepseek: ProviderEntry = {
  name: 'deepseek',
  envKey: 'DEEPSEEK_API_KEY',
  ask: async (prompt, _opts) => {
    const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) {
      const code = resp.status === 401 ? 'auth_error' : resp.status === 429 ? 'rate_limit' : 'upstream_error';
      throw Object.assign(new Error(`DeepSeek API ${resp.status}: ${resp.statusText}`), { code });
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  },
};

// ── OpenAI-compatible (OmniRoute, etc.) ──────────────────────────
const openaiCompat: ProviderEntry = {
  name: 'openai-compat',
  envKey: 'OMNIROUTE_KEY',
  ask: async (prompt, _opts) => {
    const base = (process.env.OMNIROUTE_URL ?? 'http://localhost:20128/v1').replace(/\/$/, '');
    const model = process.env.OPENAI_MODEL ?? process.env.OMNIROUTE_MODEL ?? 'gpt-4o-mini';
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.OMNIROUTE_KEY) headers.authorization = `Bearer ${process.env.OMNIROUTE_KEY}`;
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) {
      const code = resp.status === 401 ? 'auth_error' : resp.status === 429 ? 'rate_limit' : 'upstream_error';
      throw Object.assign(new Error(`OpenAI-compat API ${resp.status}: ${resp.statusText}`), { code });
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  },
};

// ── Local Ollama ─────────────────────────────────────────────────
const ollama: ProviderEntry = {
  name: 'ollama',
  envKey: 'OLLAMA_URL',
  ask: async (prompt, _opts) => {
    const base = (process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:3b';
    const resp = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!resp.ok) throw Object.assign(new Error(`Ollama ${resp.status}: ${resp.statusText}`), { code: 'upstream_error' });
    const data = await resp.json();
    return data.response ?? '';
  },
};

// Provider priority (best → fallback). Only includes providers with env keys set.
const PROVIDERS: ProviderEntry[] = [anthropic, google, deepseek, openaiCompat, ollama];

export function createLocalAdapter(): AiAdapter {
  const active = PROVIDERS.filter((p) => {
    if (p === ollama) return !!process.env.OLLAMA_URL;
    return !!process.env[p.envKey];
  });

  if (active.length === 0) {
    throw Object.assign(new Error('No model providers configured. Set ANTHROPIC_API_KEY, GOOGLE_API_KEY, DEEPSEEK_API_KEY, OMNIROUTE_KEY, or OLLAMA_URL in .env'), { code: 'not_configured' });
  }

  const names = active.map((p) => p.name);
  console.error(`[ModelRouter] active providers: ${names.join(' → ')}`);

  return {
    name: `ModelRouter[${names.join('→')}]`,
    async ask(prompt: string, opts?: unknown): Promise<string> {
      const attempted: string[] = [];
      for (const provider of active) {
        try {
          console.error(`[ModelRouter] trying ${provider.name}…`);
          const result = await provider.ask(prompt, opts);
          console.error(`[ModelRouter] ✓ ${provider.name} succeeded`);
          return result;
        } catch (e) {
          const code = (e as { code?: string })?.code ?? 'unknown';
          attempted.push(`${provider.name}:${code}`);
          console.error(`[ModelRouter] ✗ ${provider.name} failed (${code}), trying next…`);
        }
      }
      throw Object.assign(new Error(`All models exhausted (${attempted.join(', ')})`), { code: 'all_models_failed' });
    },
  };
}

export function isLocalAdapterAvailable(): boolean {
  return PROVIDERS.some((p) => p === ollama ? !!process.env.OLLAMA_URL : !!process.env[p.envKey]);
}
