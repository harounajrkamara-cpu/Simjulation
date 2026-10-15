# 📝 Proposal: interesting scenes, boring parts pass by themselves (Oct 16, deeper research, for the owner's approval)

**Owner's ask (Oct 16):** make the story interesting and the text not boring; when nothing happens it should go on by itself, faster; don't hand him boring parts ("now and then is fine"). He asked for deeper research.

**Where we are (v33):** routine scenes go on by themselves (`"routine": true`, 2.5 s, max 4 in a row, "Take over"); Skip ahead runs until something important; the pacing director (v32) ends standoffs, answers a waiting player and makes threats come due. Missing: (1) routine still plays **moment by moment** (one Claude call per small scene: slow and costly); (2) nothing defines what makes a scene worth showing; (3) a long calm gets no push; (4) the player cannot choose how much he sees.

## 1. What the research says

### A. Game directors: peaks, valleys and pushes
- **Left 4 Dead's AI Director** (Mike Booth, Valve, 2009): the Director estimates each player's *intensity*, which rises with damage and danger and fades afterwards. After a hard fight it **backs off** (a calm "relax" stretch); after a calm stretch it **sends something in**. Booth's design goals: "Generate Dramatic Game Pacing" and "Promote Replayability", through "structured unpredictability" and simple, playtestable algorithms. Later research (PaceMaker, 2024) and an affective-computing survey call it the seminal adaptive pacing system; it was reused in other games (e.g. Far Cry).
- **RimWorld's storytellers** (Tynan Sylvester): before an event, the storyteller weighs the colony's wealth, its people, **whether someone recently died or was badly wounded, and how long since the last big event**. The player picks a storyteller: *Cassandra* (rising and falling tension), *Phoebe Chillax* (**more downtime between events**), *Randy* (random). The player chooses the rhythm.
- **King of Dragon Pass** (David Dunham, 1999): the year passes in seasons with two decisions each; scenes interrupt mostly as **consequences of earlier decisions**, not random encounters.

**For us:** the code already has the parts (clocks, seeds, fuses, wounds); what it lacks is the Director's *rhythm*: rest after a peak, a push after a calm, and the player's choice of rhythm.

### B. Curating a simulation: most of what happens is boring
- **James Ryan, *Curating Simulated Storyworlds*** (PhD, UC Santa Cruz, 2018): the raw unfolding of a simulation "will almost always lack story structure"; a simulation like Dwarf Fortress sometimes makes fascinating plots and sometimes "just seems unfocused or dull". His answer: **curation** ("story sifting"): find the storyful sequences in the mass of events and show those.
- **Kreminski, Dickinson & Mateas, *Winnow*** (AIIDE 2021): story sifting **while the story is still unfolding** (incremental), so the game can see a story coming. Follow-up work (2023): a sifter spots possible stories during play and a **drama manager nudges the simulation toward completing them**.

**For us:** this is exactly our free-world layer. Our code can sift its own record: open threats, rivalries, seeds about to grow, a fuse near Li. Those are the stories in motion; everything else may pass as montage.

### C. LLM storytellers: the known failure modes
- **Wang, Yang, Liu & Klein, *Improving Pacing in Long-Form Story Planning*** (EMNLP Findings 2023): LLM stories "very frequently" have unnatural pacing, **skipping key events or over-describing minor ones**. Their fix measures how concrete each event is and gives detail where it is due (humans judged the pacing more consistent in 57% of cases).
- ***Static vs. Agentic Game Master AI for solo role-play*** (arXiv 2502.19519, 2025, 12 players): the single-prompt GM **"stalemated"** progress and sometimes added actions the player never chose; a version that split the **narrator** from an **archivist** that keeps the state moved the story toward goals and raised immersion (PXI 1.64 → 2.42, p = 0.034). Most players wanted **precise feedback and clear choices** rather than long descriptions to decode.
- Other work on LLM narratives (Dramamancer; "Narrative Chain", arXiv 2405.14231; SENNA/ChatRPG) agrees: an LLM left alone drifts; a controller outside it should decide progression.

