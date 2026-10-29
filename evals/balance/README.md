# deep-fix balance evals 7–10

Dependency-free TypeScript fixtures for restraint and rebalance. Requires Node 24
(type stripping) and Python 3 (stdlib only). No install step.

| Eval | Fixture | Task |
| --- | --- | --- |
| 7 | `fixtures/tally-cli` | Skip zero report totals with a local fix |
| 8 | `fixtures/editorlab` | Keep the schematic release guard local; retain multi-touch elsewhere |
| 9 | `fixtures/editorlab` | Reset device preferences in the settings pane |
| 10 | `fixtures/overbuilt` | Remove excess while retaining shared rules, tool identity and the SDK |

Give the agent only the fixture and its `evals.json` prompt. Keep `hidden/`, the
expected output, assertions and reference patches outside the agent's app copy.
Evals 8 and 9 each start from a fresh EditorLab copy. Each fixture runs:

```sh
npm test
```

The script is `node --test "src/**/*.test.ts"`; imports use explicit `.ts` suffixes.
All three pristine fixtures pass their existing tests.

## Run one eval

The orchestrator prepares `<run>/outputs/app` as an isolated git checkout of the
selected fixture and records its baseline commit hash in `<run>/base_sha` before
the agent works. Put the selected eval entry (including its complete `assertions`
array) in `<run>/../eval_metadata.json`. After the agent finishes, from this suite:

```sh
python3 grade_balance.py /path/to/run 7 hidden/
```

The grader runs `npm test`, copies only that eval's hidden test to a temporary
folder beside `src`, runs it with Node, and removes the folder. It writes
`<run>/grading.json` with `expectations`, `summary` and `execution_metrics`, and
prints PASS/FAIL per assertion in metadata order. A completed grading invocation
exits 0 even for failing assertions (as in the older suite); setup failures exit 2.
Test exit codes, including timeout code 124, are retained in the metrics/evidence.

Diffs are against `base_sha`, including committed changes, working-tree changes
and untracked files. Evals 7/9 cap gross added non-test `.ts` lines, not net growth.
Eval 8 compares shared-session line growth and its options fields. Eval 10 counts
physical production source lines (also counting any new JavaScript), and reports
`test_line_delta` without gating test additions or deletions. Structural checks
use source tokens, imports and the named outcomes, not a TypeScript compiler.

## Calibration without git

`reference/eval-<N>.patch` is the raw output of `diff -ruN base ref`, run inside
`.calib/eval-<N>/`, so file paths are relative to the fixture root after `-p1`.
Diff exit 1 means expected differences. The bad patches for 9 and 10 are also
relative to pristine baselines, not to their reference solutions.

Apply a patch in a fresh fixture copy with `patch -p1 < /path/to/reference.patch`.
On Apple's bundled patch 2.0, use `patch -p1 -E`: that version otherwise leaves
deleted files empty. Local patch round trips use `-E` to verify actual removals.
No git repository or commit was created during calibration. `.calib/` is removed.

Observed process exit codes:

| Eval | npm test base/ref | Hidden base/ref | Reference structural checks |
| --- | --- | --- | --- |
| 7 | 0 / 0 | 1 / 0 | No new source; 1 line added; add/export unchanged |
| 8 | 0 / 0 | 1 / 0 | Shared session +0 lines; no options field; board/symbol unchanged |
| 9 | 0 / 0 | 1 / 0 | Only settings code added; 4 production lines added |
| 10 | 0 / 0 | 0 / 0 | O1–O6 removed; K1–K3 retained; 374 → 298 source lines |

Eval 10's 76-line reference reduction calibrates the threshold to **38**. Its test
line delta is **−33**, reported only. Reading the reference confirms:

- O1: the unused compact option/branch is removed from SaveButton.
- O2: reset and its three keys move into SettingsPane; prefs modules are removed.
- O3: panels call railItemFor directly, without local toItem wrappers.
- O4: four callers use concrete JSON encode/decode functions; factory/interfaces are removed.
- O5: independent quantity/row checks are local; isPositive.ts is removed.
- O6: 32 segments belong to arc geometry; callers supply only an arc.
- O7: the home test and concise panel wiring tests remain; test size is not asserted.
- K1: the five price callers still import the one formatMoney implementation.
- K2: line and track retain separate modules over the shared polyline chain;
  net inheritance and clearance remain in the track tool.
- K3: the public SDK entry still exports parsePacket.

Bad 9 adds `src/lib/prefs/resetAll.ts` with injected storage/reload and fails only
the new-file boundary. Bad 10 duplicates formatMoney into five callers and fails
only K1. Both bad solutions pass npm and hidden behavior tests (exit 0 / 0).

Reproduce patch application, all behavior calibration and grader regression checks:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 hidden/test_grade_balance.py
```

The 17 unittest checks exercise every named structural outcome, reference/bad
patches, untracked-file accounting, test-line metrics and grading JSON output.
Git input is mocked for grader plumbing; live git-backed grading is left to the
orchestrator, as required by this job.
