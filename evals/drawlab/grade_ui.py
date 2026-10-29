#!/usr/bin/env python3
"""grade_v3.py <run_dir> <eval_id> <hidden_dir> -> <run_dir>/grading.json  (fixture drawlab-v3, UI eval)"""
import json, re, shutil, subprocess, sys
from pathlib import Path
run = Path(sys.argv[1]); hidden = Path(sys.argv[3])
app = run / "outputs" / "app"; base = (run / "base_sha").read_text().strip()
A = json.loads((run.parent / "eval_metadata.json").read_text())["assertions"]
def sh(cmd, timeout=240):
    p = subprocess.run(cmd, cwd=app, shell=True, capture_output=True, text=True, timeout=timeout); return p.returncode, (p.stdout + p.stderr).strip()
def tail(s, n=12): return "\n".join(s.splitlines()[-n:])
_, diff = sh(f"git diff --name-status {base}"); _, untracked = sh("git ls-files --others --exclude-standard")
changed = {}
for ln in diff.splitlines():
    parts = ln.split("\t"); changed[parts[-1]] = parts[0][0]
for ln in untracked.splitlines():
    if ln.strip(): changed[ln.strip()] = "A"
src = [p for p in app.rglob("*.ts") if "node_modules" not in p.parts and "hidden-tests" not in p.parts]
code = [p for p in src if not p.name.endswith(".test.ts")]; tests = [p for p in src if p.name.endswith(".test.ts")]
rel = lambda p: str(p.relative_to(app))
def strip_comments(t): return re.sub(r"//[^\n]*", "", re.sub(r"/\*.*?\*/", "", t, flags=re.S))
def imports_of(p):
    seen, frontier = set(), [p]
    for _ in range(4):
        nxt = []
        for f in frontier:
            try: text = f.read_text()
            except Exception: continue
            for spec in re.findall(r"""from\s+['"](\.[^'"]+)['"]""", text):
                cand = (f.parent / spec).resolve()
                for c in (cand, cand.with_suffix(".ts") if cand.suffix != ".ts" else cand, cand / "index.ts"):
                    if c.is_file() and c not in seen: seen.add(c); nxt.append(c); break
        frontier = nxt
    return seen
pages = {p.parent.name: p for p in code if p.name.endswith("Page.ts") and "/pages/" in str(p)}
DATE = re.compile(r"getFullYear\(|toLocaleDateString|padStart\(2|Intl\.DateTimeFormat")
date_homes = [p for p in code if DATE.search(strip_comments(p.read_text()))]
action_homes = [p for p in code if re.search(r"""id:\s*['"]line['"]""", strip_comments(p.read_text()))]
outside = lambda hs: all("/pages/" not in f"/{rel(h)}" for h in hs)
results = []
def add(text, ok, ev): results.append({"text": text, "passed": bool(ok), "evidence": ev})
rc, out = sh("npm test"); add(A[0], rc == 0, tail(out))
d = app / "hidden-tests"; d.mkdir(exist_ok=True); shutil.copy(hidden / "ui-consistent.test.ts", d / "ui-consistent.test.ts")
rc2, out2 = sh('node --test "hidden-tests/ui-consistent.test.ts"'); shutil.rmtree(d, ignore_errors=True); add(A[1], rc2 == 0, tail(out2, 16))
add(A[2], len(date_homes) == 1, f"date-formatting implementations: {[rel(h) for h in date_homes]}")
add(A[3], len(date_homes) >= 1 and outside(date_homes), f"date homes: {[rel(h) for h in date_homes]}")
add(A[4], len(action_homes) == 1 and outside(action_homes), f"files defining the line action: {[rel(h) for h in action_homes]}")
def imports_home(n, hs): return n in pages and len(hs) == 1 and hs[0] in imports_of(pages[n])
sm = {n: {"formatter": imports_home(n, date_homes), "action": imports_home(n, action_homes)} for n in ("sketch", "board", "footprint")}
add(A[5], all(v["formatter"] and v["action"] for v in sm.values()), f"page imports: {sm}")
cov = [rel(t) for t in tests if len(date_homes) == 1 and date_homes[0] in imports_of(t)]
add(A[6], bool(cov), f"tests importing the formatter home: {cov}")
bad = sorted(f for f in changed if re.search(r"lineTool\.ts$|units\.ts$", f)); add(A[7], not bad, f"unrelated files changed: {bad or 'none'}; all changed: {sorted(changed)}")
passed = sum(r["passed"] for r in results)
(run / "grading.json").write_text(json.dumps({"expectations": results, "summary": {"passed": passed, "failed": len(results) - passed, "total": len(results), "pass_rate": round(passed / len(results), 3)}, "execution_metrics": {"changed_files": sorted(changed)}}, indent=2))
print(f"{run.parent.name}/{run.name}: {passed}/{len(results)}")
for r in results: print(("  PASS " if r["passed"] else "  FAIL ") + r["text"])
