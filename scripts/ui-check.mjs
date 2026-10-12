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

const VIEWS = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'panel', width: 900, height: 1000 }, { name: 'phone', width: 390, height: 844 }];
const TABS = ['map', 'li', 'army', 'people', 'journal', 'encyclopedia'];
const problems = [];

/** A new life opens with the New life screen and the prologue (GE ch. 8): check them, then go into the game. */
async function passIntro(page, name, audit) {
  const nl = await page.waitForSelector('#newlife:not([hidden])', { timeout: 5000 }).catch(() => null);
  if (!nl) { problems.push(`${name}: no New life screen`); return; }
  if (audit) { await page.waitForTimeout(400); for (const p of await page.evaluate(audit)) problems.push(`${name} / new life: ${p}`); await page.screenshot({ path: `${out}/${name}-0-newlife.png` }); }
  await page.click('#begin');
  await page.waitForSelector('#prologue:not([hidden])', { timeout: 3000 }).catch(() => problems.push(`${name}: no prologue`));
  if (audit) {
    for (let i = 0; i < 5; i++) await page.click('#pr-next');
    await page.waitForTimeout(800);
    for (const p of await page.evaluate(audit)) problems.push(`${name} / prologue: ${p}`);
    await page.screenshot({ path: `${out}/${name}-0-prologue.png` });
  }
  await page.click('#pr-skip');
  // The chapter card follows the prologue (GE ch. 3b); a click ends it.
  if (await page.waitForSelector('#titlecard:not([hidden])', { timeout: 3000 }).catch(() => null)) {
    if (audit) { await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${name}-0-chapter.png` }); }
    if (await page.isVisible('#titlecard')) await page.click('#titlecard');
  } else problems.push(`${name}: no chapter card`);
}

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
    // A radio or checkbox inside a label is clicked through its label: measure that.
    const r = (el.matches('input[type=radio], input[type=checkbox]') && el.closest('label') || el).getBoundingClientRect();
    if (r.height < 44 || r.width < 44) found.push(`target ${Math.round(r.width)}×${Math.round(r.height)} < 44: "${(el.textContent || el.getAttribute('aria-label') || el.id).trim().slice(0, 30)}"`);
  }
  const emoji = document.body.innerText.replace(/⚠︎/g, '').match(/\p{Extended_Pictographic}/gu);
  if (emoji) found.push(`emoji in the interface: ${[...new Set(emoji)].join(' ')}`);
  if (document.documentElement.scrollWidth > innerWidth + 1) found.push(`horizontal page scroll: ${document.documentElement.scrollWidth} > ${innerWidth}`);
  // The story column scrolls as one: nothing inside it may have its own scroll area (owner, Oct 6).
  const panel = document.querySelector('#tab-story');
  if (panel && !panel.hidden) for (const el of panel.querySelectorAll('*')) {
    const st = getComputedStyle(el);
    if (/(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 1) found.push(`second scroll area inside the story: ${el.className || el.tagName}`);
  }
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
  await passIntro(page, v.name, audit);
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
  // The WAIT ends on the timeskip summary (checked at every size), then back to the story.
  if (await page.waitForSelector('#skipbox:not([hidden])', { timeout: 5000 }).catch(() => null)) {
    await check('timeskip');
    await page.screenshot({ path: `${out}/${v.name}-2-timeskip.png` });
    await page.click('#sk-close');
  } else problems.push(`${v.name}: no timeskip summary after WAIT`);
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
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('sengoku-soldier-settings', JSON.stringify({ mode: 'classic', ai: 'claude', guide: 'full', ink: 'fast' })); });
  await page.reload();
  await passIntro(page, 'ai');
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

// Game Master mode (owner decision Oct 7) with a stand-in Claude: opening scene, a new person, a fight the code runs,
// and Claude telling what happens after it.
const FAKE_GM = () => {
  let n = 0;
  const scenes = [
    { title: 'Under Kōri fort', scene: 'The band reaches Kōri fort in a cold wind. A woman with a sake cart watches Li with sharp eyes.', summary: 'The band arrives; Tomoe the sake seller notices Li.', journal: 'We reached Kōri fort. A sake seller called Tomoe watched me.', days: 0, part: 'afternoon',
      changes: [{ kind: 'person', id: 'tomoe', name: 'Tomoe', role: 'sake seller', desc: 'A sharp-eyed woman with a sake cart.', goal: 'Sell sake to the band', secret: 'Spies for the steward' }, { kind: 'lore', title: 'Sake carts', text: 'Sellers who follow every army.' }, { kind: 'relation', npc: 'hachi', field: 'trust', delta: 3, reason: 'Li stayed close' }],
      suggestions: ['I ask Tomoe who she is', 'I help Hachi with the horses', 'I watch Raizen'] },
    { title: 'A drunk spearman', scene: 'A drunk spearman shoves Hachi into the mud and turns on Li, laughing.', summary: 'A drunk spearman picks a fight.', days: 0,
      fight: { foe: 'A drunk spearman', rank: 'F', look: 'swaying, a spear shaft', deadly: false }, suggestions: [] },
    { title: 'After the fight', scene: 'The spearman sits in the mud. Hachi stares at Li. Tomoe laughs and pours a cup for nobody.', summary: 'Li stood up to the spearman.', journal: 'I fought a drunk spearman for Hachi.', days: 2,
      changes: [{ kind: 'relation', npc: 'hachi', field: 'affection', delta: 5, reason: 'Stood up for me' }], suggestions: ['I thank Tomoe', 'I check on Hachi'] },
  ];
  const sample = async () => ({ text: 'unused' });
  sample.json = async (prompt) => { if (!prompt.includes('You are the Game Master')) return { choice: 'none', confidence: 0 }; return scenes[Math.min(n++, scenes.length - 1)]; };
  window.claude = { use: async (name) => (name === 'sample' ? sample : null) };
};
for (const v of VIEWS.filter((x) => x.name !== 'panel')) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  page.on('pageerror', (e) => problems.push(`gm ${v.name}: page error: ${e.message}`));
  await page.addInitScript(FAKE_GM);
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('sengoku-soldier-settings', JSON.stringify({ mode: 'gm', ai: 'claude', guide: 'off', ink: 'instant' })); });
  await page.reload();
  await passIntro(page, `gm ${v.name}`);
  if (!(await page.waitForSelector('.turn .text:has-text("sake cart")', { timeout: 8000 }).catch(() => null))) { problems.push(`gm ${v.name}: no opening scene from the Game Master`); await page.close(); continue; }
  await page.waitForTimeout(600);
  if (!(await page.textContent('#opts')).includes('I ask Tomoe who she is')) problems.push(`gm ${v.name}: suggestions are not the options`);
  if (!(await page.textContent('.turn:last-child')).includes('New: Tomoe')) problems.push(`gm ${v.name}: new person not shown`);
  for (const p of await page.evaluate(audit)) problems.push(`gm ${v.name} / scene: ${p}`);
  await page.screenshot({ path: `${out}/gm-${v.name}-1-scene.png` });
  await page.fill('#in', 'I walk over to Hachi');
  await page.press('#in', 'Enter');
  if (await page.waitForSelector('#titlecard:not([hidden])', { timeout: 5000 }).catch(() => null)) { if (await page.isVisible('#titlecard')) await page.click('#titlecard'); }
  if (!(await page.waitForSelector('#duel:not([hidden]) .fighters', { timeout: 5000 }).catch(() => null))) problems.push(`gm ${v.name}: the fight did not start in the duel display`);
  else {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/gm-${v.name}-2-fight.png` });
    for (let g = 0; g < 12 && (await page.isVisible('#duel')); g++) { await page.click('.opt[data-key="3"]'); await page.waitForTimeout(150); }
    if (!(await page.waitForSelector('.turn .text:has-text("sits in the mud")', { timeout: 8000 }).catch(() => null))) problems.push(`gm ${v.name}: no scene after the fight`);
  }
  await page.click('[data-tab="people"]');
  if (!(await page.textContent('#tab-people')).includes('Tomoe')) problems.push(`gm ${v.name}: Tomoe missing in People`);
  await page.click('[data-tab="encyclopedia"]');
  if (!(await page.textContent('#tab-encyclopedia')).includes('Sake carts')) problems.push(`gm ${v.name}: lore missing in the Encyclopedia`);
  await page.click('[data-tab="story"]');
  await page.reload();
  await page.waitForSelector('.opt', { timeout: 5000 }).catch(() => null);
  if (!(await page.textContent('#log')).includes('sits in the mud')) problems.push(`gm ${v.name}: the last scene is not shown after reload`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/gm-${v.name}-3-after.png` });
  await page.close();
}

// Big moments (GE ch. 3b, V5): load saves made just before them, play one turn, and look.
{
  const { execFileSync } = await import('node:child_process');
  const fx = JSON.parse(execFileSync('npx', ['tsx', 'scripts/fixtures.ts'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`moments: page error: ${e.message}`));
  await page.goto(url);
  const load = async (save) => {
    await page.evaluate((s) => { localStorage.setItem('sengoku-soldier-save', JSON.stringify(s)); localStorage.setItem('sengoku-soldier-settings', JSON.stringify({ ai: 'plain', guide: 'off', ink: 'fast' })); }, save);
    await page.reload();
    await page.waitForSelector('.opt');
  };
  // The raid: a title card, then the duel display.
  await load(fx.beforeRaid);
  await page.click('.opt[data-key="1"]');
  if (!(await page.waitForSelector('#titlecard:not([hidden])', { timeout: 4000 }).catch(() => null))) problems.push('moments: no title card for the raid');
  else { await page.waitForTimeout(900); await page.screenshot({ path: `${out}/moment-raid-card.png` }); if (await page.isVisible('#titlecard')) await page.click('#titlecard'); }
  if (!(await page.waitForSelector('#duel:not([hidden]) .fighters', { timeout: 4000 }).catch(() => null))) problems.push('moments: no duel display');
  else { await page.waitForTimeout(700); for (const p of await page.evaluate(audit)) problems.push(`moments / duel: ${p}`); await page.screenshot({ path: `${out}/moment-duel.png` }); }
  // The nickname: the legend screen.
  await load(fx.beforeNickname);
  await page.click('.opt[data-key="1"]');
  if (!(await page.waitForSelector('#legend:not([hidden])', { timeout: 5000 }).catch(() => null))) problems.push('moments: no legend screen for the nickname');
  else {
    await page.waitForTimeout(1700);
    for (const p of await page.evaluate(audit)) problems.push(`moments / legend: ${p}`);
    await page.screenshot({ path: `${out}/moment-legend.png` });
    await page.click('#lg-close');
    if (!(await page.textContent('#side-li')).includes('Kurose no Ryū')) problems.push('moments: nickname not on the Li card');
  }
  // Phase 2 row: a WAIT ends on the timeskip summary; the Journal is grouped by season; three lives in Save file.
  await load(fx.early);
  await page.fill('#in', 'wait 7');
  await page.press('#in', 'Enter');
  if (!(await page.waitForSelector('#skipbox:not([hidden])', { timeout: 5000 }).catch(() => null))) problems.push('moments: no timeskip summary after WAIT');
  else {
    await page.waitForTimeout(700);
    if (!(await page.textContent('#sk-body')).includes('Li worked')) problems.push('moments: timeskip summary misses the routine');
    for (const p of await page.evaluate(audit)) problems.push(`moments / timeskip: ${p}`);
    await page.screenshot({ path: `${out}/moment-timeskip.png` });
    await page.click('#sk-close');
  }
  if ((await page.textContent('.turn:last-child')).includes('== TIMESKIP')) problems.push('moments: summary text repeated in the story');
  await page.click('[data-tab="journal"]');
  if (!(await page.textContent('#tab-journal')).includes('Year 100 · Spring')) problems.push('moments: journal not grouped by season');
  await page.click('[data-tab="story"]');
  await page.click('#savebtn');
  if ((await page.$$('.slot')).length !== 3) problems.push('moments: not three lives in Save file');
  else {
    for (const p of await page.evaluate(audit)) problems.push(`moments / slots: ${p}`);
    await page.screenshot({ path: `${out}/moment-slots.png` });
    await page.click('.slot[data-slot="2"]');
    if (!(await page.waitForSelector('#newlife:not([hidden])', { timeout: 4000 }).catch(() => null))) problems.push('moments: an empty slot did not begin a new life');
    await page.evaluate(() => { localStorage.removeItem('sengoku-soldier-save-2'); localStorage.setItem('sengoku-soldier-slot', '1'); });
  }
  // Phase 2: an officer at the ford — a title card, then the choice to go for him.
  await load(fx.beforeFord);
  await page.click('.opt[data-key="1"]');
  if (await page.waitForSelector('#titlecard:not([hidden])', { timeout: 4000 }).catch(() => null)) { await page.waitForTimeout(900); await page.screenshot({ path: `${out}/moment-ford-card.png` }); if (await page.isVisible('#titlecard')) await page.click('#titlecard'); }
  else problems.push('moments: no title card for the officer raid');
  await page.waitForTimeout(500);
  if (!(await page.textContent('.opt[data-key="1"]')).includes('Go for the Gochō')) problems.push('moments: no choice to go for the officer');
  if (!(await page.textContent('#goals')).includes('officer')) problems.push('moments: the officer route is not in the Goals panel');
  for (const p of await page.evaluate(audit)) problems.push(`moments / ford: ${p}`);
  await page.screenshot({ path: `${out}/moment-ford.png` });
  // Phase 2: running for Tatara — the legend screen names who saw it.
  await load(fx.beforeEscape);
  if (!(await page.textContent('#goals')).includes('Run for Tatara')) problems.push('moments: the escape route is not in the Goals panel');
  await page.click('.opt:has-text("Run for Tatara")');
  if (!(await page.waitForSelector('#legend:not([hidden])', { timeout: 5000 }).catch(() => null))) problems.push('moments: no legend screen for the escape');
  else {
    await page.waitForTimeout(1700);
    if (!(await page.textContent('#lg-meta')).includes('Seen by')) problems.push('moments: escape legend lists the band as witnesses');
    for (const p of await page.evaluate(audit)) problems.push(`moments / escape: ${p}`);
    await page.screenshot({ path: `${out}/moment-escape.png` });
    await page.click('#lg-close');
    if (!(await page.textContent('#goals')).includes('hunted')) problems.push('moments: Goals do not say Li is hunted');
  }
  await page.close();
}

// A save from an older game version must not break the page: a new life starts instead.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`old save: page error: ${e.message}`));
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('sengoku-soldier-save', JSON.stringify({ game: 'sengoku-soldier', saveVersion: 1, dataVersion: 1, worldNumber: 1, hash: 'x', events: [] })));
  await page.reload();
  await passIntro(page, 'old save');
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
