// UI check (Master Build Prompt, "verify with evidence"): plays a few turns in a real browser at 1440 px and 390 px,
// saves screenshots, and checks contrast (≥ 4.5:1, 3:1 for large text), click targets (≥ 44 px), no emoji,
// no horizontal page scroll and no console errors.
// Usage: start the page (npm run web), then: npm run ui:check [-- http://127.0.0.1:5173/]
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const out = process.env.UI_OUT ?? 'docs/screens/latest';
mkdirSync(out, { recursive: true });
const local = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find(existsSync);
const browser = await chromium.launch(process.env.CHROMIUM_PATH || local ? { executablePath: process.env.CHROMIUM_PATH || local } : {});

const VIEWS = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }];
const TABS = ['map', 'li', 'army', 'people', 'journal', 'encyclopedia'];
const problems = [];

/** Runs in the page: returns contrast, target, emoji and overflow problems for what is visible now. */
function audit() {
  const lum = (c) => {
    const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const alpha = (c) => { const m = c.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (alpha(b) > 0.5) return b; }
    return 'rgb(14,16,20)';
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.9; };
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!el || seen.has(el) || !walker.currentNode.textContent.trim() || !visible(el) || el.closest('svg, .sr, .old')) continue;
    seen.add(el);
    const s = getComputedStyle(el);
    const l1 = lum(s.color), l2 = lum(bgOf(el));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(s.fontSize);
    const need = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5;
    if (ratio < need) found.push(`contrast ${ratio.toFixed(2)} < ${need}: "${el.textContent.trim().slice(0, 40)}"`);
  }
  for (const el of document.querySelectorAll('button, a[href], input, textarea, [role="tab"]')) {
    if (!visible(el) || el.closest('.sr')) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 44 || r.width < 44) found.push(`target ${Math.round(r.width)}×${Math.round(r.height)} < 44: "${(el.textContent || el.getAttribute('aria-label') || el.id).trim().slice(0, 30)}"`);
  }
  const emoji = document.body.innerText.replace(/⚠︎/g, '').match(/\p{Extended_Pictographic}/gu);
  if (emoji) found.push(`emoji in the interface: ${[...new Set(emoji)].join(' ')}`);
  if (document.documentElement.scrollWidth > innerWidth + 1) found.push(`horizontal page scroll: ${document.documentElement.scrollWidth} > ${innerWidth}`);
  return found;
}

