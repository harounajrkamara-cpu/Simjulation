# 📝 Proposal: the pacing director (Oct 16, for the owner's approval)

**Problem (owner playtest of version 31, all three confirmed by the owner):**
1. **The story stalls.** At the Kurose ford, 6–7 scenes on the same evening repeat one beat: Raizen asks "what do you hear?", the mailed rider waits, Gonza watches from the willows. Gonza threatens ("Tonight", "I can wait", "Spring is long") for weeks with no payoff.
2. **Wrong kind of control.** A 12-year-old slave is asked for command decisions he cannot make. The player answers "I don't know, I'm a slave, I follow orders", gets the same question back, and loses the thread ("what is happening… can't follow").
3. **Repetition.** Every scene describes the same things again: Raizen's stiff left knee, Gonza's missing ear, brown water over stones, Hisame looking and looking away.

**Root cause:** the code is a good referee (it stops what must not happen) but nobody is the **director**: nothing makes a threat come due, a standoff end, or time move. Claude, left alone, keeps the tension up by asking and waiting. The build plan already had a "pacing director" for Stage 2; this playtest shows Stage 1 needs it now.

## What games and experts do

| Source | What it does | What we take |
|---|---|---|
| **Left 4 Dead's AI Director** (Valve, Mike Booth) | Tracks how much pressure players are under; builds up, peaks, then deliberately gives a quiet stretch. A "rollercoaster" of peaks and valleys. | A small tension state in the code: after a peak (fight, battle, big scene) comes a quiet stretch; after a quiet stretch the director pushes something forward. |
| **RimWorld's storytellers** (Tynan Sylvester) | The storyteller reads the colony's situation and picks events for a rising and falling tension curve; inspired by the L4D Director. | The director picks from what already exists (fuses, seeds, clocks, raids) when it is quiet too long. |
| **Blades in the Dark: danger clocks** | A threat is a clock with 4–8 segments. Complications tick it; when it fills, the threat arrives (guards close in, the alarm sounds). Clocks are shown, cheap to make, easy to discard. | **Threat clocks in the code**: "Gonza's revenge 3/4". The code ticks them with time; a full clock happens in the next scene. |
| **Dungeon World: fronts & grim portents** | Each threat has an impending doom that happens if nobody intervenes, and a few portents on the way. | Each clock has a doom ("Gonza catches Li alone: a fight the code runs") and the signs Claude may show before it. |
| **Apocalypse World / PbtA GM moves** | "When everyone looks to you to see what happens, make a move." Soft moves warn and give a chance to react; hard moves are final. Never ask what the players are waiting for you to say. | When the player waits or obeys, the GM **acts** (an order, an attack, news), never asks again. After two soft moves on the same threat, the next one is hard. |
| **Sid Meier, "a game is a series of interesting decisions"** (GDC 1989/2012) | A choice is worth offering only if it is interesting: real options, real consequences. | Offer choices only where Li truly decides (obey or not, speak or hide, help or not). A slave gets orders, not questions. |
| **The Alexandrian: "Don't prep plots, prep situations"** | Prepare situations and tools, not scripted outcomes. | Already our seeds and fuses; clocks are situations with a clock on them, never a script. |
| **LLM game-master research** (SENNA/ChatRPG; "Narrative Chain", arXiv 2405.14231; Dramamancer) | An LLM left alone drifts and loses structure; working systems put a controller outside the LLM that decides progression, and let the LLM narrate. | Same as our principle: **the code directs, Claude tells.** |
| **Repetition in long LLM conversations** (arXiv 2512.06256; Lu et al., INLG 2025) | Long exchanges converge into loops and repeated wording; quality degrades across turns. Suggested remedies: summarise history, ground each turn. | Tell Claude, from the code, which phrases it already used; send fewer full old scenes (the chapter recaps already summarise). |

## The proposal (four parts, smallest first)

**A. The waiting rule (problem 2).** GM rule: when the player waits, obeys or says "I don't know", the world acts: the superior gives an order, time moves on, or the threat strikes. Never ask Li the same question twice. A slave or soldier gets orders; offer choices only where Li truly decides. Code: if the player's last two inputs are waiting or obeying ("I wait", "follow orders", "say nothing"), the next scene must move time or set "routine" (the story goes on by itself, which already exists).

