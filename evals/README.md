# Evals

Checks for the `deep-fix` and `de-overkill` skills. They live outside `skills/` so the installer never links hidden tests or expected answers into an agent's skill folder.

| Suite | Evals | Skill | What it checks |
|---|---|---|---|
| `decision-cases.json` | 24 cases | both | judgment on reuse and restraint across UI, services, public APIs, native and embedded code; graded by reading the answers |
| `drawlab/` | 1 to 6 | deep-fix | reuse: a feature or bug fix that already exists on another page (fixtures `drawlab` for 1 to 3, `drawlab-ui` for 4, `drawlab-tools` for 5 and 6) |
| `balance/` | 7 to 9 | deep-fix | restraint: a one-line fix, a stateful guard and a one-caller reset stay with their caller |
| `balance/` | 10 | de-overkill | an overbuilt repo gets simpler while shared rules, tool identity and a public SDK export survive |

Requires Node 24 (the fixtures run TypeScript through type stripping, no install step) and Python 3.

## Run one eval

1. Copy the fixture to `<run>/outputs/app`, `git init` and commit it, and write `git rev-parse HEAD` to `<run>/base_sha`.
2. Write the eval's entry from `evals.json` (with its `assertions`) to `<run>/../eval_metadata.json`.
3. Give the agent the fixture, the eval's `prompt` and the skill file. Keep `hidden/`, `reference/` and the assertions away from it.
4. Grade:
   - evals 1 to 3: `python3 drawlab/grade.py <run> <id> drawlab/hidden/`
   - eval 4: `python3 drawlab/grade_ui.py <run> 4 drawlab/hidden/`
   - evals 5 and 6: `python3 drawlab/grade_tools.py <run> <id> drawlab/hidden/`
   - evals 7 to 10: `python3 balance/grade_balance.py <run> <id> balance/hidden/` (details in `balance/README.md`)

## Reading the scores

The `drawlab` graders were written for the 2026-09-10 skill. Some of their structure checks expect a written plan, a particular module layout or options on the shared code. Count their behaviour tests as pass or fail, and check the structure by hand: no new copy of existing logic, and nothing shared for a single caller. `balance/grade_balance.py` matches the current rules.

`skill-snapshots/` keeps earlier skill texts for A/B runs. They are named `SKILL.snapshot.md` so no tool loads them as skills.

## Results so far

- 2026-10-29, balanced deep-fix (`skill-snapshots/2026-10-29`): behaviour tests pass on evals 1 to 6 except eval 4. In evals 1, 4 and 5 the agent found the existing copies and still added a new one.
- 2026-10-29, `ponytail-audit` plus applying its findings, eval 10: 11 of 12. It missed the panels' local `toItem` wrappers.
- 2026-10-29, current skills, one Claude Opus run each:
  - eval 4: behaviour test fails. No new copies: the Line button and the last-saved header were lifted into shared code. The sketch button and the board date format kept their existing different look (tests pin them), so the pages still differ.
  - eval 5: 9 of 10. One shared chain with no options, and the track tool keeps its rules. The only failing check asks for a written plan file.
  - eval 7: 5 of 5.
  - eval 8: 4 of 5. The guard stayed in the schematic editor, but it unlocked on cancel instead of on the pointer's release.
  - eval 10 (de-overkill): 10 of 12 on the first run, which deleted the unused `clearance` setting. After the skill kept such settings, 12 of 12.
