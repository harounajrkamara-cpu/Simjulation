# Audit: canon vs code (Oct 17)

The owner asked: what is built, what still has to be built from everything we agreed, and which tools can help.
Method: every chapter of the World Bible, the Atlas, the Numbers Sheet, the Game Experience Bible and FILMS compared with the code (grep + reading), plus the open wishes in STATUS and BUILD_PLAN. Read-only: no game code changed.

**Honest correction:** on Oct 17 I said "all stages built". That was true for the *road* (slave → freedom → ranks → land → family → court → epilogue runs in code), but large parts of the *world* in the canon exist only as text Claude reads, not as things the code tracks. The biggest one is the houses.

Legend: ✅ built · 🟡 partly (text for Claude, or a rule with no effect) · ❌ missing.

---

## Built (works in code, tested)
Duels (attack/counter/feint/observe, simulate) · battles with the Numbers §5 report · merit (combat, command), promotion with weights, vacancy, sponsor, social barrier · ceremonies and titles · freedom by merit, by Raizen, by buying, by escape · land, harvest, land duty · marriage and children · Li at court (factions of all 7 kingdoms) · faction discontent and ultimatums · reputation per group · fuses (8) and story seeds · threat clocks, pacing director, drama layer, Li's plan, sparks · epilogue · chapter recaps · films (7 + milestones), George narrator · maps (world, battle, close-up) · tooltips · saves (3 slots + cloud), Something's wrong · the fact check (no win/death/escape unless the code decided it).

---

## Gaps, most important for play first

