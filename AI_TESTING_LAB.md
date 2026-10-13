# Simjulation AI Testing Lab

## Purpose

This branch is a separate testing and review copy based on `build/stage-1`.
It exists to investigate bugs, run repeatable simulations, discuss proposed changes,
and test experimental fixes without disturbing the active game-development branch.

- Active game development remains on `build/stage-1`.
- `main` is not the testing target.
- Do not merge this branch into either branch automatically.
- This lab does not automatically receive future changes from `build/stage-1`; compare or refresh the baseline deliberately.
- All experimental code changes stay on this lab branch or a child branch until the owner approves them.

## Team roles

- **Coordinator (Hermes):** shares the same issue/report with participating agents, manages review rounds, records disagreement, and compiles the evidence-based decision.
- **Code reviewer (GitHub Copilot):** reviews diffs, tests, type safety, and edge cases using its available GitHub/Copilot features.
- **Independent reviewer (ChatGPT/OpenAI Codex, when actually connected):** attempts to reproduce findings, proposes adversarial tests, and checks other reviewers' reasoning.
- **Design/gameplay reviewer (Claude, when actually connected):** checks that proposed fixes preserve the established game vision and gameplay.
- **Knowledge record (Notion, when connected):** stores approved findings, decisions, and open questions. Notion AI is not assumed to be an automatically running GitHub bot.

These are intended roles, not proof of connection. A role only counts as active after a successful end-to-end test.

## Required workflow for each suspected bug

1. Record the starting branch and commit SHA.
2. Describe the expected behaviour and the observed behaviour.
3. Provide the smallest reproducible command or scenario.
4. Identify the exact code path and test that supports the claim.
5. Have reviewers independently assess the issue before sharing conclusions.
6. Ask reviewers to challenge the strongest findings and report counter-evidence.
7. Fix only on this lab branch or an isolated child branch.
8. Add a regression test that fails before the fix and passes after it.
9. Run the full workflow and record the actual results.
10. Report unresolved disagreement and any untested areas.

## Report format

For each finding, report:

- Severity: critical / high / medium / low
- Confidence: reproduced / strongly supported / hypothesis
- Branch and starting commit SHA
- File and line/function
- Reproduction steps
- Expected and actual result
- Impact on player experience, simulation state, progression, combat or saves
- Proposed minimal fix
- Regression test
- Test results before and after

Never report a hypothesis as a confirmed bug. Never claim a command passed unless its output was observed.

## Safety and cost rules

- Do not change `main` or `build/stage-1` from this lab.
- Do not deploy or publish an artifact from this lab.
- Do not commit credentials or secrets. Never read or publish `.env` values.
- Do not turn on paid model usage, API billing or automatic overage.
- Do not make large architectural changes just to satisfy one review.
- No merge or production change without the owner's explicit approval.
