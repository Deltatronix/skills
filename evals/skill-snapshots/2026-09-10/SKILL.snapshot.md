---
name: deep-fix
description: Every capability in a web app has ONE home — one implementation, extended by options, called from every page — and every bug is fixed there so the fix reaches the whole app; presentation included (one formatter, one tool-button definition, one dialog component, one token per colour). Plans before coding: decides at which LAYER two things are the same (a shared primitive under two distinct tools keeps both tools) and inventories every behaviour so a merge loses nothing; trades time for quality, never the shortest diff. Use whenever you implement a feature, tool, behaviour or bug fix that already exists on another page, editor, canvas, route or component of the same app; a bug reported on one page has shared logic; the same thing looks or formats differently on two pages; you are about to copy a file, component, hook or format string between pages; a change would fold one tool into another; or the user says deep fix, core refactor, consolidate, share between pages, make it consistent or make it work everywhere.
---

# Deep fix

A web app is many pages calling a much smaller set of capabilities. A capability — a
drawing tool, a formatter, a picker, a hook, a tool button — has exactly one **home**: the
module that implements it. Pages are callers: they choose options, they never carry a
second copy. A copy with changes is a **fork**, and from the moment it exists every bug
fix lands in one of the two and the app drifts — in behaviour, and in what the user sees.
This skill exists for one sentence: *one fix on the line tool must reach the whole app.*

It has a second sentence, learned the hard way: *the trace tool must still be a trace
tool afterwards.* A consolidation that loses a behaviour is not a refactor; it is a
deleted feature with a tidy diff.

## Time for quality

This skill is slow on purpose. The apps it serves are built to last, so the measure of a
change here is the structure it leaves behind — one honest home, every caller on it,
every behaviour accounted for — never the size of the diff or the minutes it took. Rules
that ask for the shortest working diff ("fewest files", "no unrequested abstractions",
ponytail) govern how you write the code *inside* the plan below; they never pick the
design, shorten the reading, or skip the inventory. When the shortest diff and the
strongest structure disagree, the structure wins and the plan says why. Expect the plan
to take as long as the build; that is the trade, made deliberately.

## The bug-fix test — per behaviour, three verdicts

Two pieces of code are one capability when a bug fix in one ought to land in the other.
Run the test on each **behaviour** the code has, never on a file or a tool as a whole: a
file is a bag of behaviours, and they rarely all answer the same way.

| Verdict | Meaning | What to build |
|---|---|---|
| **all same** | every behaviour of A should get B's fixes, and the reverse | one home; the differences become options |
| **some same** | the shared behaviours are a **primitive** (geometry, hit-test, chain state machine, formatter core) that the tools sit on | the primitive gets one home in the shared layer; each tool keeps its own home and calls it |
| **none same** | they only look alike | leave apart; write the pair down so nobody re-flags it |

The home is drawn around the behaviours that pass the test, never around the files that
happen to hold them. "Some same" is the normal verdict for tools, and the one the eye
misses: two things that draw the same shape are not one thing.

The UI form of the test: if a designer changed this icon, label, date format or colour,
should every page change with it? Then it has one home.

### A tool is what the user does with it, not what it draws

A PCB trace tool and a graphic line tool both lay down polylines, click by click, with a
preview and a hit-test for selection. That polyline machinery is one primitive with one
home, and a fix to it must reach both. But the trace tool also inherits a net from the pad
it starts on, keeps clearance from foreign copper, carries a width and a layer, bends its
legs to 45°, drops vias, and refuses a leg that collides. None of that is a line-tool
option: a line tool that knows about nets is a fork hidden in one file, and a trace tool
rebuilt as "the line tool with flags" is the feature the user just lost. Extract the
primitive; leave both tools their homes. Folding one tool into another is never a
consolidation, whatever the two have in common.

### What the user sees has a home too

The rule covers presentation, not only logic:

- **Formatting** — one `formatDate` (one `formatMm`) in the shared layer; a page never
  builds the string inline. Two formats for one kind of value is drift, not choice. A page
  that needs another form asks by option (`formatDate(d, { style: 'compact' })`).
- **Actions and their controls** — a tool or command offered on several pages is one
  action definition (icon, label, shortcut, tooltip; an `actions.ts`) rendered by one
  shared control (`ToolButton`). A page that shows only the icon says so by option
  (`compact`); it never redefines the button.
- **Components** — a dialog, picker, panel, empty state or error message on more than one
  page is one component with props.
- **Tokens** — colours, spacing and type sizes come from the theme; a page-local hex or px
  value is a copy of a token.

## Plan before code

Steps 1–3 are the plan, and they are written down before any file changes: as the issue
or ticket where the repo works from issues, otherwise as a `PLAN.md` next to the checkout
that is never committed. The plan lives on paper because the failure this skill guards
against — a behaviour silently dropped in a merge — is invisible in a diff and obvious in
a table. The plan is complete when every section below is filled. A behaviour without a
destination means the merge does not happen in this form, and the plan says so instead of
the code pretending otherwise.

### 1. Find every copy