**For us:** we already split the narrator (Claude) from the archivist (the code). The research says to lean on it more: the code decides how much detail an event deserves and when to move on.

### D. How much the player sees: let him choose
- **Football Manager**: the match runs in full no matter what; the player picks how much to watch: Full match · Comprehensive · Extended · **Key highlights** · Commentary only, plus a speed slider. Players who mainly want results pick Key; those testing a new tactic watch more.
- **Crusader Kings III**: events must feel "relevant, impactful and immersive in relation to the underlying simulation" (Paradox, dev diary 0); players can set per message type whether it pops up, pauses, or stays silent.

**For us:** a setting for how much Li's life is shown. Same simulation, different amount of watching.

### E. Writers: what makes a scene worth showing
- **Robert McKee**, *Story*: "No scene that doesn't turn": a scene changes a value (safe → endangered, trusted → doubted). A scene where nothing changes is a "non-event".
- **William Goldman** ("enter late, leave early"): start as late as possible, leave as early as possible.
- **The Alexandrian** (Justin Alexander): frame past the arrival (in medias res); if a scene's agenda is trivial or obvious, don't play it out. Pacing = when to end a scene, how to start the next, and how fast it plays.
- **"Skip the boring stuff"** (GM advice): a movie, not a documentary: cut the walk unless something happens on it.
- **Sid Meier**: "a game is a series of interesting decisions": offer a choice only when it is interesting.
- **Brandon Sanderson**: promises, progress, payoff; progress is what holds the middle.

## 2. The proposal (six parts)

**I. "How much do I see" setting** (Football Manager, RimWorld, CK3). Three levels in the header:
- **Key moments**: everything quiet runs as montage at once (no wait); control only at danger, a fight, a real decision, a person who matters.
- **Normal** (default): montage with 1.5 s to "Take over"; **one calm scene after a big moment** (fight, battle, death, promotion), like the L4D relax; then montage again.
- **Everything**: today's behaviour, every small scene.

**F. Montage instead of moment by moment.** A routine scene does not lead to another small scene: the page runs **Skip ahead** with the player's last plan. One Claude call covers hours or days in a few lines and stops at the next story in motion (J). Fewer calls: faster and cheaper.

**J. Stories in motion** (story sifting, Ryan/Winnow). The code lists what is unfolding: open threats and how close, rivalries above a line, planted seeds, fuses within 30 days near Li, a long goal with a chance open. The montage stops only there, or at danger. Claude gets the list as "STORIES IN MOTION".

**G. A push after a calm** (L4D, RimWorld). After **5** quiet game days (no stop, no fight, no due threat), the code picks one thing for the next scene: a seed that fits, a person's own plan coming due, or a new threat. Weighed like RimWorld: not right after a wound or a death.

**E. Every scene turns** (McKee). A scene that hands the player control fills `"turns": "<what changed>"`. No turn, no change, no fight, no time = routine: it passes by itself.

**H. Detail by importance** (Wang et al.; Goldman; the Alexandrian). The code tells Claude the weight of the moment: *routine* 1–2 sentences inside a montage; *scene* 120–200 words; *big moment* 200–300 words. Enter late, leave early; one fresh detail, not the same five ("already said" from v32 helps); end on the decision; clear choices, not riddles (agentic-GM study).

## 3. Honest limits
- Fewer small scenes means less texture in quiet times; the "Normal" calm scene after peaks and the "Everything" level keep it for when the owner wants it.
- Story sifting in our code is simple rules over our own record, not a research-grade sifter; it finds what we model (threats, rivalries, seeds, fuses, goals), not every subtle story.
- `turns` and the detail weight are followed by Claude; the code can check that a turn is named and something was recorded, not that the prose is good.
- The agentic-GM study had 12 players; the Wang study is about written stories, not games. They support the direction; only the owner's play proves it here.
- Nothing here has been tried with the real Claude yet.

