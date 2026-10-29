#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "skills/deep-fix"
FALLBACK = b'project_doc_fallback_filenames = ["CLAUDE.md"]\n'


class InstallerTests(unittest.TestCase):
    def test_conflicts_dangling_links_and_repeat_install(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            env = os.environ.copy()
            env.update(SKILLS_INSTALL_HOME=tmp)
            locations = []
            for name in ("deep-fix", "brief-ship", "orchestrated-build", "de-overkill"):
                shared = root / ".agents/skills" / name
                claude = root / ".claude/skills" / name
                claude.mkdir(parents=True)
                (claude / "old.md").write_text(f"preserve {name} skill data")
                shared.parent.mkdir(parents=True, exist_ok=True)
                shared.symlink_to(claude)
                locations.extend((path, REPO / "skills" / name) for path in (shared, claude))
            subprocess.run(["sh", str(REPO / "install.sh")], env=env, check=True,
                           capture_output=True, text=True)
            for path, source in locations:
                self.assertTrue(path.is_symlink())
                self.assertEqual(path.resolve(), source)
            backups = list((root / ".local/share/agent-skills-backups").iterdir())
            self.assertEqual(len(backups), 1)
            for name in ("deep-fix", "brief-ship", "orchestrated-build", "de-overkill"):
                self.assertEqual((backups[0] / f"claude-{name}/old.md").read_text(),
                                 f"preserve {name} skill data")
                self.assertTrue((backups[0] / f"shared-{name}").is_symlink())
            subprocess.run(["sh", str(REPO / "install.sh")], env=env, check=True,
                           capture_output=True, text=True)
            self.assertEqual(list((root / ".local/share/agent-skills-backups").iterdir()),
                             backups)

    def test_dangling_link_and_existing_file_are_preserved(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            env = os.environ.copy()
            env.update(SKILLS_INSTALL_HOME=tmp)
            shared = root / ".agents/skills/deep-fix"
            shared.parent.mkdir(parents=True)
            shared.symlink_to(root / "missing")
            claude = root / ".claude/skills/deep-fix"
            claude.parent.mkdir(parents=True)
            claude.write_text("preserve existing file")
            subprocess.run(["sh", str(REPO / "install.sh")], env=env, check=True,
                           capture_output=True, text=True)
            self.assertEqual(shared.resolve(), SOURCE)
            self.assertEqual(claude.resolve(), SOURCE)
            backup = next((root / ".local/share/agent-skills-backups").iterdir())
            self.assertTrue((backup / "shared-deep-fix").is_symlink())
            self.assertEqual((backup / "claude-deep-fix").read_text(), "preserve existing file")


    def install(self, tmp):
        env = os.environ.copy()
        env.update(SKILLS_INSTALL_HOME=tmp)
        return subprocess.run(["sh", str(REPO / "install.sh")], env=env, check=True,
                              capture_output=True, text=True).stdout

    def test_codex_fallback_inserted_first_and_backed_up_once(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            config = root / ".codex/config.toml"
            config.parent.mkdir()
            original = b'model = "gpt"\napproval_policy = "never"\n\n[profiles.x]\nmodel = "o"\n'
            config.write_bytes(original)
            config.chmod(0o600)
            self.assertIn("codex: set project_doc_fallback_filenames", self.install(tmp))
            self.assertEqual(config.read_bytes(), FALLBACK + original)
            self.assertEqual(config.stat().st_mode & 0o777, 0o600)
            backups = list((root / ".local/share/agent-skills-backups").iterdir())
            self.assertEqual(len(backups), 1)
            self.assertEqual((backups[0] / "codex-config.toml").read_bytes(), original)
            self.assertIn("already set", self.install(tmp))
            self.assertEqual(config.read_bytes(), FALLBACK + original)
            self.assertEqual(list((root / ".local/share/agent-skills-backups").iterdir()),
                             backups)

    def test_codex_existing_fallback_is_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Path(tmp) / ".codex/config.toml"
            config.parent.mkdir()
            original = b'model = "gpt"\n  project_doc_fallback_filenames = ["AGENTS.md"]\n'
            config.write_bytes(original)
            self.assertIn("already set", self.install(tmp))
            self.assertEqual(config.read_bytes(), original)

    def test_codex_not_installed_is_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIn("codex: not installed, skipped", self.install(tmp))
            self.assertFalse((Path(tmp) / ".codex").exists())

    def test_codex_config_created_when_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / ".codex").mkdir()
            self.install(tmp)
            self.assertEqual((Path(tmp) / ".codex/config.toml").read_bytes(), FALLBACK)

    def test_codex_config_without_final_newline(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Path(tmp) / ".codex/config.toml"
            config.parent.mkdir()
            config.write_bytes(b'model = "gpt"')
            self.install(tmp)
            self.assertEqual(config.read_bytes(), FALLBACK + b'model = "gpt"')

    def test_codex_symlinked_config_is_left_alone(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "real.toml"
            target.write_bytes(b'model = "gpt"\n')
            config = root / ".codex/config.toml"
            config.parent.mkdir()
            config.symlink_to(target)
            self.assertIn("codex: config.toml is a symlink", self.install(tmp))
            self.assertTrue(config.is_symlink())
            self.assertEqual(target.read_bytes(), b'model = "gpt"\n')

    def test_codex_dangling_config_link_is_left_alone(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            config = root / ".codex/config.toml"
            config.parent.mkdir()
            config.symlink_to(root / "missing.toml")
            self.assertIn("codex: config.toml is a symlink", self.install(tmp))
            self.assertTrue(config.is_symlink())
            self.assertFalse((root / "missing.toml").exists())

if __name__ == "__main__":
    unittest.main()
