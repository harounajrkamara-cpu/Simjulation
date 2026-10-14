#!/usr/bin/env npx tsx
/**
 * Local GM Proxy Server
 * Serves an OpenAI-compatible API endpoint that the Sengoku Soldier browser game
 * can use for Game Master mode. Routes requests to the best available LLM model
 * with automatic fallback.
 *
 * Model priority (best → fallback):
 *   1. Claude (Anthropic)           — ANTHROPIC_API_KEY
 *   2. Gemini Pro (Google)          — GOOGLE_API_KEY
 *   3. DeepSeek                     — DEEPSEEK_API_KEY
 *   4. OpenAI-compatible (OmniRoute) — OMNIROUTE_URL + OMNIROUTE_KEY
 *   5. Ollama local                 — OLLAMA_URL
 *
 * Setup:
 *   1. Copy .env.example to .env
 *   2. Fill in at least one API key
 *   3. Run: npm run gm-proxy
 *   4. Open http://localhost:5173 in your browser
 *   5. In browser console: localStorage.setItem('settings', JSON.stringify({mode:'gm',ai:'local'}))
 *   6. Refresh the page — GM mode is now active!
 *
 * The browser page checks for a local proxy at http://localhost:20129
 * when window.claude is not available.
 */
import { createServer } from 'node:http';
import { createLocalAdapter } from '../ai/local-model-router';

const PORT = 20129;
const adapter = createLocalAdapter();

const server = createServer(async (req, res) => {
  const body = req.method === 'POST' && req.url?.includes('chat/completions')
    ? await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
      })
    : null;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', model: adapter.name, providers: adapter.name }));
    return;
  }

  if (req.url?.includes('chat/completions')) {
    try {
      const payload = body ? JSON.parse(body as string) : {};
      const messages = payload.messages || [];
      const prompt = messages.map((m: { role: string; content: string }) => m.content).join('\n');
      const response = await adapter.ask(prompt);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        id: 'chatcmpl-local',
        object: 'chat.completion',
        created: Date.now(),
        model: adapter.name,
        choices: [{ index: 0, message: { role: 'assistant', content: response } }],
      }));
    } catch (e) {
      const err = e as Error & { code?: string };
      res.writeHead(err.code === 'not_configured' ? 503 : 500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: err.message, code: err.code } }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.error(`[GM Proxy] running on http://localhost:${PORT}`);
  console.error(`[GM Proxy] ${adapter.name}`);
  console.error('[GM Proxy] Open http://localhost:5173, then in console:');
  console.error(`  localStorage.setItem('settings', JSON.stringify({mode:'gm',ai:'local'}))`);
  console.error('[GM Proxy] Refresh the page to activate GM mode.');
});
