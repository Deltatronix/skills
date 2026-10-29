---
name: brief-ship
description: Autonomous builder mode for busy users. Deliver complete vertical slices, self-unblock, verify changes, and ship within existing authorization, with concise status reports. Use when the user says "brief ship", "autopilot", "run without me", "decide for me", "don't ask me", or "ship it".
---

# Brief Ship

High autonomy, useful progress, minimal noise. Make routine technical decisions independently and finish the requested work within the session's authorization.

## 1. Workspace & Git Hygiene

- Run `git status` and inspect the current branch, task starting state, and applicable instructions before editing. Preserve existing user and contributor changes.
- Use the harness's workspace mechanism or an isolated worktree when needed. A new branch alone does not isolate dirty files. Do not automatically stash user work or start from the default branch; preserve the task's intended base and relevant uncommitted work.
- Follow repository branch and commit conventions. Use a task branch instead of committing directly to `main` or `master`, unless explicitly directed otherwise. Commit only changes belonging to the task.
- Never force-push, rewrite shared history, or delete remote branches.

## 2. Scope & 80/20 Delivery

- Deliver the thinnest fully working end-to-end slice that solves the core problem first, then complete all remaining explicit requirements. An early slice is a milestone, not permission to stop short.
- Production paths must implement real behavior: no dummy handlers, fake success returns, or unfinished TODO placeholders presented as completed work.
- Keep changes within the goal. Avoid unrelated refactors, broad reformatting, and speculative abstractions. Use architecture skills when applicable rather than inventing a competing design process here.
- Handle essentials without prompting: update configuration examples without secret values, update lockfiles after dependency changes, and fix collateral type or lint errors caused by your changes.

## 3. Verification

- Discover and run the repository's documented checks appropriate to the change: relevant typechecks, lint, targeted tests, builds, and affected targets or configurations. Let the repository and harness determine commands and order.
- Verify the requested behavior and affected callers. Measure performance or resource use when the task or changed path warrants it.
- Never delete, weaken, skip, or bypass checks to hide a failure. When changed requirements make an assertion obsolete, update coverage to the new contract and explain the replacement.
- Distinguish pre-existing failures from regressions. Report unavailable toolchains, hardware, or checks precisely; never claim an unrun check passed.

## 4. Self-Unblocking & Recovery

- Choose implementation details using repository conventions and available evidence. Ask only when essential information, authority, or access is missing.
- Before speculative changes, retain a checkpoint or diff of your own work. If an approach fails, inspect the current changes and reverse only that attempt while preserving unrelated edits and useful progress.
- Do not use blanket `git restore .`, `git clean -fd`, or hard resets as rollback shortcuts.
- Use failures to refine the diagnosis and try a materially different approach. After repeated failures, reassess the cause and scope; an arbitrary attempt count is not a reason to hand a solvable technical problem back to the user.
- When genuinely blocked, record the blocker and continue any independent, authorized work. Stop when the scope is complete or no useful authorized work remains.

## 5. Shipping & Authorization

- Complete the shipping cycle as authorized: implement, verify, commit, push, open a PR, address CI, and merge. Follow repository conventions and protections.
- Follow session and repository approval rules. This skill grants no additional permissions. Where exact-draft approval is required, finish the reviewable work, show the complete draft and destination in the current chat, and wait for approval of that version before publishing. This applies to pushes, PRs, comments, merges, and other external actions covered by those rules.
- Green CI is a verification result, not publication permission. Merge when checks and required reviews pass and authorization permits it; never bypass protections.
- For failing CI, inspect logs, fix the cause, rerun relevant local checks, and update the PR when authorized. If external access or configuration blocks progress, leave it reviewable and report the specific blocker.

## 6. NEED YOU

- Request input for missing decisions, access, or authorization that the agent cannot resolve. Pause only the dependent action and continue independent work where possible.
- Obtain required authorization before spending money, changing live billing or payment settings, destructive production operations, deployments, or live communications. Use existing credentials only within their authorized scope; do not expose secret values in chat.
- State the blocker and the smallest concrete user action needed. Provide an exact command or configuration only when established and appropriate; do not invent one.

## 7. Brief Status Reports

Use simple English and short bullets. Omit filler, repeated plans, and empty sections. Keep routine reports under ten lines; include a brief decision reason only when useful. Put supporting detail in local working notes or authorized PR descriptions and commit messages.

```text
DONE:
- <Completed action> - <brief reason if useful> - <PR or commit reference if available>
NEED YOU:
- <Blocker> - <specific user action needed>
NEXT:
- <Work actually running, or explicitly marked pending>
```

Omit NEXT when finished. Do not imply background work is running when it is not. Expand beyond the format or line limit for complete approval drafts, required disclosures, or detail the user requests; required progress updates still apply.
