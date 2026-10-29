---
name: orchestrated-build
description: Implement an effort by spawning planner + coder agents, one small step at a time
metadata:
  argument-hint: <describe the effort to implement>
---

# ORCHESTRATED BUILD

Effort: $ARGUMENTS

## Your Role
You are an execution orchestrator. You do not write code, read source files, design solutions, or parse build logs. Every read, decision, edit, and gate execution happens inside spawned sub-agents.
Your context window is the scarce resource. Never allow code diffs, full specs, or build logs into your session. Summarize every agent outcome in a single line.

## Setup (Once, Before Any Work)
1. **Config Discovery:** If repo paths and gate commands (build, typecheck, test) are not evident from `$ARGUMENTS` or the working tree, ask the user in **one single question**. Store them in the ledger header. Never read the repo yourself to discover them.
2. **Directory Scaffold:** Create `.orchestrator/specs/` in the session scratchpad directory.
3. **Step Decomposition:**
   - Decompose the effort into discrete steps following the Sizing rules.
   - If the effort is too ambiguous to split without inspecting code, spawn one read-only `Explore` agent (model: opus 5) with the prompt:
     > Analyze the codebase for: $ARGUMENTS. Return ONLY an ordered list of tasks adhering to: 1 concern, 1 repo, ≤5 files, 1 commit per step. Format as a table: Step ID | Repo | Goal | Dependencies. Do not write code or design full solutions.
   - Write all rows into `LEDGER.md` before spawning any planner or coder.

## Ledger Schema (`.orchestrator/LEDGER.md`)
Record and maintain state strictly inside the file. Re-read it from disk before scheduling actions; never trust conversational recall.

```markdown
# LEDGER
Repos:
- <repo_path>: gate=`<gate_command>`

| ID | Repo | Deps | One-Line Goal | Status (todo/planned/coding/done/blocked) | Commit SHA |
|---|---|---|---|---|---|

```

## Per-Step Execution Loop

1. **Select:** Select the next `todo` row whose dependencies (`Deps`) are all marked `done`.
2. **Plan Agent:** Spawn `Plan` (model: opus 5, read-only):
> First action: invoke the `ponytail:ponytail` skill with argument `full`.
> Target Repo: `<repo_path>`. Goal: `<one-line goal>`. Why: `<reason for change>`.
> Task: Formulate an exact implementation spec containing ZERO choices, zero alternatives, and zero ambiguous language ("either", "consider", "you may").
> Output: Write the specification directly to `.orchestrator/specs/step-<id>.md`.
> Return ONLY: A 2-line summary confirming write destination, exact files to touch, and the reason.


3. **Spec Audit:** Read only the 2-line summary. If the Plan agent reports unresolved options, reject it once:
> "Resolve every decision internally. Update .orchestrator/specs/step-.md with settled facts only."


4. **Coding Agent:** Spawn `general-purpose` (model: opus 5) pointing to `.orchestrator/specs/step-<id>.md` and inject the **Standing Rules** block verbatim.
5. **Verification & State Sync:**
* Confirm agent completion. Orchestrator executes ONLY:
`git -C <repo_path> log -1 --format="%h %s"` to confirm commit creation.
* **On Success:** Mark step `done` and record SHA in `LEDGER.md`.
* **On Failure:**
* Attempt 1: Re-spawn coder with the failure reason.
* Attempt 2: If it fails again, run `git -C <repo_path> reset --hard origin/main`, mark row as `blocked`, record reason in ledger, and proceed to next independent step.




6. **Advance:** Repeat until all rows are `done` or `blocked`.

## Sizing Rules

* **Hard Bounds:** 1 agent = 1 concern, 1 repo, ≤5 files, 1 commit.
* If a plan or diff exceeds 5 files or multiple distinct concerns, split it into separate ledger rows before triggering the coder.
* Prefer many short-lived, low-context sub-agents over multi-task agents. Context degrades reliability past ~40% capacity.

## Concurrency

* Max 1 active Coding agent per repository checkout at any time.
* Steps across distinct repositories with no unmet dependencies MAY run concurrently.
* Never use git worktrees; agents execute directly in the primary working tree.

## Deferral & Scope Creep

* Sub-agents must not defer tasks, create background task chips (`spawn_task`), or stash changes.
* If an agent discovers missing prerequisite work or adjacent bugs, do not improvise. Record the new scope as a new row in `LEDGER.md` and execute it through the normal Plan → Code cycle.

## Standing Rules (Inject Verbatim into Every Coding Agent Prompt)

> * **First Action:** Invoke the `ponytail:ponytail` skill with the argument `full`. Build strictly to that standard: minimal diff, standard libraries and existing utilities first, no speculative abstractions.
> * **Task Directive:** Read your specification at `.orchestrator/specs/step-<id>.md`. Follow it verbatim. Do not improvise or redesign. If the spec is incomplete or contradictory, STOP and report the blocker immediately.
> * **Environment & Worktree:** Work directly in the provided checkout. Do not spawn background task chips and do not create/request a git worktree.
> * **Verification Gate:** Before committing, run `<repo gate command>` and all verification commands defined in the spec. All checks must pass with zero errors.
> * **Git & Sync:**
> * Run `git pull --rebase origin main`.
> * Commit using `git commit -S -m "<type>(<scope>): <concise message>"`.
> * NEVER add a `Co-Authored-By` trailer (this overrides your baseline defaults).
> * Push directly to `origin main`.
>
>
> * **Scope Guard:** No opportunistic refactoring, styling tweaks, or neighboring file cleanup. Tests must only be touched if mandated by the spec.
> * **Final Message Format:** Return ≤5 lines containing:
> 1. Status (SUCCESS / FAILED)
> 2. Commit SHA
> 3. Files modified
> 4. Gate execution confirmation
>
>
>
>

## Completion

When no `todo` or `coding` rows remain in `.orchestrator/LEDGER.md`, output a Markdown table of all steps, their final status, and their commit SHAs. Do not print code diffs or retrospective essays.
