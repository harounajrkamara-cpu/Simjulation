# Gameplay advice schema — Simjulation

**Status:** Design recommendation for Claude and all reviewing agents. Not an implementation approval.  
**Date:** 16 October 2026  
**Scope:** Advice only; this file does not change game source, mechanics, or the active development branch.

## 1. The agreed design direction

**Prefer an emergent, player-driven world:** Li pursues ambitions of his own, and the story grows out of his choices, relationships, opportunities, mistakes, and a world that continues to act without him.

Do not optimize primarily for a story that constantly happens *to* Li. The player should feel that they are building a life and pursuing goals inside a living world, not just responding to the writer's next scene.

## 2. Important correction: do not force a crisis every session

A session does **not** need to begin with an urgent problem. Requiring a threat, dispute, or emergency every time risks creating a repetitive loop:

> A problem appears → Li reacts → an NPC reacts to Li → another problem appears → Li reacts again.

That can become boring even when the prose is good. The target is **an interesting possibility**, not a mandatory crisis. Sometimes that means pursuing a self-chosen goal; sometimes exploring, training, investigating, building a relationship, positioning for power, travelling, or simply experiencing a quieter moment.

Quiet moments are allowed. They should not all be secretly converted into emergencies.

## 3. Variety must change gameplay, not just the wording

Rotate organically between different kinds of activity. These are examples, not a rigid rotation or checklist to force into every session.

- **Discovery:** investigate a rumour, notice a contradiction, learn something that changes Li's understanding.
- **Mastery and progression:** practise, find a mentor, test a skill, accept a meaningful cost to improve.
- **Strategy and influence:** gather information, build leverage, make alliances, take a position, or deliberately wait.
- **Relationships:** earn trust, create distance, negotiate loyalty, or discover what an NPC wants.
- **World activity:** NPCs pursue their own goals and sometimes create opportunities or consequences without Li initiating them.
- **Free and quiet moments:** travel, observe, recover, talk, or choose not to act yet.

Changing the scene's topic while keeping the same interaction pattern is not enough. Each activity should offer distinct actions, trade-offs, and consequences. Do not turn every option into a differently worded dialogue response.

## 4. Agency and consequences

For each important scene, ask:

1. What is Li trying to achieve, or what possibility has caught his attention?
2. Are there genuinely different approaches, with understandable trade-offs?
3. Can the player act freely where the simulation supports it, rather than being funnelled into the writer's preferred action?
4. Do outcomes persist in a meaningful way — for example in capability, knowledge, relationships, reputation, resources, access, or future opportunities?
5. Can failure change the situation, create a cost, or open another route instead of merely stopping progress?
6. Is this a game action with a simulated consequence, or only a paragraph that claims something happened?

The game engine should own authoritative state changes and rules. The GM/AI should communicate and dramatize those outcomes, not invent persistent success that the simulation has not authorized.

## 5. A living world, not a pressure machine

NPCs should have goals, relationships, knowledge, fears, and plans that shape their actions. The world should sometimes advance without Li. But independent activity should follow established motives and state; it should not be a random crisis generator.

Do not use constant escalation, artificial urgency, or hidden rubber-banding just to prevent quiet periods. Tension and release are useful pacing tools, not a requirement that every turn be dramatic.

## 6. Review checklist for any proposed gameplay change

Reviewers should record concrete examples and answer:

- **Player initiative:** Can Li pursue a goal he chose, without the game immediately replacing it with an unrelated emergency?
- **Pattern diversity:** Does the change enable a different kind of play, or only reskin the same problem → reaction loop?
- **Meaningful choice:** Do the available approaches differ in cost, risk, information, relationships, or outcome?
- **Persistence:** What state or future possibility changes because of the player's action?
- **World independence:** Does an NPC or faction sometimes act for its own established reasons?
- **Causal consistency:** Do narration, events, and actual engine state agree?
- **Pacing:** Are quiet stretches possible, and are important moments earned rather than constantly forced?
- **Evidence:** Was this checked by source inspection, deterministic engine tests, browser play, or a real live-model playtest? Label the method honestly.

A reviewer must distinguish observed behaviour from design inference and speculation.

## 7. Practical priority

Do not respond to boredom by adding more lore, systems, cutscenes, or random events by default. First test and improve the first 30 minutes of play. Observe whether a player can find and pursue a goal, make distinct choices, see persistent consequences, and move between different kinds of activity without being pushed into the same loop.

Useful diagnostic question: **If the prose were stripped away, would the player still be making interesting decisions?** If not, the main issue may be the gameplay loop rather than the writing quality.

The existing pacing targets in project documentation (such as a 'spark' every several minutes or multiple meaningful choices per hour) should be treated as hypotheses to test, not quotas that force constant stimulation. A good session may contain quiet time.

## 8. Evidence and design references

These sources motivate the principles above; they do not prove that a specific Simjulation implementation is fun.

- Matthias Worch / Game Developer, [Designing Your Game to Offer Meaningful Choices](https://www.gamedeveloper.com/design/video-designing-your-game-to-offer-meaningful-choices) — agency and meaningful possibility.
- Tony Howard-Arias / GDC, [Making Player Choices Feel like They Matter in Your Narrative](https://www.gdcvault.com/play/1028017/Game-Narrative-Summit-Making-Player) — local relationship changes and larger narrative consequences.
- Richard Rouse III / GDC, [Dynamic Stories for Dynamic Games](https://www.gdcvault.com/play/1023753/Dynamic-Stories-for-Dynamic-Games) — approaches to creating distinct player narratives.
- John Nelson Rose / Game Developer, [Tension and Release in Games](https://www.gamedeveloper.com/design/addressing-conflict-tension-and-release-in-games) — tension needs pacing and release.

## Handoff to Claude

Treat this as the agreed design direction for future proposals and playtests: **build around Li's ambitions in a world that acts independently; offer possibilities rather than forcing a crisis every session; and make variety and consequence mechanical, not just narrative.** Review and discuss before implementation. Do not treat this document as permission to modify source code or merge changes.
