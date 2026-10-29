---
name: deep-fix
description: Find existing implementations before adding or changing a capability, fix shared causes, and simplify overengineered code. Reuse behavior that must change together while preserving domain, resource and public-contract boundaries. Use for potentially duplicated features or fixes, consolidation, or requests to deep fix, simplify, optimize or rebalance existing code. Applies across UI, CLI, service, library, native/C++ and embedded applications. Audits report; requested rebalances implement and verify the simplifications.
---

# Deep fix

Independent agents should extend one codebase, not create parallel implementations of it.
Reuse is one tool for that goal, not the goal itself. The target is a maintainable implementation
with the least necessary machinery, preserved contracts and efficient execution. Judge the code
left behind, not the size of the diff.

Start with existing implementations and concrete operations. A second caller makes sharing worth
investigating; it does not make sharing mandatory. Three similar lines can cost less than a new
module, interface and import.
Create one authoritative implementation for a **behaviour that must change together**, not for
every noun, shape or capability.

## 1. Discover before designing

Understand the requested behaviour and its contract: inputs and outputs, errors, state,
ownership, concurrency, public compatibility and resource limits. Then search the current
repository before choosing an implementation.

Search beyond the file and directory being edited. Follow the repo's module layout, exports
and dependency directions. Use the build graph and manifests to identify relevant source roots,
including first-party packages this application, binary, image or library links outside the open
directory. Search for the behavior by its inputs and rule as well as its likely identifier.
An unrelated sibling project is not automatically part of the consolidation scope.

- names: domain nouns and verbs, synonyms, symbols, files, classes, functions and routes
- behaviour: the operation, algorithm, state transition, protocol rule or error being added
- callers: commands, pages, endpoints, jobs, SDK methods, drivers, tasks and tests
- data contracts: types, schemas, enums, error codes, configuration keys, register maps and
  wire messages; inspect their owning definitions and generators
- presentation where relevant: labels, messages, icons, formatting patterns and theme tokens
- established infrastructure: local packages, platform utilities, standard library facilities
  and dependencies already in use

Read the relevant implementations and their tests. Search broadly; read deeply only what could
own this behaviour. Prefer an existing home that already has the right contract over extracting
a new abstraction from copies.

The repository is the coordination medium between agents. Check current edits, relevant
available integration state and existing work records before creating another implementation;
preserve other contributors' changes. Other checkouts and unshared work may be invisible, so
make discovered paths and material visibility limits explicit rather than claiming global
uniqueness. Use normal modules and documentation; a parallel agent registry is not a substitute
for usable code structure. Follow the session's authorization rules for coordination messages.

Done when you can say one of:

- existing home: `<path>`, used by `<callers>`; reuse or extend it
- candidate copies: `<paths>`; their behaviours are compared below
- no suitable implementation found after searching `<terms>`; keep the new implementation local
  to its caller

## 2. Decide what, if anything, should be shared

Run the **bug-fix test** per behaviour: if this behaviour is wrong in one place, should the same
fix reach the other place? Similarity of code, names or output is not enough.

| Verdict | Evidence | Design |
|---|---|---|
| **Reuse** | an existing implementation has the required contract | call or extend it; preserve defaults and existing callers |
| **Extract** | two real callers own the same rule or invariant, and sharing reduces total cost | extract only that behaviour; keep caller-specific policy local |
| **Compose** | tools share a primitive but have different contracts, state or domain rules | give the primitive one home; keep a separate home for each tool |
| **Keep local** | independent change semantics, incidental repetition, or sharing costs more than it saves | keep it with its owner; use a separate module only when useful |

Two callers are evidence of reuse only when their behaviour should stay coupled. A single caller
can still use an established shared home. Public libraries, SDKs and plugin APIs have callers
outside the repository; internal reference counts do not prove those exports are unused.

Length alone does not decide ownership. A one-line conversion or permission rule can encode
shared knowledge; repeated elementary expressions can have independent meanings. A one-caller
module or interface can earn its place through useful isolation, not hypothetical reuse.

When copies disagree, preserve intentional differences. Do not unify user-visible output,
protocol behaviour or defaults merely to make the implementations identical.
Apply the same test to data definitions: the same contract should have an authoritative
definition; wire, domain and platform representations may legitimately differ.

### Share at the right layer

A capability is defined by its contract, not by the code it happens to contain. A PCB trace tool
and a graphics line tool can share polyline interaction or geometry while remaining different
tools. Nets, clearance, layers and routing policy belong to the trace tool. Folding them into a
generic line tool creates a domain-heavy abstraction; rebuilding the trace tool as line-tool
flags loses its identity.

