# Sweep and rebalance

Use this file for an explicit duplication or overengineering review. Apply the discovery,
bug-fix and cost checks from [SKILL.md](SKILL.md) in both directions: duplicated behaviour that
should change together, and abstraction that costs more than it saves.

- **Sweep**: investigate and report when the user asked for an audit or review. Change no code.
- **Rebalance**: when the user asked to deep-fix, simplify, optimize or rebalance overengineered
  code, implement the findings. Do not stop at a list of recommendations.

The target is the least production code that clearly provides the current behaviour, with direct
call paths, minimal configuration and sharing only where it pays. Preserve required behaviour
and public contracts. Aim to remove maintenance effort and unnecessary runtime work together.
For affected critical paths, measure the relevant budgets and investigate regressions; removing
layers or source lines alone is not proof of faster code. Preserve existing resource limits.

## 1. Establish the baseline

Define the requested scope: the whole codebase when explicitly requested, otherwise the named
feature, package or directory. Identify public, generated and external-consumer boundaries before
counting callers.

Run the relevant existing tests, build and representative performance checks before editing
where available. Record pre-existing failures separately. Use these baselines to distinguish a
rebalance from a behaviour change.

Map real caller flows and the behaviour each abstraction provides. Include options supplied
through configuration, serialization, dependency injection, reflection, build scripts and
external plugins; text searches for direct function calls do not see every caller.

Record the contracts that simplification must preserve: results, errors, ordering, cancellation,
ownership, cleanup, isolation and supported configuration. Include what wrappers or registries
actually do; a short forwarding body may still enforce a public or operational boundary.

Missing documentation is not permission to change observable behavior during a refactor.
When fusing loops, removing copies, or changing eager/lazy or async execution, check input
consumption, partial side effects, cleanup and error precedence. Preserve these for supported
inputs; separate an intentional behavior change from the rebalance.

## 2. Find concrete excess

Start from actual caller flows, shared modules and repeated problem areas. Look for code that
can be removed or made direct without changing behaviour:

| Signal | Rebalance action after checking every caller |
|---|---|
| an option, branch or generic parameter no supported configuration or public contract needs | delete it and collapse the now-constant path |
| every caller supplies the same invariant value | own it once in the implementation; keep deployment or device configuration explicit |
| an interface, factory, strategy or injection point has no useful isolation, public contract or test/plugin seam | use the concrete function or type directly |
| a helper has one caller and provides no useful isolation | inline it or move it beside that caller |
| a wrapper only forwards arguments, renames a call or adapts the same shape repeatedly | call the real implementation directly |
| a registry, event bus or plugin framework adds no needed lifecycle, ordering or extension behavior | replace it with the direct flow |
| caller-named flags switch between unrelated policies | return domain policy to the callers; retain only a genuinely shared primitive |
| a shared home contains disjoint behaviour for different callers | localize independent parts or split by real contract |
| several copies carry one rule that must change together | use one implementation and remove the obsolete copies |
| an abstraction repeats work, allocation, copying, serialization or lookups on a hot path | remove the demonstrated work while preserving the contract |
| several test harnesses pin the same shared rule | keep the shared-rule test and the caller tests that still pin wiring or distinct behaviour |

Also retain useful boundaries: a one-caller module can isolate hardware, IO, unsafe code,
concurrency or a complex domain rule. Public APIs, SDKs, plugins and hardware abstraction layers
can have consumers or implementations outside this repository. Generated code and compatibility
shims follow their own maintenance rules.

Use existing dead-code or duplicate-analysis tools and the history of suspected copies to locate
candidates when useful. Treat their output as evidence to inspect, not authority to delete;
avoid adding an analysis framework for a one-off cleanup.

Treat duplication and overengineering as separate evidence. Do not replace one oversized shared
framework with another, and do not merge distinct tools merely because their code looks similar.

Each removal needs a concrete reason: unused in supported configurations, duplicate responsibility,
or no useful behavior or boundary beyond the replacement. Keep legitimate seams and each caller's
state lifetime. A fixed registry can still own initialization, ordering or cleanup; establish
that the direct replacement preserves these before deleting it.

For caches, pools and specializations, establish the behavior and current cost before removing
them. Missing historical measurements are a reason to measure, not proof that the mechanism is
unnecessary. Resource reuse, identity or backpressure can be part of the contract.

## 3. Choose the smallest sufficient implementation

For each finding, write a compact working entry: paths, callers, behaviour to preserve, concrete
excess, replacement shape and proof. This can stay in the task or working notes; it need not
become a project document.

Prefer changes in this order:

1. delete unused branches, options and code;
2. remove pass-through hops and redundant data transformations;
3. inline or localize single-caller abstraction;
4. replace speculative generic machinery with the concrete operation;
5. share only the remaining behaviour that passes the bug-fix test;
6. improve measured hot-path work with simpler algorithms, fewer allocations or less IO.

Use this as a preference for concrete changes, not a requirement to perform every kind of
transformation. After removing a layer, inspect the path again: obsolete factories, options,
registrations and imports often disappear with it. Stop at a direct, cohesive implementation;
avoid recreating the framework under different names.

Keep changes task-sized and reviewable, but implement all safe findings within the requested
scope. Batch mechanical call-site updates instead of turning each tiny simplification into a
planning exercise. Defer only findings with unresolved external contracts, uncertain behaviour or
unacceptable regression risk, and state the evidence needed to finish them.

If the same duplication has repeatedly returned, consider a small rule in the repo's existing
lint or dependency checks that enforces the established boundary. Add it only when it is reliable
and cheaper to maintain than the recurring mistake; preserve intentional exceptions. Ordinary
reuse does not need a new rule or a registration entry for every helper.

## 4. Verify the whole result

Run the repo's existing applicable checks covering every changed caller. Exercise
representative end-to-end flows, including errors and intentional differences. Existing tests
may need mechanical import updates; behaviour-pinning tests remain unless their behaviour was
explicitly removed.

Compare against the baseline:

- non-test production lines and files in the rebalanced scope
- call hops, branches, options, exports and dependencies needed to follow one caller
- duplicated implementations removed and useful boundaries retained
- runtime, allocation, memory, binary size or other relevant constrained-target measurements

Compare equivalent builds and representative workloads. Where full target measurements are
unavailable, report the specific limit; host timings do not prove device deadlines or whole-app
speed. Keep caller/adapter checks as well as core tests so a correct replacement is actually used.

An overengineering rebalance should normally reduce production code and the number of concepts a
caller must understand. If either increases, justify it with a concrete retained contract,
improved clarity or measured runtime benefit; otherwise continue simplifying. Test-code size is
not a reason to remove useful coverage.

Remove unnecessary operations and concepts. Compressing formatting, hiding work in dense
expressions or moving it into a dependency does not count as simplification.

Done when the changed paths are direct and cohesive, remaining abstractions examined in scope
have a current reason to exist, all safe findings are implemented, and relevant verification
passes or pre-existing failures are accounted for. Reasons include real shared change semantics,
genuine variation, useful isolation, a public contract or a necessary test seam. Report the
actual coverage; a partial inspection cannot establish that the entire codebase is balanced.
Any deferred finding has a concrete blocker rather than a preference for preserving framework code.

## 5. Report

Summarize the net result, not every intermediate edit:

- production lines and files before → after
- options, branches, wrappers, interfaces and dependencies removed
- code inlined or localized, and genuine shared behaviour retained
- caller-visible behaviour and public contracts preserved
- tests, builds and end-to-end scenarios run
- performance or resource measurements before → after, or an explicit measurement limitation
- deferred findings with their concrete blockers