**B. The stall counter (problem 1).** The code counts scenes in a row where nothing changed (no time passed, no change applied, no fight, no new person). At 2 it tells Claude in the memory: "THE SCENE IS STALLING: make a hard move now (the enemy attacks or withdraws, an order sends Li away, the night ends)." At 3 a scene that still changes nothing is sent back once.

**C. Threat clocks (problem 1).** Claude opens a threat with a change `{"kind":"clock","id":"gonza","name":"Gonza's revenge","size":4,"doom":"Gonza catches Li alone: a fight the code runs"}`. The **code** ticks every open clock by time (provisional: 1 segment per 3 days), and Claude may tick it once per scene when the story gives cause; only Li's actions in the story can push one back. When a clock is full, the memory says "DUE NOW", and the next scene must deliver the doom (a fight is started by the code, as always). Shown in the Li tab as Li feels it ("Gonza is waiting for his chance"), never as numbers. Max 3 open clocks.

**D. Already said (problem 3).** The code finds phrases of 3+ words repeated across the last 3 scenes and lists them in the memory: "ALREADY SAID, do not repeat: stiff left knee, missing ear, brown water over the stones." Send the last 4 scenes in full instead of all since the chapter start (the recap covers the rest). No extra Claude calls.

**Order:** A + B first (small, they fix the ford). Then C (new, needs tests and a canon line in the World Bible). D alongside.

## Honest limits
- The code can force that *something* happens; it cannot make Claude's prose good. Better prose comes from better rules, and only play shows it.
- The stall counter can be wrong in a slow but meaningful talk. That is why it first warns (2) and only sends back at 3.
- Clocks rely on Claude opening them for threats it invents; the code can open the obvious ones itself later (a person with high rivalry who threatened Li).
- None of this has been tried with the real Claude yet.

## Questions for the owner
1. Clock speed: 1 segment per 3 days (Gonza's 4-step revenge in about 12 days if Li does nothing)? Faster or slower?
2. Stall limit: warn after 2 still scenes, send back at 3. OK?
3. Show the clocks in the Li tab as feelings ("Gonza is waiting for his chance"), or keep them fully hidden?
4. Start with A + B + D now, and C after your OK on the numbers?

Sources: [Left 4 Dead (Wikipedia)](https://en.wikipedia.org/wiki/Left_4_Dead) · [How Evolve learned from L4D's AI director (Shacknews)](https://shacknews.com/article/82787/how-evolve-assures-action-peaks-and-valleys) · [Structure or AI director? (Game Developer)](https://www.gamedeveloper.com/design/structure-or-ai-director-) · [RimWorld (Wikipedia)](https://en.wikipedia.org/wiki/RimWorld) · [Progress clocks (Blades in the Dark SRD, Roll20)](https://roll20.net/compendium/BITD/Progress%20clocks) · [Sly Flourish: progress clocks](https://slyflourish.com/progress_clocks_in_dnd.html) · [Fronts (Dungeon World, Roll20)](https://roll20.net/compendium/dw/Fronts) · [Magpie Games: picking the right GM move](https://magpiegames.com/blogs/news/picking-the-right-gm-move-in-pbta-part-one) · [The Daily Apocalypse: choosing your moves](https://daily-apocalypse.com/daily-apocalypse/51-guidelines-for-choosing-your-moves) · [Sid Meier: interesting decisions (Game Developer)](https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay) · [The Alexandrian: Don't Prep Plots](https://thealexandrian.net/wordpress/4147/roleplaying-games/dont-prep-plots) · [Drama Llama (arXiv 2501.09099)](https://arxiv.org/html/2501.09099v1) · [LLM interactive drama, Narrative Chain (arXiv 2405.14231)](https://arxiv.org/abs/2405.14231v1) · [Repetition in LLM-to-LLM dialogue (arXiv 2512.06256)](https://arxiv.org/abs/2512.06256) · [Multi-turn quality degradation (INLG 2025)](https://aclanthology.org/2025.inlg-main.2)