## 4. Questions for the owner
1. Default level **Normal**, with **Key moments** and **Everything** to choose from. OK?
2. A push after **5** quiet game days. OK?
3. **One** calm scene after a big moment (in Normal). OK?
4. Build order: **I + F + E + H** first (faster at once), then **J + G**. OK?

## Sources
- Left 4 Dead: [Booth, *The AI Systems of Left 4 Dead* (slides)](https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf) · [Center Consulting: the L4D Director](https://www.centerconsulting.com/ai-library/concepts/l4d-director) · [PaceMaker (arXiv 2408.15001)](https://arxiv.org/pdf/2408.15001) · [Affective Game Computing survey (arXiv 2309.14104)](https://arxiv.org/pdf/2309.14104) · [Shacknews: Evolve and the L4D director](https://shacknews.com/article/82787/how-evolve-assures-action-peaks-and-valleys)
- RimWorld: [RimWorld wiki: AI Storytellers](https://rimworldwiki.com/wiki/AI_Storytellers) · [RimWorld (Wikipedia)](https://en.wikipedia.org/wiki/RimWorld)
- King of Dragon Pass: [Wikipedia](https://en.wikipedia.org/wiki/King_of_Dragon_Pass) · [IF50: 1999, King of Dragon Pass](https://if50.substack.com/p/1999-king-of-dragon-pass)
- Story sifting: [Ryan, *Curating Simulated Storyworlds* (eScholarship)](https://escholarship.org/uc/item/1340j5h2) · [Emily Short on Ryan, ch. 1–3](https://emshort.blog/2019/05/21/curating-simulated-storyworlds-james-ryan/) · [Winnow (AIIDE 2021)](https://ojs.aaai.org/index.php/AIIDE/article/view/18903) · [Felt (GitHub)](https://github.com/mkremins/felt) · [Lessard 2026, narrative sifting](https://www.pcgworkshop.com/archive/lessard2026narrative.pdf)
- LLM storytelling: [Wang et al., Improving Pacing in Long-Form Story Planning (arXiv 2311.04459)](https://arxiv.org/pdf/2311.04459) · [Static vs. Agentic Game Master AI (arXiv 2502.19519)](https://arxiv.org/html/2502.19519v2) · [Drama Llama (arXiv 2501.09099)](https://arxiv.org/html/2501.09099v1) · [LLM interactive drama, Narrative Chain (arXiv 2405.14231)](https://arxiv.org/abs/2405.14231v1) · [RPGBench (arXiv 2502.00595)](https://arxiv.org/pdf/2502.00595)
- How much to show: [GGRecon: Football Manager highlight modes](https://ggrecon.com/guides/football-manager-2024-change-highlights) · [Steam: why managers pick a highlight mode](https://steamcommunity.com/app/872790/discussions/0/1742227264187754385) · [Paradox: CK3 dev diary 0, the vision](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-0-the-vision.1265472/page-22)
- Writing: [McKee: Do your scenes turn?](https://mckeestory.com/do-your-scenes-turn/) · [No Film School: start late, leave early](https://nofilmschool.com/start-late-leave-early) · [The Alexandrian: pacing part 6, in medias res](https://thealexandrian.net/wordpress/33796/roleplaying-games/the-art-of-pacing-part-6-more-advanced-techniques) · [The Alexandrian: pacing for the beginning GM](https://thealexandrian.net/wordpress/49547/roleplaying-games/pacing-for-the-beginning-gm) · [Dicegeeks: skip the boring stuff](https://dicegeeks.substack.com/p/gms-skip-the-boring-stuff-or-make) · [Sid Meier: interesting decisions](https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay) · [Brandon Sanderson: guide to plot, lecture 2](https://www.brandonsanderson.com/blogs/blog/brandon-sandersons-2025-guide-to-plot-lecture-2) · [Emily Short: storylets](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/)

**Source caveats:** the L4D details come from the slides' table of contents and secondary summaries (the slide text could not be extracted here); the RimWorld factors come from the community wiki; the Football Manager reasons are player forum posts, not the studio's statement.
