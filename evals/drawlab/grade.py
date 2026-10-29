#!/usr/bin/env python3
"""grade_v2.py <run_dir> <eval_id> <hidden_dir> -> <run_dir>/grading.json  (fixture drawlab-v2)"""
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
IMPL = re.compile(r"closed\s*:\s*(?!boolean)\w+|\{\s*points\b[^}]{0,60}\bclosed\b[^}]{0,30}\}")
def polyline_impls(): return [p for p in code if IMPL.search(strip_comments(p.read_text())) and re.search(r"\.push\(", strip_comments(p.read_text()))]
def formatter_impls(): return [p for p in code if re.search(r"0\.0254|25\.4\b", strip_comments(p.read_text()))]
def page_named(p): return sorted(set(m.lower() for m in re.findall(r"\b(sketch|schematic|board|footprint)\w*", strip_comments(p.read_text()), flags=re.I)))
PAGE_MATH = re.compile(r"Math\.(?:hypot|sqrt|atan2|cos|sin)|\*\*\s*2|\bdistance\(|Math\.round\([^)]*/")
def math_in_pages(names):
    return {rel(pages[n]): PAGE_MATH.findall(strip_comments(pages[n].read_text()))[:6] for n in names if n in pages and PAGE_MATH.search(strip_comments(pages[n].read_text()))}
def same_module(names, homes): return {n: ([rel(h) for h in homes if h in imports_of(pages[n])] if n in pages else None) for n in names}
def run_hidden(name):
    d = app / "hidden-tests"; d.mkdir(exist_ok=True); shutil.copy(hidden / f"{name}.test.ts", d / f"{name}.test.ts")
    rc, out = sh(f'node --test "hidden-tests/{name}.test.ts"'); shutil.rmtree(d, ignore_errors=True); return rc == 0, tail(out, 14)
def test_covering(homes, pattern): return [rel(t) for t in tests if any(h in imports_of(t) for h in homes) and re.search(pattern, t.read_text(), flags=re.I)]
def untouched(patterns):
    bad = sorted(f for f in changed if any(re.search(pt, f) for pt in patterns)); return (not bad), bad
results = []
def add(text, ok, ev): results.append({"text": text, "passed": bool(ok), "evidence": ev})
rc, out = sh("npm test")
if eval_id in (1, 3):
    page_set = ["sketch", "schematic", "board"] if eval_id == 1 else ["sketch", "board", "footprint"]
    homes = polyline_impls(); hrel = [rel(h) for h in homes]
    add(A[0], rc == 0, tail(out))
    for i, hn in enumerate(["eval1-other-pages-unchanged", "eval1-schematic-snaps"] if eval_id == 1 else ["eval3-existing-pages-unchanged", "eval3-footprint-45deg"]):
        ok, ev = run_hidden(hn); add(A[1 + i], ok, ev)
    add(A[3], len(homes) == 1, f"polyline implementations found: {hrel}")
    sm = same_module(page_set, homes); add(A[4], len(homes) == 1 and all(sm[n] == hrel for n in page_set), f"page → imported home: {sm}")
    add(A[5], len(homes) >= 1 and all("/pages/" not in f"/{h}" for h in hrel), f"homes: {hrel}")
    pn = {rel(h): page_named(h) for h in homes}; add(A[6], len(homes) >= 1 and all(not v for v in pn.values()), f"page-named identifiers in home code: {pn}")
    mp = math_in_pages(page_set); add(A[7], not mp, f"geometry math in page modules: {mp or 'none'}")
    sk_impl = pages.get("sketch") in homes
    tt = app / "src/app/pages/board/trackTool.ts"; tt_impl = tt.exists() and tt in homes
    if eval_id == 1: add(A[8], not sk_impl, f"SketchPage.ts is an implementation: {sk_impl}")
    else: add(A[8], not sk_impl and not tt_impl, f"SketchPage.ts is an implementation: {sk_impl}; trackTool.ts exists: {tt.exists()}, is an implementation: {tt_impl}")
    cov = test_covering(homes, r"snap|clos" if eval_id == 1 else r"angle|45|deg|step"); add(A[9], bool(cov), f"tests importing the home that cover the option: {cov}")
    ok, bad = untouched([r"units\.ts$", r"FootprintPage"] if eval_id == 1 else [r"units\.ts$", r"SchematicPage"]); add(A[10], ok, f"unrelated files changed: {bad or 'none'}; all changed: {sorted(changed)}")
else:
    homes = formatter_impls(); hrel = [rel(h) for h in homes]
    add(A[0], rc == 0, tail(out))
    ok, ev = run_hidden("eval2-all-pages-fixed"); add(A[1], ok, ev)
    add(A[2], len(homes) == 1, f"formatter implementations found: {hrel}")
    sm = same_module(["sketch", "board", "footprint"], homes); add(A[3], len(homes) == 1 and all(sm[n] == hrel for n in sm), f"page → imported home: {sm}")
    add(A[4], len(homes) >= 1 and all("/pages/" not in f"/{h}" for h in hrel), f"homes: {hrel}")
    bu = app / "src/app/pages/board/units.ts"; sk = pages.get("sketch")
    add(A[5], (not bu.exists() or bu not in homes) and (sk not in homes), f"board/units.ts exists: {bu.exists()}, is an implementation: {bu.exists() and bu in homes}; SketchPage.ts inline conversion: {sk in homes}")
    cov = test_covering(homes, r"1002|25\.4508|toFixed|round|precision|artefact|artifact|float"); add(A[6], bool(cov), f"tests importing the home that cover rounding: {cov}")
    ok, bad = untouched([r"trackTool\.ts$", r"SchematicPage", r"svg\.ts$", r"geometry\.ts$"]); add(A[7], ok, f"unrelated files changed: {bad or 'none'}; all changed: {sorted(changed)}")
passed = sum(r["passed"] for r in results)
(run / "grading.json").write_text(json.dumps({"expectations": results, "summary": {"passed": passed, "failed": len(results) - passed, "total": len(results), "pass_rate": round(passed / len(results), 3)}, "execution_metrics": {"changed_files": sorted(changed)}}, indent=2))
print(f"{run.parent.name}/{run.name}: {passed}/{len(results)}")
for r in results: print(("  PASS " if r["passed"] else "  FAIL ") + r["text"])
