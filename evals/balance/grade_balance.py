#!/usr/bin/env python3
"""grade_balance.py <run_dir> <eval_id> <hidden_dir> -> <run_dir>/grading.json.

Node 24 and Python stdlib only. Structural checks enforce the named outcomes;
behavior is checked separately through the fixture's app/SDK entries.
"""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path

# Reference removes 76 production lines; require about half, independently of tests.
MIN_REDUCTION = 38
HIDDEN = {
    7: 'eval7-report-skips-zero.test.ts',
    8: 'eval8-schematic-release-guard.test.ts',
    9: 'eval9-reset-preferences.test.ts',
    10: 'eval10-behaviour-unchanged.test.ts',
}
SOURCE_SUFFIXES = {'.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'}
IGNORED = {'.git', 'node_modules', '__pycache__', 'hidden-tests'}
TOKEN = re.compile(r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|=>|[^\s]''')
COMMENTS = re.compile(r'''("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|//[^\n]*|/\*.*?\*/''', re.S)


def strip_comments(text):
    return COMMENTS.sub(lambda m: m[1] if m[1] else re.sub(r'[^\n]', ' ', m[0]), text)


def is_test(path):
    p = Path(path)
    return bool(re.search(r'\.(?:test|spec)\.[cm]?[jt]sx?$', p.name)) or any(
        part in {'tests', '__tests__', 'hidden-tests'} or part.startswith('.balance-hidden-') for part in p.parts
    )


def is_source(path):
    return Path(path).suffix in SOURCE_SUFFIXES and not is_test(path)


def production(files):
    # Count physical source lines, including comments/blanks, even if an agent
    # moves TypeScript into JavaScript. Tests cannot pay for production reduction.
    return {p: text for p, text in files.items() if is_source(p)}


def lines(text):
    return len(text.splitlines())


def run_command(argv, cwd, timeout=240):
    try:
        p = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, (p.stdout + p.stderr).strip()
    except subprocess.TimeoutExpired as exc:
        def decoded(value):
            return value.decode(errors='replace') if isinstance(value, bytes) else (value or '')
        return 124, (decoded(exc.stdout) + decoded(exc.stderr) + '\nCommand timed out').strip()


def tail(text, count=18):
    return '\n'.join(text.splitlines()[-count:])


@dataclass
class Snapshot:
    before: dict
    after: dict
    changed: dict
    numstat: dict

    @classmethod
    def from_git(cls, app, base):
        def git(*args):
            rc, output = run_command(['git', *args], app)
            if rc:
                raise RuntimeError(f'git {args[0]} failed (exit {rc}): {tail(output)}')
            return output
        if not re.fullmatch(r'[0-9a-fA-F]{7,64}', base):
            raise ValueError('base_sha must contain a commit hash')
        names = git('ls-tree', '-r', '--name-only', '-z', base).split('\0')
        before = dict.fromkeys(p for p in names if p)
        # git output must retain exact whitespace for unchanged-file and line checks.
        for p in before:
            proc = subprocess.run(['git', 'show', f'{base}:{p}'], cwd=app, capture_output=True, timeout=240)
            if proc.returncode:
                raise RuntimeError(f'Cannot read baseline file {p} (exit {proc.returncode})')
            before[p] = proc.stdout.decode(errors='replace')
        after = {}
        for p in app.rglob('*'):
            rel = p.relative_to(app)
            if not p.is_file() or any(part in IGNORED or part.startswith('.balance-hidden-') for part in rel.parts):
                continue
            after[rel.as_posix()] = p.read_text(errors='replace')
        changed = {}
        records = git('diff', '--name-status', '--no-renames', '-z', base, '--').split('\0')
        for i in range(0, len(records) - 1, 2):
            changed[records[i + 1]] = records[i]
        numstat = {}
        for record in git('diff', '--numstat', '--no-renames', '-z', base, '--').split('\0'):
            if not record:
                continue
            added, deleted, p = record.split('\t', 2)
            if added != '-':
                numstat[p] = (int(added), int(deleted))
        for p in git('ls-files', '--others', '--exclude-standard', '-z').split('\0'):
            if p and p in after:
                changed[p] = 'A'
                numstat[p] = (lines(after[p]), 0)
        return cls(before, after, changed, numstat)

    def added_lines(self):
        return sum(a for p, (a, _) in self.numstat.items() if p.endswith('.ts') and not is_test(p))

    def new_files(self):
        return sorted(set(self.after) - set(self.before))

    def unchanged(self, paths):
        bad = [p for p in paths if p not in self.before or self.before.get(p) != self.after.get(p)]
        return not bad, f'changed or missing: {bad or "none"}'


def matching(tokens, start):
    pairs = {'(': ')', '{': '}', '[': ']'}
    stack = []
    for i in range(start, len(tokens)):
        token = tokens[i]
        if token in pairs:
            stack.append(pairs[token])
        elif token in pairs.values():
            if not stack or token != stack.pop():
                return None
            if not stack:
                return i
    return None


def parameter_lists(text):
    tokens = TOKEN.findall(strip_comments(text))
    result = []
    for i, token in enumerate(tokens):
        if i + 1 < len(tokens) and tokens[i + 1] == '=>' and re.fullmatch(r'[\w$]+', token):
            result.append([token])
        if token != '(':
            continue
        end = matching(tokens, i)
        if end is None:
            continue
        # Declarations (including a return type before the arrow) and arrow functions.
        prefix = tokens[max(0, i - 3):i]
        suffix = tokens[end + 1:end + 15]
        arrow = bool(suffix) and (suffix[0] == '=>' or (suffix[0] == ':' and '=>' in suffix and '{' not in suffix[:suffix.index('=>')]))
        declaration = 'function' in prefix
        if declaration or arrow:
            result.append(tokens[i + 1:end])
    return result


def call_arities(text, names):
    tokens = TOKEN.findall(strip_comments(text))
    result = []
    for i, token in enumerate(tokens[:-1]):
        if token not in names or tokens[i + 1] != '(' or (i and tokens[i - 1] == 'function'):
            continue
        end = matching(tokens, i + 1)
        if end is None:
            continue
        depth = 0
        commas = 0
        for part in tokens[i + 2:end]:
            if part in ('(', '{', '['): depth += 1
            elif part in (')', '}', ']'): depth -= 1
            elif part == ',' and depth == 0: commas += 1
        trailing_comma = tokens[end - 1] == ','
        result.append(0 if end == i + 2 else commas + 1 - trailing_comma)
    return result


def options_fields(text, source_texts=()):
    """Find the options type used by createDragSession; compare top-level properties."""
    text = strip_comments(text)
    signature = re.search(r'(?:function\s+createDragSession|\bcreateDragSession\s*=)\s*\(\s*\w+\s*:\s*([\w$]+|\{)', text)
    if not signature:
        return None
    pool = TOKEN.findall(strip_comments('\n'.join([text, *source_texts])))

    def object_fields(tokens):
        end = matching(tokens, 0)
        if end is None:
            return None
        fields, depth = set(), 0
        for i in range(1, end):
            token = tokens[i]
            if depth == 0 and token != 'readonly' and re.fullmatch(r'[\w$]+|"[^\"]+"|\x27[^\x27]+\x27', token):
                if tokens[i + 1] in (':', '?', '('):
                    fields.add(token.strip('\"\x27'))
            if depth == 0 and token == '[':
                fields.add('[index signature]')
            if token in ('(', '{', '['): depth += 1
            elif token in (')', '}', ']'): depth -= 1
        return fields

    def named_fields(name, seen):
        if name in seen:
            return None
        seen = seen | {name}
        for i in range(len(pool) - 2):
            if pool[i] not in ('interface', 'type') or pool[i + 1] != name:
                continue
            j = i + 2
            fields = set()
            if pool[i] == 'interface':
                if pool[j] == 'extends':
                    j += 1
                    while j < len(pool) and pool[j] != '{':
                        if pool[j] != ',':
                            inherited = named_fields(pool[j], seen)
                            if inherited is None: return None
                            fields.update(inherited)
                        j += 1
                if j >= len(pool) or pool[j] != '{': return None
                local = object_fields(pool[j:])
                return fields | local if local is not None else None
            if pool[j] != '=': return None
            j += 1
            while j < len(pool) and pool[j] != ';':
                if pool[j] == '{':
                    local = object_fields(pool[j:])
                    end = matching(pool, j)
                    if local is None or end is None: return None
                    fields.update(local)
                    j = end + 1
                elif pool[j] in ('&', '|', '(', ')'):
                    j += 1
                else:
                    inherited = named_fields(pool[j], seen)
                    if inherited is None: return None
                    fields.update(inherited)
                    j += 1
            return fields
        return None

    if signature[1] == '{':
        return object_fields(TOKEN.findall(text[signature.end() - 1:]))
    return named_fields(signature[1], set())


def import_edges(files):
    edges = {p: set() for p in files}
    from_pattern = re.compile(r'''\b(?:import|export)\s+(?:[^;'"`]*?\s+from\s*)?['"](\.[^'"]+)['"]''')
    for path, text in files.items():
        for spec in from_pattern.findall(strip_comments(text)):
            # Resolve syntactically; files may have moved and need not be on disk.
            parts = []
            for part in (Path(path).parent / spec).parts:
                if part == '..':
                    if parts: parts.pop()
                elif part != '.': parts.append(part)
            candidate = '/'.join(parts)
            candidates = [candidate, str(Path(candidate).with_suffix('.ts')), candidate + '/index.ts']
            edges[path].update(p for p in candidates if p in files)
    return edges


def reachable(edges, start):
    seen, pending = set(), list(edges.get(start, ()))
    while pending:
        p = pending.pop()
        if p not in seen:
            seen.add(p)
            pending.extend(edges.get(p, ()))
    return seen


def defines(text, symbol):
    return bool(re.search(r'\bfunction\s+' + re.escape(symbol) + r'\b|\b(?:const|let|var)\s+' + re.escape(symbol) + r'\b\s*(?::[^=;]+)?=', strip_comments(text)))


def exports_symbol(files, path, symbol, seen=None):
    seen = set() if seen is None else seen
    if path in seen or path not in files:
        return False
    seen.add(path)
    text = strip_comments(files[path])
    if re.search(r'\bexport\s+(?:(?:async|default)\s+)?(?:function|const|let|class)\s+' + re.escape(symbol) + r'\b', text):
        return True
    for block in re.findall(r'\bexport\s*\{([^}]+)\}', text):
        for item in block.split(','):
            names = item.strip().split()
            if names and names[0] != 'type' and names[-1] == symbol:
                return True
    if re.search(r'\bexport\s*\*\s*from', text):
        return any(exports_symbol(files, p, symbol, seen) for p in import_edges(files).get(path, ()))
    return False


def structural_checks(eval_id, snap):
    checks = []
    def add(ok, evidence):
        checks.append((bool(ok), str(evidence)))
    before, after = production(snap.before), production(snap.after)
    added = snap.added_lines()
    if eval_id == 7:
        new = [p for p in snap.new_files() if is_source(p)]
        add(not new, f'new non-test source files: {new}')
        add(added <= 15, f'non-test .ts lines added: {added} <= 15')
        add(*snap.unchanged(['src/commands/add.ts', 'src/commands/export.ts']))
    elif eval_id == 8:
        path = 'src/shared/dragSession.ts'
        growth = lines(after.get(path, '')) - lines(before.get(path, ''))
        add(path in after and growth <= 8, f'dragSession.ts line growth: {growth} <= 8; exists: {path in after}')
        old_fields = options_fields(before.get(path, ''), before.values())
        new_fields = options_fields(after.get(path, ''), after.values())
        add(old_fields is not None and new_fields is not None and new_fields <= old_fields,
            f'options fields before: {sorted(old_fields) if old_fields is not None else "unresolved"}; after: {sorted(new_fields) if new_fields is not None else "unresolved"}')
        add(*snap.unchanged(['src/editors/board/BoardEditor.ts', 'src/editors/symbol/SymbolEditor.ts']))
    elif eval_id == 9:
        new = [p for p in snap.new_files() if not is_test(p) and not p.startswith('src/settings/')]
        add(not new, f'new non-test files outside src/settings/: {new}')
        add(added <= 30, f'non-test .ts lines added: {added} <= 30')
    elif eval_id == 10:
        reduction = sum(map(lines, before.values())) - sum(map(lines, after.values()))
        add(reduction >= MIN_REDUCTION, f'production source line reduction: {reduction} >= {MIN_REDUCTION}')
        bodies = {p: strip_comments(text) for p, text in after.items()}
        button = 'src/ui/SaveButton.ts'
        add(not re.search(r'\bcompact\b', bodies.get(button, '')), 'O1: compact absent from SaveButton')
        injected = [p for p, text in bodies.items() if p.startswith('src/lib/prefs/') and any(
            any(re.search(r'storage|reload', token, re.I) for token in params) for params in parameter_lists(text))]
        add(not injected, f'O2: prefs modules with injected storage/reload parameters: {injected}')
        rail_exists = any(defines(text, 'railItemFor') for text in bodies.values())
        wrappers = []
        for p, text in bodies.items():
            if not re.search(r'\btoItem\b', text): continue
            names = {'railItemFor'}
            names.update(re.findall(r'\brailItemFor\s+as\s+(\w+)', text))
            for match in re.finditer(r'\b(?:const|let|function)\s+toItem\b(.*?)(?=\breturn\s*\{|\n\s*}\s*;|\Z)', text, re.S):
                if call_arities(match[1], names): wrappers.append(p)
        add(not rail_exists or not wrappers, f'O3: caller-local toItem wrappers around railItemFor: {wrappers}; helper exists: {rail_exists}')
        machinery = [p for p, text in bodies.items() if re.search(r'\b(?:SerializerFactory|createSerializerFactory)\b|\binterface\s+Serializer\b', text)]
        add(not machinery, f'O4: serializer factory/interface remnants: {machinery}')
        positives = [p for p in after if Path(p).name == 'isPositive.ts']
        add(not positives, f'O5: isPositive.ts remnants: {positives}')
        names = {'tessellateArc'}
        for text in bodies.values(): names.update(re.findall(r'\btessellateArc\s+as\s+(\w+)', text))
        supplied = {p: arities for p, text in bodies.items() if (arities := [n for n in call_arities(text, names) if n > 1])}
        add(not supplied, f'O6: caller-supplied arc segment arguments: {supplied}')
        edges = import_edges(after)
        homes = [p for p, text in bodies.items() if defines(text, 'formatMoney')]
        # Derive the five consumers from the baseline, rather than mandate their paths.
        caller_symbols = []
        for text in before.values():
            if re.search(r'\bimport\s*\{[^}]*\bformatMoney\b', text):
                caller_symbols.extend(re.findall(r'\bexport\s+(?:function|const)\s+(\w+)', strip_comments(text)))
        consumers = {}
        for symbol in caller_symbols:
            locations = [p for p, text in bodies.items() if defines(text, symbol)]
            consumers[symbol] = [p for p in locations if len(homes) == 1 and homes[0] in reachable(edges, p)]
        add(len(homes) == 1 and len(caller_symbols) == 5 and all(consumers.values()),
            f'K1: formatMoney implementations: {homes}; five consumers reaching the home: {consumers}')
        tracks = [p for p in after if exports_symbol(after, p, 'createTrackTool') and defines(after[p], 'createTrackTool')]
        line_homes = [p for p in after if exports_symbol(after, p, 'createLineTool') and defines(after[p], 'createLineTool')]
        primitives = []
        identity = []
        for track in tracks:
            if not re.search(r'\bnet\b', bodies[track], re.I) or not re.search(r'clearance', bodies[track], re.I): continue
            for line in line_homes:
                if line == track: continue
                shared = reachable(edges, track) & reachable(edges, line)
                candidates = [p for p in shared if all(re.search(r'\b' + word + r'\b', bodies[p]) for word in ['click', 'move', 'finish', 'cancel', 'preview']) and not re.search(r'\b(?:net\w*|clearance\w*)\b', bodies[p], re.I)]
                if candidates:
                    identity.append(track)
                    primitives.extend(candidates)
        add(bool(identity and primitives), f'K2: distinct track tool with net/clearance: {identity}; shared identity-free chain: {sorted(set(primitives))}')
        add(exports_symbol(after, 'src/index.ts', 'parsePacket'), 'K3: src/index.ts exports parsePacket (also exercised by hidden tests)')
    else:
        raise ValueError(f'Unsupported eval id: {eval_id}')
    return checks


def metrics(snap):
    tests = [(a, d) for p, (a, d) in snap.numstat.items() if p.endswith('.ts') and is_test(p)]
    return {
        'changed_files': sorted(snap.changed),
        'non_test_lines_added': snap.added_lines(),
        'production_lines_before': sum(map(lines, production(snap.before).values())),
        'production_lines_after': sum(map(lines, production(snap.after).values())),
        'test_lines_added': sum(a for a, _ in tests),
        'test_lines_deleted': sum(d for _, d in tests),
        'test_line_delta': sum(a - d for a, d in tests),
    }


def grade(run, eval_id, hidden):
    app = run / 'outputs' / 'app'
    assertions = json.loads((run.parent / 'eval_metadata.json').read_text())['assertions']
    snap = Snapshot.from_git(app, (run / 'base_sha').read_text().strip())
    checks = structural_checks(eval_id, snap)
    if len(assertions) != len(checks) + 2:
        raise ValueError('Assertion count does not match eval entry; use its complete assertions array')
    rc, output = run_command(['npm', 'test'], app)
    with tempfile.TemporaryDirectory(prefix='.balance-hidden-', dir=app) as temporary:
        target = Path(temporary) / HIDDEN[eval_id]
        shutil.copyfile(hidden / HIDDEN[eval_id], target)
        hidden_rc, hidden_output = run_command(['node', '--test', str(target)], app)
    results = [(rc == 0, f'exit {rc}\n{tail(output)}'), (hidden_rc == 0, f'exit {hidden_rc}\n{tail(hidden_output)}'), *checks]
    expectations = [{'text': text, 'passed': ok, 'evidence': evidence} for text, (ok, evidence) in zip(assertions, results)]
    passed = sum(row['passed'] for row in expectations)
    execution = metrics(snap)
    execution.update(npm_test_exit_code=rc, hidden_test_exit_code=hidden_rc)
    return {'expectations': expectations, 'summary': {'passed': passed, 'failed': len(results) - passed, 'total': len(results), 'pass_rate': round(passed / len(results), 3)}, 'execution_metrics': execution}


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 3:
        print(__doc__.split('\n')[0], file=sys.stderr)
        return 2
    run, eval_id, hidden = Path(argv[0]).resolve(), int(argv[1]), Path(argv[2]).resolve()
    try:
        result = grade(run, eval_id, hidden)
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
        result = {'expectations': [], 'summary': {'passed': 0, 'failed': 0, 'total': 0, 'pass_rate': 0}, 'execution_metrics': {}, 'error': str(exc)}
        (run / 'grading.json').write_text(json.dumps(result, indent=2) + '\n')
        print(f'FAIL grader setup: {exc}')
        return 2
    (run / 'grading.json').write_text(json.dumps(result, indent=2) + '\n')
    print(f'{run.parent.name}/{run.name}: {result["summary"]["passed"]}/{result["summary"]["total"]}')
    for row in result['expectations']:
        print(('  PASS ' if row['passed'] else '  FAIL ') + row['text'])
    return 0


if __name__ == '__main__':
    sys.exit(main())
