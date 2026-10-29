---
name: deep-fix
description: Before any change that adds or changes behaviour (a feature, bug fix, optimization, or user-visible label or format), find the code that already does it, reuse it, share a rule once a second caller needs it, and keep one-caller code local. Use for every such change in a codebase that agents work on without shared memory, and when asked to deep fix.
---

# Deep fix

Several agents change this code without knowing about each other. The repository is their only shared memory. On every change: find what already exists, change each rule in the one place it lives, and build nothing for a caller that does not exist yet.

A new copy of existing logic is a fork. From then on, every fix lands in one copy and the other drifts.

## 1. Recon

Run a recon before every change that adds or changes behaviour: features, bug fixes, optimizations, and anything the user sees (labels, icons, shortcuts, formats, messages). Changes where nothing behaves differently (formatting, comments, renames, test-only edits) skip it.

Run it in a read-only subagent when your harness can start one, so the search stays out of your context. Otherwise do it yourself before you open the files you will edit. Give the subagent the task, not your planned solution:

> Find every place in this repository, and in first-party packages it builds or links, that already does part of this task: <task, in user terms>.
> Search by behaviour, not only by likely names:
> - domain words and their synonyms; the data types, structs and schemas involved; constants, protocol ids and register addresses
> - user-visible text: labels, icon names, shortcuts, message text, format patterns (`toFixed(`, `padStart(2`, `%02d`, `strftime`, `toLocaleDateString`)
> - work not merged yet: recent commits on these paths, remote branches, open pull requests
>
> For each hit give: path:line, what it does, its callers, and its kind: a function, inline inside a caller, over-built (options nobody passes, a single caller, mode flags, wrappers that only forward), or generated (and from what).
> Reply with facts only, at most 25 lines.

Recon is done when, for each piece of logic the change needs, you can name where it already lives or the search terms that found nothing.

## 2. Decide

Every piece of logic the change needs that recon found gets one verdict, applied in this change:

- **Reuse**: it exists as a function. Call it. Add a parameter only for a value that today's callers pass differently.
- **Lift**: it exists inline in one or more other places, and it is the same rule. Move exactly the shared logic into one function and point those callers at it. What differs stays with each caller.
- **Different rule**: it only looks alike. Keep it separate and write the one-line reason.

Same rule means: if it changes here, it must change there. This covers what the user sees too: one action's icon, label and shortcut; one kind of value's format; one message.

Logic with a single caller stays with that caller, with no shared module, option, interface, factory or config for a caller that does not exist yet.

These verdicts outrank "shortest diff", "fewest files" and "no unrequested abstractions" rules. Lifting existing logic into one function is reuse, not a new abstraction.

Share the primitive, keep the tools. When two tools share mechanics (a click chain, a hit test, a parser, a checksum), the mechanics get one home and each tool keeps its own home and its own domain rules. A tool rebuilt as flags of another tool has lost its identity.

## 3. Build

1. **Prep change.** Make the change easy without changing behaviour: lift the shared logic, and simplify only the overkill your change has to pass through (the option bag you would otherwise extend, the mode switch you would otherwise add a branch to). Other callers keep their behaviour; their edits are mechanical (a call replaces their inline copy, imports, call shape). When copies of one rule have drifted apart, keep each caller's current behaviour and name the drift in your report. Run the tests, and keep this in its own commit when you commit.
2. **The change.** Make it in the one place each rule lives.

A bug report names a symptom. Fix the rule where it lives so every caller gets the fix, then remove caller workarounds that compensated for that bug. For generated code, fix the schema, template or generator and regenerate.

Overkill beyond your change's path goes into your report as work for the `de-overkill` skill.

## 4. Verify and report

Run the build and tests for every caller of the code you changed, on every target and configuration the repository builds. Then fetch: if someone landed overlapping work on the same paths while you worked, build on theirs so one version of each rule survives.

Report what you reused, lifted or kept separate (with the reason), the callers you changed, the checks you ran, and any overkill left for `de-overkill`.

## Example

The sketch pen and the board track tool each carry their own inline click chain (click, move, finish, cancel, preview). A new schematic wire tool needs the same chain. Recon finds both copies. Verdict: lift. The prep change moves the chain into one function with no options and points the pen and the track tool at it. The change builds the wire tool on it. The track tool keeps its nets, clearance and pad snapping: those are its own rules.
