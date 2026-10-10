// AI players (owner request, Oct 10): free models from OmniRoute (or any OpenAI-compatible server) play the game,
// each its own life, and write what happened plus their own review to saves/ai-players/<model>.md.
//   npm run ai-players                      2 models, 60 turns each
//   TURNS=150 AI_MODELS=a,b npm run ai-players
// Settings in .env (never committed): OMNIROUTE_URL (default http://localhost:20128/v1), OMNIROUTE_KEY, AI_MODELS.
// Without AI_MODELS it picks two models from the server's list, free ones first.
import { mkdirSync, writeFileSync } from 'node:fs';
import { li } from '../engine/engine';
import { handleInput, newGame } from '../engine/game';
import { optionsText, shortDashboard } from '../engine/render';

try { process.loadEnvFile?.('.env'); } catch { /* no .env: defaults */ }
const URL = (process.env.OMNIROUTE_URL ?? 'http://localhost:20128/v1').replace(/\/$/, '');
const KEY = process.env.OMNIROUTE_KEY ?? '';
const TURNS = Number(process.env.TURNS ?? 60);
const headers = { 'content-type': 'application/json', ...(KEY ? { authorization: `Bearer ${KEY}` } : {}) };

const RULES = `You are playing "Sengoku Soldier", a text simulation. You are Li, a 12-year-old slave in a mercenary band.
Your long goal: survive, grow strong, and become free (buy your freedom or escape), then rise as a soldier.
Each turn you see the situation and numbered options. Answer with ONE line only: an option number (e.g. 2), or a short
command in plain English (e.g. "talk hisame", "train sword", "skip 7", "buy freedom", "ask Sukezo about the price").
No explanations, just the line.`;

async function models(): Promise<string[]> {
  if (process.env.AI_MODELS) return process.env.AI_MODELS.split(',').map((m) => m.trim()).filter(Boolean);
  const r = await fetch(`${URL}/models`, { headers });
  if (!r.ok) throw new Error(`OmniRoute ${URL}/models answered ${r.status}. Is it running, and is OMNIROUTE_KEY in .env right?`);
  const ids: string[] = ((await r.json()).data ?? []).map((m: { id: string }) => m.id);
  const free = ids.filter((id) => /free/i.test(id));
  return [...free, ...ids.filter((id) => !free.includes(id))].slice(0, 2);
}

async function chat(model: string, messages: { role: string; content: string }[]): Promise<string> {
  for (let tryNo = 0; tryNo < 3; tryNo++) {
    const r = await fetch(`${URL}/chat/completions`, { method: 'POST', headers, body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 300 }) });
    if (r.ok) return ((await r.json()).choices?.[0]?.message?.content ?? '').trim();
    if (r.status !== 429 && r.status < 500) throw new Error(`${model}: ${r.status} ${(await r.text()).slice(0, 200)}`);
    await new Promise((d) => setTimeout(d, 5000 * (tryNo + 1)));
  }
  throw new Error(`${model}: server kept failing`);
}

async function play(model: string) {
  const g = newGame();
  const s = g.state;
  let screen = g.text;
  const log: string[] = [`# ${model} plays Sengoku Soldier\n`, '```', screen, '```'];
  const history: { role: string; content: string }[] = [];
  let same = 0; let last = '';
  for (let t = 1; t <= TURNS; t++) {
    history.push({ role: 'user', content: screen });
    const raw = await chat(model, [{ role: 'system', content: RULES }, ...history.slice(-12)]);
    const line = (raw.split('\n').find((l) => l.trim()) ?? '1').replace(/^["'`*\s]+|["'`*\s]+$/g, '').slice(0, 120);
    history.push({ role: 'assistant', content: line });
    const r = handleInput(s, line);
    screen = `${r.text}\n\n${shortDashboard(s)}\n\n${optionsText(s)}`;
    log.push(`\n**Turn ${t}: \`${line}\`**`, '```', r.text, shortDashboard(s), '```');
    same = r.text === last ? same + 1 : 0; last = r.text;
    if (same >= 4) { log.push('\n_Stopped: the same answer 5 times in a row (stuck)._'); break; }
    if (li(s).status === 'free') { log.push('\n_Li is free._'); break; }
    process.stdout.write(`${model} ${t}/${TURNS}\r`);
  }
  const review = await chat(model, [{ role: 'system', content: 'You just played a text game. Be honest and concrete.' },
    { role: 'user', content: `Here is how your game went (last part):\n${log.slice(-40).join('\n')}\n\nIn short bullet points: what was fun, what was boring or confusing, where you got stuck, and the 3 changes that would make it better.` }]).catch((e) => `(no review: ${e.message})`);
  log.push('\n## Review by the model\n', review);
  const file = `saves/ai-players/${model.replace(/[^\w.-]+/g, '_')}.md`;
  writeFileSync(file, log.join('\n'));
  console.log(`\n${model}: done → ${file}`);
}

mkdirSync('saves/ai-players', { recursive: true });
const list = await models();
console.log(`Players: ${list.join(', ')} · ${TURNS} turns each · server ${URL}`);
await Promise.all(list.map((m) => play(m).catch((e) => console.log(`\n${m} stopped: ${e.message}`))));
