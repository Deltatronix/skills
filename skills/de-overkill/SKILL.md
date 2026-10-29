---
name: de-overkill
description: Bring overengineered code back to direct code without changing behaviour. Removes one-caller shared modules, option bags, single-implementation interfaces and factories, forwarding wrappers, caller-named mode flags and dead config after proving who calls what. Use when asked to de-overkill, simplify, rebalance, debloat or clean up overengineering in a folder, package or repository.
---

# De-overkill

Earlier work, often by agents that did not know about each other, left abstraction that costs more than it saves. Bring one area at a time back to direct code: the least production code that keeps every behaviour, with sharing only where callers need the same rule. This is a refactor, so behaviour stays the same.

## 1. Baseline

Work on one area at a time: the folder or package the user named, or the smallest one that holds the overkill. Build every target and run the tests before you change anything, and record what already fails.

## 2. Hunt and prove

List the candidates in the area by the shapes in the table below. Use a read-only subagent per area when your harness can start one. A `ponytail-audit` report is a good starting list when you have one; the hunt list builds on it (ponytail, MIT licence).

For each candidate, list its real callers: production callers, test-only callers, and how each value is passed. A text search alone cannot prove that something is unused. Before you remove anything, check:

- consumers outside the repository: other repositories that use a published package, and public SDK, plugin or API exports
- entry points a text search misses: interrupt vector tables, weak HAL callbacks, linker scripts, string-keyed registries, routes, reflection, dependency injection, config files

Then remove it from the type or signature and build every target and board configuration. The compiler lists the callers.

## 3. Decide

| Shape, after proving callers | Action |
|---|---|
| an option no caller passes | delete it and keep the default path, unless it is a setting (below) |
| an option every caller sets to the same value | a constant inside, unless it is device or deployment config |
| an option one caller sets, that can run before or after the shared call | move it into that caller |
| an option one caller sets, that must run inside the shared loop | keep it as a parameter |
| a shared module or layer with one production caller | move it next to that caller |
| one helper used for two different rules | give each caller its own code |
| an interface, factory or registry with one implementation | call the concrete code |
| a wrapper that only forwards, including a caller's local wrapper around a shared helper | call through |
| mode flags named after callers (`mode: 'board'`, `isSchematic`) | each branch goes back to its caller; the common core stays shared |
| a tool rebuilt as flags of another tool | its own tool again, on the shared primitive |
| hand-rolled code the standard library or platform ships | use the standard feature |
| copies of one rule | one function |

Same rule means: if it changes here, it must change there.

Keep: public, SDK and plugin exports; hardware, OS, IO and test seams; generated code (fix the generator instead); code that owns lifecycle, ordering, cleanup or backpressure; settings that a user, a device or a design rule tunes (clearances, tolerances, calibration, timeouts), even when every caller uses the default today; shared code whose callers need the same behaviour, stateful or not.

## 4. Apply in batches

One commit per kind of change, in this order: dead options and code, constants, wrappers and factories, one-caller modules, mode flags, copies. Build and test after each batch, and revert a batch that breaks. On hot paths and constrained targets, compare the repository's benchmark, memory or binary-size numbers before and after.

The area is done when every candidate has an action or a reason to keep it, every batch is green, and production lines went down.

## 5. Report

Production lines before and after, what was removed by kind, what was kept and why, the checks you ran, and a manual check list for each page, screen or device the change touches.
