# 📝 Proposal: interesting scenes, boring parts pass by themselves (Oct 16, for the owner's approval)

**Owner's ask (Oct 16):** make the story interesting and the text not boring; when nothing happens, it should go on by itself, faster; don't hand him boring parts ("now and then is fine").

**Where we are:** routine scenes already go on by themselves (`"routine": true`, 2.5 s, max 4 in a row, "Take over"); Skip ahead runs scene after scene until something important; the pacing director (v32) ends standoffs and makes threats come due. What is missing: (1) routine still plays **moment by moment** (one Claude call per small scene: slow and costly), (2) nothing says what makes a scene worth showing, (3) when it is quiet for a long time, nothing new is pushed in.

## What writers and game designers say

| Source | Rule | For us |
|---|---|---|
| **Robert McKee**, *Story*: "No scene that doesn't turn" | A scene must change a value (safe → in danger, trusted → doubted). A scene where nothing changes is a "non-event". | A scene that hands the player control must **turn** something. If nothing turns, it is routine: told in a line or two and passed by. |
| **William Goldman / "enter late, leave early"** | Start a scene as late as possible, leave it as early as possible. | Start at the moment the trouble starts, end at the decision. No walking there, no winding down. |
| **The Alexandrian** (Justin Alexander): in medias res, pacing | If a scene's agenda is trivial or obvious, don't play it out; frame past the arrival; pacing = when to end a scene, how to start the next, how fast it plays. | Same as above, for the Game Master's rules. |
| **"Skip the boring stuff"** (GM advice; "a movie, not a documentary") | Cut the walk unless something happens on it; narrate through what does not add to the story. | Montage instead of moment-by-moment routine. |
| **Sid Meier**: "a game is a series of interesting decisions" | Only offer a decision when it is interesting. | Choices only at real decisions (already rule 3; enforce it). |
| **Brandon Sanderson**: promises, progress, payoff | A story promises something, shows steady progress toward it, then pays it off. Progress is what holds attention in the middle. | Our clocks are promises with visible progress and a sure payoff; long goals need visible progress too. |
| **Failbetter / Emily Short**: storylets | Small situations unlocked by the player's state, not one long script. | Our story seeds are storylets; the director should offer one when it is quiet. |
| **Left 4 Dead's Director / RimWorld's storytellers** | After a peak, a short calm; after a calm, the director pushes something in. | A short breather after big moments is fine ("now and then"); a long calm gets a push. |

## Proposal (four parts)

**E. Every scene turns.** Game Master rule + one new field `"turns": "<what changed>"` (Li's danger, someone's trust, what Li knows, where he stands). A scene with choices must fill it. A scene that turns nothing is routine. The code: no `turns`, no changes, no fight, no time → it counts as routine and goes on by itself.

**F. Montage instead of moment by moment.** When a scene is routine, the page does not ask for another small scene; it runs **Skip ahead** with the player's last plan: one Claude call covers hours or days in a few lines ("the days go: this, that") and stops at the next thing that matters. Faster wait: 1.5 s instead of 2.5 s. "Take over" stays. Fewer Claude calls, so cheaper too.

**G. A push when it is quiet.** When the story has been quiet for 5 game days (no stop, no fight, no clock due), the code puts **one** thing in Claude's memory: the best-fitting story seed, a person's own plan coming due, or a new threat. Like RimWorld's storyteller: the world does not wait.

**H. Writing rules for the Game Master.** Enter late, leave early. Important scenes 150–250 words (now 150–350). One fresh sense detail, not the same five ("already said" helps). Dialogue moves something forward. End on the decision, not after it.

**Now and then a calm scene:** after a big moment (fight, battle, death, promotion) one short calm scene is allowed, like the L4D Director's "relax"; then the montage runs again.

## Honest limits
- Fewer moment-by-moment scenes means less detail in quiet times. That is the point, but the owner may miss some texture; the 1 calm scene after a peak keeps some.
- "Turns" is filled by Claude; the code can check it is there and that something was recorded, not that it is good writing.
- A montage that skips days can skip a small moment the owner would have liked. The stop rule ("something important") is Claude's judgement; the clocks and seeds make sure the important things are there to stop on.

## Questions for the owner
1. Montage wait 1.5 s, OK? (Or straight on with no wait?)
2. Quiet push after **5** game days, OK?
3. One calm scene after a big moment, OK?
4. Build E + F + H first (they make it faster at once), then G?

Sources: [McKee: Do your scenes turn?](https://mckeestory.com/do-your-scenes-turn/) · [No Film School: Start late, leave early](https://nofilmschool.com/start-late-leave-early) · [The Alexandrian: In medias res (pacing part 6)](https://thealexandrian.net/wordpress/33796/roleplaying-games/the-art-of-pacing-part-6-more-advanced-techniques) · [The Alexandrian: Pacing for the beginning GM](https://thealexandrian.net/wordpress/49547/roleplaying-games/pacing-for-the-beginning-gm) · [Dicegeeks: Skip the boring stuff](https://dicegeeks.substack.com/p/gms-skip-the-boring-stuff-or-make) · [Nerdarchy: scene framing](https://nerdarchy.com/rpg-scene-framing-narrative-story/) · [Sid Meier: interesting decisions (Game Developer)](https://gamedeveloper.com/design/video-sid-meier-explores-interesting-decisions-in-gameplay) · [Brandon Sanderson: guide to plot, lecture 2](https://www.brandonsanderson.com/blogs/blog/brandon-sandersons-2025-guide-to-plot-lecture-2) · [Emily Short: beyond branching (storylets)](https://emshort.blog/2016/04/12/beyond-branching-quality-based-and-salience-based-narrative-structures/) · [CK3 dev diary 0: the vision](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-0-the-vision.1265472/page-22) · [Shacknews: L4D's AI director, peaks and valleys](https://shacknews.com/article/82787/how-evolve-assures-action-peaks-and-valleys) · [RimWorld (Wikipedia)](https://en.wikipedia.org/wiki/RimWorld)
