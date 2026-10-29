#!/usr/bin/env python3
"""grade_tools.py <run_dir> <eval_id> <hidden_dir> -> <run_dir>/grading.json  (fixture drawlab-tools)"""
import json, re, shutil, subprocess, sys
from pathlib import Path
run = Path(sys.argv[1]); eval_id = int(sys.argv[2]); hidden = Path(sys.argv[3])
app = run / "outputs" / "app"; base = (run / "base_sha").read_text().strip()
meta = json.loads((run.parent / "eval_metadata.json").read_text()); A = meta["assertions"]
def sh(cmd, timeout=240):
    p = subprocess.run(cmd, cwd=app, shell=True, capture_output=True, text=True, timeout=timeout)
    return p.returncode, (p.stdout + p.stderr).strip()
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
def run_hidden(name):
    d = app / "hidden-tests"; d.mkdir(exist_ok=True); shutil.copy(hidden / f"{name}.test.ts", d / f"{name}.test.ts")
    rc, out = sh(f'node --test "hidden-tests/{name}.test.ts"'); shutil.rmtree(d, ignore_errors=True); return rc == 0, tail(out, 14)
def test_covering(homes, pattern): return [rel(t) for t in tests if any(h in imports_of(t) for h in homes) and re.search(pattern, t.read_text(), flags=re.I)]
def untouched(patterns):
    bad = sorted(f for f in changed if any(re.search(pt, f) for pt in patterns)); return (not bad), bad
# --- drawlab-tools: two drawing tools sharing a chain primitive, each keeping its own identity
IDENTITY = re.compile(r"\b(net|nets|pad|pads|clearance|layer|layers|width|copper|track|tracks)\b", re.I)
PAGE_NAMES = re.compile(r"\b(sketch|schematic|board|footprint)\w*", re.I)
SEG = re.compile(r"Math\.max\(\s*0\s*,\s*Math\.min\(\s*1|Math\.min\(\s*1\s*,\s*Math\.max\(\s*0")
srcs = [p for p in code if "src" in p.parts]
def body(p):
    try: return strip_comments(p.read_text())
    except Exception: return ""
def shared(p): return "/pages/" not in f"/{rel(p)}"
def track_tool():
    tt = app / "src/app/pages/board/trackTool.ts"
    if tt.exists() and "createTrackTool" in body(tt): return tt
    for p in sorted(srcs):
        if "export function createTrackTool" in body(p): return p
    return None
TOOL = track_tool(); SKETCH = pages.get("sketch")
TOOL_IMPORTS = imports_of(TOOL) if TOOL else set(); SKETCH_IMPORTS = imports_of(SKETCH) if SKETCH else set()
SHARED_HOMES = [p for p in srcs if shared(p) and re.search(r"\bpreview\b", body(p)) and p in SKETCH_IMPORTS and p in TOOL_IMPORTS]
SEG_IMPLS = [p for p in srcs if SEG.search(body(p))]
def tool_home():
    if TOOL is None: return False, "no module exporting createTrackTool exists"
    t = body(TOOL); exported = bool(re.search(r"export\s+(?:function|const)\s+createTrackTool", t))
    net = bool(re.search(r"\bnet\b", t, flags=re.I)); clr = bool(re.search(r"clearance", t, flags=re.I))
    return exported and net and clr, f"{rel(TOOL)}: exports createTrackTool: {exported}, net: {net}, clearance: {clr}"
def plan_home():
    f = run / "outputs" / "PLAN.md"
    if not f.exists(): return False, "outputs/PLAN.md missing"
    t = f.read_text(); rows = [ln for ln in t.splitlines() if ln.lstrip().startswith("|") and ln.count("|") >= 3]
    beh = bool(re.search(r"\b(behaviou?r)\b", t, flags=re.I))
    return len(rows) >= 6 and beh, f"{f}: {len(rows)} table rows, behaviour named: {beh}"
results = []
def add(text, ok, ev): results.append({"text": text, "passed": bool(ok), "evidence": ev})
rc, out = sh("npm test")
if eval_id == 5:
    hrel = [rel(h) for h in SHARED_HOMES]
    add(A[0], rc == 0, tail(out))
    for i, hn in enumerate(["eval5-sketch-board-unchanged", "eval5-schematic-wire"]):
        ok, ev = run_hidden(hn); add(A[1 + i], ok, ev)
    add(A[3], len(SHARED_HOMES) == 1, f"shared drawing-chain homes reached by the sketch page and the track tool: {hrel}")
    leaked = {rel(h): sorted(set(m.lower() for m in IDENTITY.findall(body(h)) + PAGE_NAMES.findall(body(h)))) for h in SHARED_HOMES}
    add(A[4], len(SHARED_HOMES) >= 1 and all(not v for v in leaked.values()), f"identity/page words in the shared home: {leaked or 'no home'}")
    ok, ev = tool_home(); add(A[5], ok, ev)
    sp = pages.get("schematic")
    sp_ok = len(SHARED_HOMES) >= 1 and sp is not None and all(h in imports_of(sp) for h in SHARED_HOMES)
    add(A[6], sp_ok, f"SchematicPage.ts: {rel(sp) if sp else 'missing'}; imports the shared home: {sp_ok}; homes: {hrel}")
    cov = test_covering(SHARED_HOMES, r"snap|clos"); add(A[7], bool(cov), f"tests importing the home that cover the closing snap: {cov}")
    ok, ev = plan_home(); add(A[8], ok, ev)
    ok, bad = untouched([r"units\.ts$", r"FootprintPage"]); add(A[9], ok, f"unrelated files changed: {bad or 'none'}; all changed: {sorted(changed)}")
else:
    srel = [rel(s) for s in SEG_IMPLS]
    add(A[0], rc == 0, tail(out))
    ok, ev = run_hidden("eval6-sketch-hit-fixed"); add(A[1], ok, ev)
    add(A[2], len(SEG_IMPLS) == 1 and shared(SEG_IMPLS[0]), f"point-to-segment implementations found: {srel}")
    both = [rel(s) for s in SEG_IMPLS if s in SKETCH_IMPORTS and s in TOOL_IMPORTS]
    add(A[3], bool(both), f"segment homes reached by both the sketch page and the track tool: {both}; all: {srel}")
    ok, ev = tool_home(); add(A[4], ok, ev)
    cov = test_covering(SEG_IMPLS, r"segment|middle|mid|along"); add(A[5], bool(cov), f"tests importing the home that cover a hit between vertices: {cov}")
    ok, ev = plan_home(); add(A[6], ok, ev)
    ok, bad = untouched([r"units\.ts$", r"SchematicPage", r"FootprintPage", r"BoardPage\.ts$"]); add(A[7], ok, f"unrelated files changed: {bad or 'none'}; all changed: {sorted(changed)}")
passed = sum(r["passed"] for r in results)
(run / "grading.json").write_text(json.dumps({"expectations": results, "summary": {"passed": passed, "failed": len(results) - passed, "total": len(results), "pass_rate": round(passed / len(results), 3)}, "execution_metrics": {"changed_files": sorted(changed)}}, indent=2))
print(f"{run.parent.name}/{run.name}: {passed}/{len(results)}")
for r in results: print(("  PASS " if r["passed"] else "  FAIL ") + r["text"])