The same distinction applies elsewhere:

| Situation | Candidate shared primitive | Behaviour that stays local |
|---|---|---|
| `deploy` and `upgrade` commands | cluster-diff algorithm | command contract, confirmation and rollout policy |
| two service endpoints | pagination mechanics | authorization and response contract |
| UART and SPI sensor drivers | common frame parser or checksum, when the format is truly the same | transport, timing, buffer ownership and interrupt policy |
| two UI dialogs | genuinely common control or formatting rule | workflow, copy and domain state |

Extract the narrow primitive only when that reduces the work of understanding and changing both
callers. Similar code at the wrong layer is not duplication.

One home means one authority for a contract within an appropriate boundary, not one global
module or shared mutable instance. Callers can reuse code while retaining independent state
and lifetimes. Independently released products, runtimes or hardware targets may need separate
implementations; share a specification, generator or conformance tests when sharing source
would create worse coupling. Keep dependency direction acyclic.

## 3. Choose the lightest sufficient shape

Follow the language, architecture and conventions already present in the project. Industrial
quality is contextual: clear ownership, explicit errors, safe lifetimes, appropriate concurrency,
compatible APIs and bounded resource use matter more than a particular abstraction pattern.
Existing overengineering is evidence to challenge, not a convention that must be preserved.

- **Extend in place** when the existing home already owns the behaviour. Keep its public surface
  small and its defaults compatible.
- **Add a parameter** for a small, observed variation that one place can handle without spreading
  branches. Name it after behaviour. Existing callers should keep today's behaviour by default.
- **Keep configuration explicit** when a value belongs to a deployment, device, environment or
  caller, even if every current caller supplies the same value. Sameness today does not make it
  a universal constant.
- **Use separate modules or composition** when variations have different state, dependencies,
  lifetimes or domain contracts. A split should reduce coupling or branching, not merely move it.
- **Keep simple local code local**. A separate function or module earns its place through a
  clearer contract, useful isolation or shared change semantics; neither the first nor second
  caller automatically requires a new file.
- **Use existing dependencies and standard facilities** where they fit. Do not add a dependency,
  framework, adapter, strategy interface or plugin system for a hypothetical future caller.

Avoid flags named after callers when they conceal several unrelated behaviours. A domain enum is
reasonable when it is part of the real contract, not when it exists only to special-case one
call site.

Trace the result from one caller's perspective. Each file, abstraction and branch should carry a
useful responsibility. When added indirection costs more than the shared rule saves, simplify
the boundary or keep the implementations apart. Judge total support cost, not a fixed hop count.

### Presentation

Use the project's established formatting, design-system and message conventions when the same
user-facing decision applies in several places. Share the decision, not incidental markup or
rendering code. Keep intentionally different formats, labels, icons and layouts independent.
Do not introduce a design system as part of a bug fix.

### Performance and resource constraints

Preserve algorithmic complexity and the caller's latency, memory, allocation, binary-size and
real-time constraints. Resolve reusable configuration once when that is the established pattern
and it avoids repeated work. Keep shared dependencies out of targets that cannot support them.

Preserve reentrancy, cleanup and ownership, ABI, and permitted operations in thread or interrupt
context. Choose compile-time or runtime variation for the actual target. Source reuse does not
justify new heap allocation, blocking, mutable globals or runtime dispatch on a constrained path.
Optimize demonstrated repeated work, algorithms, data movement and IO before speculative
micro-optimizations; shorter source and fewer call layers alone do not establish faster code.

When changing a known hot path or resource-constrained target, use the repo's representative
benchmark, profiler or measurement procedure where one exists. Report before/after evidence or
state that it was unavailable. Off those paths, optimize for clarity rather than speculative
micro-performance.

## 4. Plan only for the risk involved

Most fixes and local extensions need no separate planning document. Before editing, write a
short plan in the repo's normal working channel when the change moves behaviour between modules,
changes several callers, or affects public contracts, tool identity, concurrency, lifetimes or a
hot path.

A useful plan contains only:

- behaviours that will share one implementation, with evidence from the bug-fix test
- behaviours and intentional differences that remain local
- callers and compatibility requirements
- tests that pin the moved behaviour and each caller's distinct contract
- the main failure risk and the expected effect on complexity

Use an existing task or local working note as appropriate; publish to an issue or PR only under
the session's approval rules. Do not commit a planning document solely because this skill was
invoked. If the shared and local behaviours cannot be separated cleanly, reduce the consolidation
scope instead of forcing the merge.