Search for the capability under every name it may carry: the noun (line, wire, segment,
polyline, stroke, track, trace, path), the verb (draw, snap, route), the UI label, the
shortcut, the file and hook names (`lineTool.ts`, `useLineTool`, `LineTool.tsx`), the
store slice, the event handlers. For anything the user sees, search by what they see as
well as by symbol: the label text, the icon name, the format pattern (`dd/mm`,
`toLocaleDateString`, `padStart(2`, `toFixed(`), the shortcut — that is what finds the
inline copies no symbol search reaches. Read every hit end to end: how its page invokes
it, what state it owns, what it renders, what its tests pin. Done when you can write one
of these sentences, with paths: "the capability lives in `<path>` and is called from
`<pages>`", "copies live in `<paths>`", or "no implementation exists — I searched
`<terms>`".

### 2. Inventory every behaviour

For each copy, list every behaviour it has — from the code, from its tests, from what the
UI shows, and from the reference the app mirrors (KiCad, a design system, a spec) — down
to the rules, defaults, constants and edge cases: the empty click, the repeated point,
cancel, Escape, the tolerance, the unit. Then give the bug-fix test's verdict per row and
a destination:

| Behaviour | Copy A (path) | Copy B (path) | Verdict | Destination |
|---|---|---|---|---|
| repeated-point drop | trackTool.ts | SketchPage.ts | same | primitive: `shared/polyline.ts` |
| 45° leg constraint | trackTool.ts | — | same (generic geometry, one caller today) | option `angleStep` on the primitive, default off |
| closing snap | — | (new, schematic) | same | option `snapClosed` on the primitive, default off |
| net inherited from the start pad | trackTool.ts | — | different | tool-local: stays in the track tool |

Destinations are exactly four: **primitive/home** (shared), **option** (named after the
behaviour, with its default), **tool-local** (stays with the tool that owns it), or
**delete** — only with a reason the reference or a test supports (dead code, or a bug the
reference disproves). The inventory is the whole point of the plan: what it lists gets
built and proven; what it misses gets lost. A row you cannot place stops the plan.

### 3. Draw the homes

- **Exists once** → that module is the home. Extend it in place.
- **Copies, all same** → merge first. The most complete copy becomes the home; every
  behaviour of the other copies becomes an option of it; callers are repointed; the copies
  are deleted; then add the new behaviour. Merging is part of this change — a "later"
  merge never happens. Where copies disagree on what the user sees (two date formats, two
  icons for one tool), pick the one the design system or the most-used page already has
  and state the choice as settled; the point is that the app has one.
- **Copies, some same** → the shared rows become a primitive with a home in the shared
  layer; each tool keeps its home, composes the primitive, and keeps its own rules. The
  line between the two: generic geometry and its parameters — a grid step, an angle
  step, a tolerance, a closing snap — belong to the primitive as named options with the
  number as the argument (`gridSize: 10`, `angleStep: 45`): the home owns the math, the
  caller owns the number, and the second page that needs the same snap copies nothing.
  The tool's domain rules — nets, clearance, layers, widths, what a click on a pad
  means — belong to the tool. The primitive knows nothing about the tools above it: no
  `pads`, no `net`, no page names.
