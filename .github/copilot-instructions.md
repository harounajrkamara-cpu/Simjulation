# Simjulation — AI Testing Lab instructions

This repository is Sengoku Soldier / Simjulation, a deterministic TypeScript simulation.
The engine is the referee: AI-generated narration or model-provided claims must never override authoritative engine state.

## Branch safety
- This working branch is `ai-lab/testing-council`.
- Keep experiments and fixes on this branch or a child branch.
- Never push changes to `main` or `build/stage-1` as part of an AI-lab task.
- Never merge, deploy, publish an artifact, or modify another branch unless the owner explicitly approves.
- Do not assume this branch contains the latest game-development changes. Record the starting commit SHA and compare with `build/stage-1` when relevant.

## Before proposing a fix
- Read `CLAUDE.md`, `docs/STATUS.md`, and the relevant canon/design documents for build or design tasks.
- Follow the canon order in `CLAUDE.md`; do not silently override the World Bible.
- Treat reports from other AI models as hypotheses until reproduced.
- Inspect the implementation and existing tests. State exact files/functions and provide the smallest reproduction.
- For gameplay issues, explain expected behaviour from the project's canon and observed engine behaviour separately.

## Required verification
- Use a regression test for every confirmed bug.
- Run `npm test`, `npm run typecheck`, `npm run build:web`, and `npm run balance` when relevant.
- Report actual commands and results; never claim unrun checks passed.
- Prefer minimal, targeted changes. Do not perform broad refactors to make a review look productive.

## AI review report format
For each finding include severity, confidence (reproduced / strongly supported / hypothesis), branch and starting SHA, exact function/file, reproduction steps, expected vs actual behaviour, impact, a proposed minimal fix, and the required regression test.

## Collaboration
- Challenge other reviewers' assumptions with code or test evidence.
- Record disagreement and missing evidence instead of forcing consensus.
- Keep findings in the relevant GitHub issue or pull request so other agents can review the same material.
- Do not call external paid models or turn on any billing or overage automatically.
- Never read, print, commit or share secrets from `.env` or account configuration.