### A. Felt in the first hours (soldier years)
| # | What the canon says | Code today | Status |
|---|---|---|---|
| 1 | **Houses as a living system** (WB ch. 2–3): each house has land, wealth, troops, prestige, loyalty to the Crown, cohesion, a head and heir, branches; marriages between houses, hostages, adoption, succession, gekokujō | Only Kurogane's 7 houses, as public text (`engine/atlas-public.ts`). Other kingdoms' Tier A houses (Atlas §3.2–3.7: Shirasagi, Akabane, Kinugasa, Tōno, Okitsu, Kagami, Homura, Tobita, Kurokoma, Tagami, Isonokami, Hamazaki, Ōkura, Shiraiwa, Haguro, Sakaguchi, Kanemori, Hibiki, Garyū, Shiramine) are not in the game at all. No house numbers, no succession, no house-to-house marriage | ✅ Oct 17 |
| 2 | **The world's people are real people** (Atlas §3–5, §10): kings, generals, house heads and Li's generation (Akabane Hayame, Kagami Shion, Kirishima Ryūnosuke, Isonokami Nami, Shiraiwa Tōta, Shiramine Tsubasa, Tatara Kunimaru, "Ofuji") with stats, age, goals, and they grow | 11 people are records (Li's camp circle + Sayo, Kaname, Daisuke, Ishizue). Everyone else is a name in a text block or the checker's name list; they don't age, grow, fight or remember. Hayame/Tōta/Ryūnosuke exist only as seeds | ✅ Oct 17 |
| 3 | **Soldier pay** (WB ch. 7, Numbers §7) | `rankIncome`/`checkPay` exist in `career.ts` but nothing calls them: a free soldier earns no pay | ✅ Oct 17 |
| 4 | **Loyalty, obedience, betrayal, promises** (Numbers §8) | `loyalty()` exists but is never used; obedience, the betrayal rule, promises as tracked objects (+10 / −25, trust scar) and Li's dread are missing. Fading over time exists | ✅ Oct 17 |
| 5 | **Abilities and the Zone** (WB ch. 5, VISIE) | The Zone is only a knowledge flag; it changes nothing in a duel. No ability records, no Twin Demon Dance, no style unlock choice at mastery 30/50/70/100 (the panel only shows "unlock at") | ✅ Oct 17 |
| 6 | **Permanent injury** (Numbers §4: Badly wounded from a gap above 100%) | not in `duel.ts` | ✅ Oct 17 |

### B. Officer and general years
| # | What the canon says | Code today | Status |
|---|---|---|---|
| 7 | Command capacity and **overload** in battle (Numbers §3, delegation) | only the label in `rules.ts`; battles ignore it | ✅ Oct 17 |
| 8 | **Life and death of NPCs**: lifespan, death of age, heirs take over (WB 13c rule 4), genpuku | missing (only the Tatara king's fuse) | ✅ Oct 17 |
| 9 | **Defeat ladder**: rank loss, capture, ransom | missing (battles count captured men, Li is never captured) | ❌ |
| 10 | Kingdom values beyond authority: treasury, unity, succession, the Crown's share | only authority + dread (`discontent.ts`) | 🟡 |
| 11 | **Laws per kingdom** (Atlas §12): slavery, duels, debt slavery, Tatara as refuge | only Kurogane's merit law and the Tatara runaway road | 🟡 |
| 12 | **Neutral powers**: Mount Shōgen (Abbot Kakushin, the Mirror), Mist Valley shinobi ("Grey Crow"), Kinza (mercenary market, loans, Speaker Ganzō), the Single Path sect, Seiran Academy (Master Hakuun) | names in public text or seeds only; no hiring, loans, exams or uprisings | ❌ |
| 13 | Trade and needs (Atlas §8): salt, grain, horses, embargoes; weather and hidden causes | missing | ❌ |
| 14 | Festivals, Imperial treasures as objects, governors | missing (treasures are text) | ❌ |

### C. Engine rules and polish
| # | What | Status |
|---|---|---|
| 15 | Name registry enforced for people Claude invents (Atlas §15) | ❌ |
| 16 | "Previously on…" when a session starts (recaps exist, shown only when a chapter closes) | 🟡 |
| 17 | Phone layout; George on the claude.ai page; a Playwright run of the screens | 🟡 not proven |
| 18 | **The real Claude on claude.ai has never played a long game** — only my offline playthrough | 🟡 not proven |

### D. Second pass (Game Experience Bible, VISIE, the live page)
| # | What the canon says | Code today | Status |
|---|---|---|---|
| 19 | **Aura** (WB ch. 5, VISIE §4): a general's aura acts on morale and on the opponent's choices | not in the code anywhere | ✅ Oct 17 |
| 20 | **Ceremony screen** (GE ch. 3/3b): who stands where, every witness reacts by their own opinion and remembers it | ceremonies happen, but only as story text; no screen, no witness reactions | 🟡 |
| 21 | **Legend page** in the Journal (GE 3b step 6): date, witnesses, title, kept forever | legend moments show once as an overlay, then are gone | ❌ |
| 22 | **Nicknames per group** (GE 3b): soldiers, nobles and enemies may call Li different names, earned from deeds | one hand-written nickname (classic) and a GM title; not per group | 🟡 |
| 23 | **Lies caught by a rule** (GE ch. 5): the NPC's INT vs Li's POL and what they know | Claude decides alone; no rule | ❌ |
| 24 | **Li's own unit name and banner** (GE 3b legend list, like Shin's Hi Shin unit) | missing | ❌ |
| 25 | **Feasts, funerals, oaths** as ceremonies (GE 3b) | missing (funeral only in the epilogue text) | ❌ |
| 26 | **Title screen** with Continue / New life / Load (GE ch. 3) | the page opens straight into the game or the New life box | 🟡 |
| 27 | A death needs a `by` field (who killed, from the code's record) — known gap from STATUS Oct 13 | missing | ❌ |
| 28 | George narrator bundled, not loaded from jsdelivr (STATUS security note) | still loaded at runtime | 🟡 |

### E. Third pass (every owner message in all 74 sessions, the proposals, NIGHT_LOG, the Notion briefing)
| # | Where it was said | What | Status |
|---|---|---|---|
| 29 | Numbers §11, Free World proposal | **Real fuse decision trees** (who acts, scored choices, visible signs). Today each fuse fires on a fixed day with weights (PROVISIONAL) | 🟡 |
| 30 | NIGHT_LOG Oct 16, WB ch. 8 | **Rumours about Li** spreading in Game Master mode (rumours exist only in the classic chronicle) | ❌ |
| 31 | PROPOSAL_PACING | The code opens obvious **threat clocks** itself (a rival who threatened Li); today only after a deadly win | 🟡 |
| 32 | SENGOKU_SOLDIER_COMPLETE (owner's plan) | Other storytellers on the page (Gemini, DeepSeek, Ollama, OmniRoute); today only Claude or plain | ❌ |
| 33 | Owner, Oct 9 | **Multiple worlds** later (more than this one land) | ❌ (later) |
| 34 | Owner, Oct 10/15 | **Phone play** (owner said: skip for now) | 🟡 parked |
| 35 | Owner, Oct 11 | Many AI testers playing the whole game (Hermes needs a provider set by the owner) | 🟡 tooling |

Checked and already done from the chats: option click fills the text box · Ask answers about the great houses · the slave's day explained (Li's life sheet) · boring routine plays itself (pacing) · fight tab: real fights in the duel engine, spars simulated, life-or-death asks you · Li may serve any side (also Gōda) · news travels faster · Copilot's 4 + 7 rule holes fixed with tests · rewrites are fact-checked again.

**How sure am I?** Not 100%. Not read word for word: the original ChatGPT chats from Oct 8 (they were turned into the World Bible then) and the raw Gemini/Kimi/Copilot chats (only through the Notion briefing). Everything else was compared.

**Live page (Chrome, Oct 17, read-only, no game action):** all seven tabs open and render (Story, Map with Close up / Li's eyes / The world, Li with the plan cards, Army as the band from outside, People, Journal, Encyclopedia). **Local page (Playwright):** loads with 0 console errors.

---

## Tools that can help (checked Oct 17)
| Tool | Helps with | Verdict |
|---|---|---|
| **Playwright plugin** (installed in this app) | click through the real page and catch screen bugs (gap 17) | ✅ works (Oct 17) on the local dev server `npm run web` (port 5173); `file://` pages are blocked |
| **Notion connector** (connected) | review packets for you after each big step (already agreed Oct 12) | ✅ if you want them |
| **Claude in Chrome** | live test on claude.ai, slot 3, with you signed in | ✅ only when you say "play" |
| feature-dev agents (architect, reviewer) | design the house system against the existing code; review after | ✅ for gap 1 |
| GitHub plugin | PR checks | ❌ failed to connect here (bad auth header); `gh` works instead |
| Obsidian, Blender, Kobiton, design plugins | — | not useful for this game now |

Nothing in the plugin catalogue builds game systems for us; the gap list is design + code work.

---

## Proposal: what to build first
1. **Houses (gap 1) together with the world's people (gap 2)** — one system: a house record (land, troops, wealth, prestige, Crown loyalty, cohesion, head, heir) and its important people as real records that age and grow. Start with the Tier A houses of all 7 kingdoms from the Atlas, then marriages/hostages/succession. Design chapter first, your OK, then build.
2. Small fixes that are cheap and felt now: **soldier pay (3)**, loyalty/promises (4).
3. Abilities, the Zone, aura and style unlocks (5, 6, 19).
3b. The big-moment layer: ceremony screen with witnesses, legend pages, nicknames per group, Li's unit banner (20–22, 24, 25).
4. Then B in order, C last.
