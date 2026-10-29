"""Grader regression checks and patch round trips; no git repositories are created."""
import contextlib
import difflib
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import grade_balance as grader


def read_tree(root):
    return {p.relative_to(root).as_posix(): p.read_text() for p in root.rglob('*') if p.is_file()}


def snapshot(before, after):
    changed, numstat = {}, {}
    for path in before.keys() | after.keys():
        old, new = before.get(path, ''), after.get(path, '')
        if old == new:
            continue
        changed[path] = 'A' if path not in before else 'D' if path not in after else 'M'
        added = deleted = 0
        for tag, i, j, a, b in difflib.SequenceMatcher(None, old.splitlines(), new.splitlines(), autojunk=False).get_opcodes():
            if tag in ('insert', 'replace'): added += b - a
            if tag in ('delete', 'replace'): deleted += j - i
        numstat[path] = (added, deleted)
    return grader.Snapshot(before, after, changed, numstat)


class BalanceGraderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix='.grader-check-', dir=ROOT)
        cls.base, cls.ref, cls.bad = {}, {}, {}
        fixtures = {7: 'tally-cli', 8: 'editorlab', 9: 'editorlab', 10: 'overbuilt'}
        for number, fixture in fixtures.items():
            cls.base[number] = read_tree(ROOT / 'fixtures' / fixture)
            shutil.copytree(ROOT / 'fixtures' / fixture, Path(cls.temporary.name) / f'{number}-base')
            for kind in ['ref', 'bad'] if number in (9, 10) else ['ref']:
                target = Path(cls.temporary.name) / f'{number}-{kind}'
                shutil.copytree(ROOT / 'fixtures' / fixture, target)
                suffix = '-bad' if kind == 'bad' else ''
                with (ROOT / 'reference' / f'eval-{number}{suffix}.patch').open() as source:
                    p = subprocess.run(['patch', '-p1', '-E'], cwd=target, stdin=source, capture_output=True, text=True)
                if p.returncode:
                    raise AssertionError(f'patch eval {number} {kind}: exit {p.returncode}: {p.stdout}{p.stderr}')
                (cls.ref if kind == 'ref' else cls.bad)[number] = read_tree(target)

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def checks(self, number, after):
        return grader.structural_checks(number, snapshot(self.base[number], after))

    def test_all_reference_outcomes_and_assertion_alignment(self):
        entries = json.loads((ROOT / 'evals.json').read_text())['evals']
        self.assertEqual([entry['id'] for entry in entries], [7, 8, 9, 10])
        for entry in entries:
            with self.subTest(eval=entry['id']):
                checks = self.checks(entry['id'], self.ref[entry['id']])
                self.assertEqual(len(entry['assertions']), len(checks) + 2)
                self.assertTrue(all(ok for ok, _ in checks), checks)

    def test_behaviour_calibration_without_git(self):
        for number in [7, 8, 9, 10]:
            for kind in ['base', 'ref', 'bad'] if number in (9, 10) else ['base', 'ref']:
                with self.subTest(eval=number, solution=kind):
                    app = Path(self.temporary.name) / f'{number}-{kind}'
                    p = subprocess.run(['npm', 'test'], cwd=app, capture_output=True, text=True, timeout=240)
                    npm_rc = p.returncode
                    self.assertEqual(npm_rc, 0, p.stdout + p.stderr)
                    target = app / 'hidden-tests'
                    target.mkdir()
                    hidden = grader.HIDDEN[number]
                    shutil.copyfile(ROOT / 'hidden' / hidden, target / hidden)
                    try:
                        p = subprocess.run(['node', '--test', 'hidden-tests/' + hidden], cwd=app, capture_output=True, text=True, timeout=240)
                        expected = 1 if kind == 'base' and number != 10 else 0
                        self.assertEqual(p.returncode, expected, p.stdout + p.stderr)
                        print(f'calibration eval {number} {kind}: npm exit {npm_rc}; hidden exit {p.returncode} (expected {expected})')
                    finally:
                        shutil.rmtree(target)

    def test_calibrated_reduction_and_test_delta(self):
        snap = snapshot(self.base[10], self.ref[10])
        metrics = grader.metrics(snap)
        self.assertEqual(metrics['production_lines_before'], 374)
        self.assertEqual(metrics['production_lines_after'], 298)
        self.assertEqual(grader.MIN_REDUCTION, 38)
        self.assertEqual(metrics['test_line_delta'], -33)
        self.assertEqual(metrics['test_lines_added'] - metrics['test_lines_deleted'], -33)

    def test_bad_solutions_fail_only_the_intended_named_check(self):
        for number, failed_index in [(9, 0), (10, 7)]:
            with self.subTest(eval=number):
                checks = self.checks(number, self.bad[number])
                self.assertEqual([i for i, (ok, _) in enumerate(checks) if not ok], [failed_index], checks)

    def test_every_removable_outcome_detects_its_baseline_remnant(self):
        remnants = {
            1: ['src/ui/SaveButton.ts'],
            2: ['src/lib/prefs/resetAll.ts', 'src/lib/prefs/deviceKeys.ts'],
            3: ['src/panels/LayersPanel.ts'],
            4: ['src/lib/serialize/types.ts'],
            5: ['src/lib/isPositive.ts'],
            6: ['src/canvas/arcPreview.ts'],
        }
        for index, paths in remnants.items():
            after = dict(self.ref[10])
            after.update({p: self.base[10][p] for p in paths})
            with self.subTest(outcome=f'O{index}'):
                self.assertFalse(self.checks(10, after)[index][0])

    def test_net_identity_cannot_move_into_shared_primitive(self):
        after = dict(self.ref[10])
        after['src/tools/polyline.ts'] += '\nconst clearance = 3;\n'
        self.assertFalse(self.checks(10, after)[8][0])
        after['src/tools/polyline.ts'] = self.ref[10]['src/tools/polyline.ts'] + '\n// net and clearance belong to the track, not here.\n'
        self.assertTrue(self.checks(10, after)[8][0], 'comments are not domain behavior')

    def test_folding_track_into_line_loses_the_separate_tool_boundary(self):
        after = dict(self.ref[10])
        after['src/tools/lineTool.ts'] += after.pop('src/tools/trackTool.ts').replace("import { createPolyline, type Point } from './polyline.ts';", '')
        self.assertFalse(self.checks(10, after)[8][0])

    def test_public_sdk_export_and_barrel_reexports(self):
        after = dict(self.ref[10])
        del after['src/index.ts']
        self.assertFalse(self.checks(10, after)[9][0])
        after['src/index.ts'] = "export * from './protocol/packet.ts';\n"
        self.assertTrue(self.checks(10, after)[9][0])

    def test_production_reduction_cannot_be_paid_with_test_deletions(self):
        after = {p: t for p, t in self.base[10].items() if not grader.is_test(p)}
        self.assertFalse(self.checks(10, after)[0][0])
        after = {p: t for p, t in self.ref[10].items() if not grader.is_test(p)}
        self.assertTrue(all(ok for ok, _ in self.checks(10, after)))
        self.assertLess(grader.metrics(snapshot(self.base[10], after))['test_line_delta'], -33)

    def test_eval7_new_source_line_cap_and_unchanged_commands(self):
        after = dict(self.ref[7])
        after['src/newHelper.ts'] = 'export const extra = true;\n'
        self.assertFalse(self.checks(7, after)[0][0])
        after = dict(self.ref[7])
        after['src/commands/report.test.ts'] += '// test\n' * 50
        self.assertTrue(all(ok for ok, _ in self.checks(7, after)))
        after['src/commands/report.ts'] += '// production\n' * 15
        self.assertFalse(self.checks(7, after)[1][0])
        after = dict(self.ref[7])
        after['src/commands/add.ts'] += '// changed\n'
        self.assertFalse(self.checks(7, after)[2][0])
        del after['src/commands/export.ts']
        self.assertFalse(self.checks(7, after)[2][0])

    def test_eval8_growth_options_and_untouched_editors(self):
        after = dict(self.ref[8])
        path = 'src/shared/dragSession.ts'
        after[path] += '// growth\n' * 8
        self.assertTrue(self.checks(8, after)[0][0])
        after[path] += '// growth\n'
        self.assertFalse(self.checks(8, after)[0][0])
        after[path] = self.ref[8][path].replace('export interface DragSessionOptions {', 'export interface DragSessionOptions {\n  singlePointer?: boolean;')
        self.assertFalse(self.checks(8, after)[1][0])
        for path in ['src/editors/board/BoardEditor.ts', 'src/editors/symbol/SymbolEditor.ts']:
            after = dict(self.ref[8])
            after[path] += '// changed\n'
            self.assertFalse(self.checks(8, after)[2][0])

    def test_options_type_may_move_or_use_an_arrow_but_may_not_gain_inherited_fields(self):
        after = dict(self.ref[8])
        path = 'src/shared/dragSession.ts'
        declaration = 'export interface DragSessionOptions {\n  onCommit: (drag: Drag) => void;\n}\n'
        after[path] = after[path].replace(declaration, "import type { DragSessionOptions } from './dragOptions.ts';\n")
        after['src/shared/dragOptions.ts'] = "import type { Drag } from './dragSession.ts';\n" + declaration
        self.assertTrue(self.checks(8, after)[1][0], 'moving a type is not a new options field')
        after[path] = after[path].replace('export function createDragSession(', 'export const createDragSession = (').replace('options: DragSessionOptions) {', 'options: DragSessionOptions) => {')
        self.assertTrue(self.checks(8, after)[1][0], 'arrow functions preserve the options contract')
        after['src/shared/dragOptions.ts'] = declaration.replace('interface DragSessionOptions {', 'interface Extra { guard?: boolean; }\nexport interface DragSessionOptions extends Extra {')
        self.assertFalse(self.checks(8, after)[1][0])

    def test_reduction_counts_javascript_source_as_well_as_typescript(self):
        after = dict(self.ref[10])
        after['src/moved.js'] = '// production line\n' * 40
        self.assertFalse(self.checks(10, after)[0][0])

    def test_eval9_local_files_and_gross_added_line_cap(self):
        after = dict(self.ref[9])
        after['src/settings/keys.ts'] = "export const keys = ['theme'];\n"
        self.assertTrue(self.checks(9, after)[0][0])
        after['src/lib/keys.ts'] = after.pop('src/settings/keys.ts')
        self.assertFalse(self.checks(9, after)[0][0])
        after = dict(self.ref[9])
        after['src/settings/SettingsPane.ts'] += '// added\n' * 27
        self.assertFalse(self.checks(9, after)[1][0])
        snap = snapshot(self.base[9], self.ref[9])
        snap.numstat['src/settings/SettingsPane.ts'] = (31, 100)
        self.assertFalse(grader.structural_checks(9, snap)[1][0], 'gross additions, not net growth')

    def test_arc_trailing_comma_is_not_an_extra_argument(self):
        after = dict(self.ref[10])
        after['src/canvas/arcPreview.ts'] = after['src/canvas/arcPreview.ts'].replace('tessellateArc(arc)', 'tessellateArc(arc,)')
        self.assertTrue(self.checks(10, after)[6][0])
        after['src/canvas/arcPreview.ts'] = after['src/canvas/arcPreview.ts'].replace('tessellateArc(arc,)', 'tessellateArc(arc, 32,)')
        self.assertFalse(self.checks(10, after)[6][0])

    def test_git_snapshot_counts_untracked_and_preserves_baseline_bytes(self):
        with tempfile.TemporaryDirectory(prefix='.git-input-', dir=ROOT) as temporary:
            app = Path(temporary)
            (app / 'src').mkdir()
            (app / 'src/a.ts').write_text('export const a = 2;\n')
            (app / 'src/new.ts').write_text('export const n = 1;\n\n')
            (app / 'src/a.test.ts').write_text('// test\n')
            baseline = '  export const a = 1;\n\n'
            def fake_run(argv, cwd, **kwargs):
                self.assertEqual(argv[:2], ['git', 'show'])
                return subprocess.CompletedProcess(argv, 0, stdout=baseline.encode(), stderr=b'')
            def fake_command(argv, cwd, timeout=240):
                outputs = {'ls-tree': 'src/a.ts\0', 'diff': ('M\0src/a.ts\0' if '--name-status' in argv else '1\t1\tsrc/a.ts\0'), 'ls-files': 'src/new.ts\0src/a.test.ts\0'}
                return 0, outputs[argv[1]]
            with patch.object(grader, 'run_command', side_effect=fake_command), patch.object(grader.subprocess, 'run', side_effect=fake_run):
                snap = grader.Snapshot.from_git(app, 'abc1234')
            self.assertEqual(snap.before['src/a.ts'], baseline)
            self.assertEqual(snap.changed, {'src/a.ts': 'M', 'src/new.ts': 'A', 'src/a.test.ts': 'A'})
            self.assertEqual(snap.added_lines(), 3)
            self.assertEqual(grader.metrics(snap)['test_line_delta'], 1)

    def test_grade_writes_the_older_suite_json_shape_and_cleans_hidden_copy(self):
        with tempfile.TemporaryDirectory(prefix='.run-check-', dir=ROOT) as temporary:
            parent = Path(temporary)
            run = parent / 'with_skill'
            app = run / 'outputs/app'
            shutil.copytree(ROOT / 'fixtures/tally-cli', app)
            (run / 'base_sha').write_text('abc1234\n')
            assertions = json.loads((ROOT / 'evals.json').read_text())['evals'][0]['assertions']
            (parent / 'eval_metadata.json').write_text(json.dumps({'assertions': assertions}))
            snap = snapshot(self.base[7], self.ref[7])
            with contextlib.redirect_stdout(io.StringIO()), patch.object(grader.Snapshot, 'from_git', return_value=snap), patch.object(grader, 'run_command', side_effect=[(0, 'npm green'), (1, 'hidden failed')]):
                rc = grader.main([str(run), '7', str(ROOT / 'hidden')])
            self.assertEqual(rc, 0, 'grading failures are scores, like the older suite')
            result = json.loads((run / 'grading.json').read_text())
            self.assertEqual(result['summary'], {'passed': 4, 'failed': 1, 'total': 5, 'pass_rate': 0.8})
            self.assertEqual(result['execution_metrics']['hidden_test_exit_code'], 1)
            self.assertEqual([row['text'] for row in result['expectations']], assertions)
            self.assertEqual(list(app.glob('.balance-hidden-*')), [])


if __name__ == '__main__':
    unittest.main(verbosity=2)