- **Does not exist** → create it in the shared layer (wherever shared tools, hooks,
  components and utils already live; match the repo's convention), even though one page
  needs it today. The second page always comes.

The plan then names, with paths: the home(s); every option with its default; every caller
to repoint; every file to delete; the tests to fold and to add; one proof per inventory
row (an existing test, a new test, or a manual check handed to the user); and the risk —
what the user would see if the plan were wrong. A coder following it builds exactly that.

## Build

### 4. Extend by option

The new behaviour becomes a capability of the home that the caller selects:
- an option on the tool's config / props / constructor — `createPolyline({ snapClosed: 8 })`;
  a number where the variation is a parameter (`gridSize`, `angleStep`), so the math has
  one home and pages hold no geometry
- a strategy passed in, when the variation is a whole algorithm or a tool's own rule —
  `{ accept: keepsClearance }`
- a plugin, when the home already has a plugin seam.

Keep the home honest:
- **Default = today's behaviour.** Existing callers pass nothing and get exactly what they
  had; the page that asked opts in.
- **Options are named after behaviour, never after callers.** `snapClosed`, `angleStep`,
  `compact`, `style: 'short'`. A flag such as `isSchematic` or `mode: 'board'` is a fork
  hidden in one file: the home now knows about pages, and every new page needs a new
  branch in every function. A domain concept of one tool (`pads`, `net`) is the same fork
  in better clothes.
- **The variation lives in the home; the caller only chooses.** If a page needs thirty
  lines of its own logic around the primitive to get the behaviour, the option sits at the
  wrong level — push that logic into the home. A tool's own rules are not "logic around
  the primitive"; they are the tool, which is what the verdict in step 2 decided.
- **One entry point, one options type.** `LineToolV2` and `SnappingLineTool` are forks
  with better names.

### 5. Repoint every caller, delete every copy

Every page that had its own version imports the home. Delete the copies, fold their tests
into the home's tests, remove their exports. Done when a search for the old file and
symbol names — and for the old label text and format pattern — returns only the home.

### 6. Fix bugs at the home

A bug report names a page — a symptom. Step 1 finds where the behaviour lives — the cause
— and the fix lands there. Then check every caller against the fix: the page that
reported it and the pages that did not. Caller-specific behaviour is a new option
(step 4), never a patch or a guard at the call site. A bug fix gets the same plan,
shorter: the copies, the rows the fix touches, the callers it reaches.

### 7. Prove every row

The inventory is the checklist. Every row has its proof run: the callers that did not ask
for the change behave and look exactly as before (their tests run unchanged; where they
have none, write the test at the home or exercise the page); the caller that asked has
the new behaviour; the home's tests cover each option on and off — the home's test file
is the record of everything the capability can do. Green gates (typecheck, lint, tests)
are necessary and not sufficient: a suite that never pinned the clearance rule stays green
when the rule is gone. Any row you could only prove by hand goes into the report as a
manual check for the user.

## Sweep — when asked to check or clean up an app

Asked to check an app for double implementations or inconsistent UI, change nothing.
Inventory what each page offers (tools, actions, formatters, components), run step 1 for
each entry — including the label, icon and format-pattern searches — and give every pair
its verdict per behaviour. Report a ranked list: capability → the copies with paths → the
verdict and the layer it holds at → the differences the user can see → the proposed home,
options and callers. Rank by how many copies exist and how often they change (`git log`
on the files). Flag every finding whose "fix" would fold one tool into another tool: it
needs the full inventory before anyone touches it, and it is usually a "some same" in
disguise. A sweep is a plan, never a build; each item the user picks then becomes one
consolidation change through steps 1–7, with its own written plan.

## Scope

Consolidate the capability this change touches, not the app. A second, unrelated
duplication you notice goes into your report as one line; do not chase it. And this is
not "refactoring neighbouring code": the copy *is* the code you were asked to change, and
deleting it is the change.

Planning rather than coding? The spec carries the plan of steps 1–3 whole — the
inventory included — so a coder following it builds exactly that and cannot drop a row it
never saw.

## Shapes of a fork — recognise them in your own diff

| About to…                                                            | Do instead                                                       |
|----------------------------------------------------------------------|------------------------------------------------------------------|
| copy `pages/sketch/lineTool.ts` into `pages/schematic/` and edit     | move it to the shared layer, add the option, both pages import it |
| write `LineToolV2` / `SnappingLineTool` beside `LineTool`            | add `snapClosed` to `LineTool`                                   |
| fold the trace tool into the line tool because both draw polylines   | extract the polyline primitive; both tools keep their homes      |
| add `pads` / `net` / `clearance` options to a shared line tool       | those rules stay in the trace tool; the primitive stays ignorant |
| add `if (page === 'schematic')` inside shared code                   | add an option the schematic page sets                            |
| wrap the tool in a page component that redoes half its logic         | move that logic into the home behind an option                   |
| build a date string inline (`${d}/${m}/${y}`, `toLocaleDateString`)  | call the shared formatter; add an option if the form must differ |
| define the button again with another icon or label for the same tool | render the action's one definition through the shared control    |
| paste a hex colour or a px value                                     | use the token                                                    |
| patch the symptom in the page's handler                              | fix the home; the page is fixed for free                         |
| keep the old copy "for now" with a TODO                              | delete it in this change                                         |
| start coding with the inventory "in your head"                       | write the plan; the table is what catches the dropped row        |

## Report

Final message: where the plan is (issue or path); the home(s) with paths; options added
with defaults; callers repointed; files deleted; the inventory with each row's proof and
any row left as a manual check; what the user now sees the same everywhere (format, icon,
label) where that changed; gates run with results; any second duplication seen and left
alone.

## Example

The sketch page owns a pen; the board page owns a track tool with a 45° constraint, net
inheritance and a clearance rule. The schematic page needs a wire tool that closes the
shape when a click lands near the first vertex.

Verdicts: the chain (click / move / finish / cancel / preview, repeated-point drop) —
same for all three; the closing snap and the 45° step — same, as options; net and
clearance — tool-local to the track tool.

```ts
// shared/polyline.ts — the primitive's home
export interface PolylineOptions {
  /** Snap a click onto the first vertex when within this many px, closing the shape. Off by default. */
  snapClosed?: number;
  /** Constrain each leg to multiples of this angle in degrees. Off by default. */
  angleStep?: number;
}
export function createPolyline(options: PolylineOptions = {}) { /* the one chain */ }

// pages/sketch/SketchPage.ts        createPolyline({ gridSize: 10 })   // + undo: the pen's own
// pages/schematic/SchematicPage.ts  createPolyline({ snapClosed: 8 })  // opts in
// pages/board/trackTool.ts          createPolyline({ angleStep: 45 })  // + net, clearance: still the track tool
```

Next month's bug fix in `polyline.ts` reaches all three pages; next month's clearance fix
lands in the track tool and nowhere else. Both are the point. The same shape holds for the
button that starts a tool: `actions.line` — one icon, one label, one shortcut — rendered
by `ToolButton` on every page that offers it.