## 5. Build a task-sized change

Reuse or extend the existing home first. When extraction is justified, move the common behaviour,
repoint only the callers in scope and remove copies made obsolete by that change. Preserve public
API and ABI compatibility unless a breaking change was requested.

For supported external callers that cannot migrate with this change, retain a small compatibility
adapter when needed; preserve its contract and follow the repo's deprecation policy.

For generated code, identify the owning schema, template or generator and whether the cause is
incorrect source or stale output. Correct the source when needed, then regenerate and verify
required outputs. Editing generated copies alone leaves the cause intact.

Keep bug fixing and refactoring proportionate. A bug report names a symptom, not a mandate for a
repository-wide consolidation. Fix an existing shared owner when there is one. Consolidate
all-same copies in the same change when that is small, safe and necessary to make the fix reach
behaviour that must remain identical. When consolidation would be a risky migration, correct
all affected in-scope callers with synchronized narrow fixes where necessary, and report the
remaining copies and reason. A broader refactor is not a prerequisite for shipping correctness.

After fixing a shared defect, check callers for compensating workarounds: offsets, extra rounding,
retries or exception handling added for that defect. Remove only compensation proven obsolete;
retain independently required behavior and verify that callers neither double-correct nor regress.

Do not merge whole tools merely because they share a primitive. Do not delete tests, exports or
domain behaviour just to make one home smaller. Leave unrelated duplication and neighbouring
cleanup out of the diff, and preserve other agents' work already present in the tree.

## 6. Verify behaviour, not just structure

Run the repo's existing applicable checks (build, typecheck, lint, tests) for the change. Test shared
logic at the lowest level that can pin its contract, and retain focused integration or caller
tests for wiring and caller-specific behaviour. One unit test at the home cannot prove that every
caller still works.

Cover materially different affected targets and configurations, including relevant boards,
operating systems, feature flags and platform adapters. Identify unavailable toolchains or
devices and the checks still needed; one successful build does not validate conditional paths.

Existing tests that pin moved behaviour should continue to pass, with mechanical import changes
where necessary. Add tests using the project's existing test conventions. Green structural
checks such as “one implementation exists” are insufficient: verify defaults, edge cases, errors,
compatibility and intentional differences.

Exercise the original user scenario end to end where practical. For a hot path or constrained
target, include the relevant performance or resource evidence. Report any manual verification or
unverified risk plainly.

Before handing off or integrating, recheck relevant shared integration state and touched files
for overlapping implementations or edits that appeared while you worked. Reconcile within the
repo's authorized workflow, preserving others' changes. This check does not authorize publication.

## Cost check

Judge the finished design by the costs it leaves behind:

- **change cost**: how many places must a future fix to this behaviour touch?
- **read cost**: how many files, hops and unrelated branches must a reader follow for one caller?
- **API cost**: how many options, exports and concepts must callers understand?
- **coupling cost**: which dependencies, domains, targets or lifetimes are now tied together?
- **runtime cost**: what changed in complexity, allocation, latency or resource use?
- **verification cost**: can each shared and caller-specific contract be tested directly?

Line counts and file counts are supporting evidence, not objectives. A small increase in lines
can be worthwhile for clarity or safety; deleting code can be a regression. Choose the design
with the lowest total cost for the behaviour actually needed today.

## Sweep and rebalance

For an explicit duplication or overengineering audit, or a request to simplify existing
overengineered code, read
[SWEEP-AND-REBALANCE.md](SWEEP-AND-REBALANCE.md). A sweep reports findings. A request to
deep-fix, simplify, optimize or rebalance overengineered code is an implementation request:
remove unnecessary abstraction and code, preserve behaviour, and verify the result rather than
stopping at recommendations.

Keep new and surviving entry points easy to find. Update existing module/API
documentation only when needed to explain ownership or intentional separation, and remove
obsolete wiring and references. This leaves the next agent evidence in the repository instead
of relying on private memory.

If a new shared layer would otherwise be hard to discover, add one pointer in existing
architecture or agent guidance. Name the layer, rather than maintaining a registry of helpers.

## Report

Keep the final report proportionate to the change. State what existing code was reused or why
new code stayed local; paths changed; caller-visible behaviour preserved or changed; tests and
other gates run; and relevant performance evidence. For a consolidation, also name the shared
behaviour, what deliberately stayed local, callers migrated and any copies left for follow-up.
Mention unrelated findings briefly without acting on them.