for (const v of VIEWS) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  // Network failures count only for the game's own files (external fonts may be blocked in a sandbox).
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problems.push(`${v.name}: console error: ${m.text()}`); });
  page.on('response', (r) => { if (r.url().startsWith(new URL(url).origin) && r.status() >= 400) problems.push(`${v.name}: ${r.status()} for ${r.url()}`); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(new URL(url).origin)) problems.push(`${v.name}: request failed: ${r.url()}`); });
  page.on('pageerror', (e) => problems.push(`${v.name}: page error: ${e.message}`));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.opt');
  // Let the ink fade-in finish before measuring or taking a picture.
  const check = async (label) => { await page.waitForTimeout(700); for (const p of await page.evaluate(audit)) problems.push(`${v.name} / ${label}: ${p}`); };
  await check('start');
  await page.screenshot({ path: `${out}/${v.name}-1-start.png` });
  await page.click('.opt[data-key="2"]');
  await page.fill('#in', 'I talk to Sukezō');
  await page.press('#in', 'Enter');
  await page.click('.opt[data-key="1"]');
  await page.fill('#in', 'wait 4');
  await page.press('#in', 'Enter');
  await check('after turns');
  await page.screenshot({ path: `${out}/${v.name}-2-turns.png` });
  for (const t of TABS) {
    await page.click(`[data-tab="${t}"]`);
    await check(`tab ${t}`);
    await page.screenshot({ path: `${out}/${v.name}-tab-${t}.png`, fullPage: false });
  }
  await page.close();
}
// The AI path with a fake Claude in the page (the real one only exists on claude.ai): interpret → confirm → engine → narrate.
const FAKE_CLAUDE = () => {
  const words = (t) => (t.toLowerCase().match(/[a-zō]{4,}/g) ?? []);
  const sample = async (prompt) => {
    const facts = (prompt.match(/<facts>\n([\s\S]*?)\n<\/facts>/) ?? [])[1] ?? '';
    const text = facts.split('\n').map((l) => l.replace(/^\d+\.\s*/, '')).join('\n\n');
    return { text: `The camp breathes smoke and cold air.\n\n${text}` };
  };
  sample.json = async (prompt) => {
    const said = (prompt.match(/<player_text>\n([\s\S]*?)\n<\/player_text>/) ?? [])[1] ?? '';
    const choices = [...prompt.matchAll(/^- (\S+): (.*)$/gm)].map((m) => ({ id: m[1], label: m[2] }));
    const best = choices.map((c) => ({ c, score: words(c.label).filter((w) => words(said).includes(w)).length })).sort((a, b) => b.score - a.score)[0];
    return best && best.score > 0 ? { choice: best.c.id, confidence: 0.9, question: null, tone: 'neutral', says: null } : { choice: 'none', confidence: 0.2, question: null };
  };
  window.claude = { use: async (name) => (name === 'sample' ? sample : null) };
};
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`ai: page error: ${e.message}`));
  await page.addInitScript(FAKE_CLAUDE);
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('#storyteller[aria-pressed="true"]', { timeout: 5000 }).catch(() => problems.push('ai: storyteller did not switch to Claude'));
  await page.fill('#in', 'I help Old Sukezō with the cooking and the wounded');
  await page.press('#in', 'Enter');
  await page.waitForSelector('.turn:last-child .rewrite', { timeout: 8000 }).catch(() => problems.push('ai: free text was not narrated'));
  const story = await page.textContent('.turn:last-child');
  if (!story.includes('The camp breathes smoke') || !story.includes('Sukezō')) problems.push(`ai: narration missing: ${story.slice(0, 120)}`);
  await page.fill('#in', 'I watch Raizen train the men at the drill ground');
  await page.press('#in', 'Enter');
  if (!(await page.waitForSelector('.confirm .yes', { timeout: 5000 }).catch(() => null))) problems.push('ai: no confirmation before a risky action');
  else {
    await page.waitForTimeout(700);
    for (const p of await page.evaluate(audit)) problems.push(`ai / confirm: ${p}`);
    await page.screenshot({ path: `${out}/desktop-3-confirm.png` });
    await page.click('.confirm .yes');
    await page.waitForSelector('.turn:last-child .rewrite', { timeout: 8000 }).catch(() => problems.push('ai: confirmed action did not resolve and narrate'));
  }
  await page.fill('#in', 'I fly to the moon');
  await page.press('#in', 'Enter');
  await page.waitForTimeout(800);
  if (!(await page.textContent('.turn:last-child')).includes('not something Li can do')) problems.push('ai: impossible action was not refused');
  await page.waitForTimeout(700);
  for (const p of await page.evaluate(audit)) problems.push(`ai / after: ${p}`);
  await page.screenshot({ path: `${out}/desktop-4-ai.png` });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sengoku-soldier-save')).events.filter((e) => e.type === 'narration' || e.type === 'intent').length);
  if (saved < 3) problems.push(`ai: intents and narrations not stored in the save (${saved})`);
  await page.close();
}

// A save from an older game version must not break the page: a new life starts instead.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`old save: page error: ${e.message}`));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('sengoku-soldier-save', JSON.stringify({ game: 'sengoku-soldier', saveVersion: 1, dataVersion: 1, worldNumber: 1, hash: 'x', events: [] })));
  await page.reload();
  if (!(await page.waitForSelector('.opt', { timeout: 5000 }).catch(() => null))) problems.push('old save: no new game started');
  else if (!(await page.textContent('#log')).includes('A new life begins')) problems.push('old save: no note about the old save');
  await page.close();
}
await browser.close();

if (problems.length) {
  console.log(`UI check: ${problems.length} problem(s)`);
  for (const p of [...new Set(problems)]) console.log(' - ' + p);
  process.exit(1);
}
console.log(`UI check passed (${VIEWS.map((v) => `${v.width}px`).join(', ')}; ${TABS.length + 2} screens each). Screenshots in ${out}/`);
