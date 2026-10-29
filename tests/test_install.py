#!/usr/bin/env python3
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[1]
SOURCE = REPO / "skills/deep-fix"


class InstallerTests(unittest.TestCase):
    def test_conflicts_dangling_links_and_repeat_install(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            env = os.environ.copy()
            env.update(SKILLS_INSTALL_HOME=tmp)
            locations = []
            for name in ("deep-fix", "brief-ship", "orchestrated-build"):
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
            for name in ("deep-fix", "brief-ship", "orchestrated-build"):
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


if __name__ == "__main__":
    unittest.main()
