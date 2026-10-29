# Agent skills

Personal agent skills, kept in Git and shared across local coding tools.

## Included

- **deep-fix**: before any change that adds or changes behaviour, find the code that already does it, reuse it, share a rule once a second caller needs it, and keep one-caller code local. For codebases that several agents work on without shared memory.
- **de-overkill**: bring overengineered code back to direct code without changing behaviour. Proves who calls what before removing one-caller shared modules, option bags, single-implementation factories, forwarding wrappers and dead config.
- **brief-ship**: autonomous builder mode that delivers value first, completes the shipping cycle, and reports briefly.
- **orchestrated-build**: delegate planning and coding to agents one step at a time, with a dependency ledger and file-based specifications.

Evals for deep-fix and de-overkill live in [`evals/`](evals/README.md), outside `skills/`, so the installer never links them into an agent's skill folder.

To switch deep-fix on for every agent session in a repository, add this line to the repository's `CLAUDE.md` (or `AGENTS.md`):

> Before any change that adds or changes behaviour, follow the deep-fix skill: find existing code first, share it when a second caller needs the same rule, and keep one-caller code local.

## Install globally on macOS or Linux

```sh
git clone https://github.com/Deltatronix/skills.git "$HOME/Documents/skills"
cd "$HOME/Documents/skills"
./install.sh
```

The installer links each skill into two user-level locations from this checkout:

| Tool | Skill root |
|---|---|
| Codex, Kimi Code, OpenCode, Gemini CLI | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |

If Codex is installed, the installer also sets `project_doc_fallback_filenames = ["CLAUDE.md"]` in `~/.codex/config.toml`, so Codex reads a repository's `CLAUDE.md` when it has no `AGENTS.md`. It leaves an existing setting or a symlinked config alone.

Existing conflicting entries are moved to a timestamped backup outside skill discovery folders. Repeated installation leaves correct links in place. The installer does not install agent applications or change their permissions. Reopen the agent or refresh its skills if needed.

## Update on another computer

```sh
git -C "$HOME/Documents/skills" pull --ff-only
"$HOME/Documents/skills/install.sh"
```

The linked tools read the updated files from that checkout. Running the installer again links skills that the pull added and applies new settings. Commit and push intentional skill edits from this repository using your normal review and publication rules.

## ChatGPT account skills

Local skill folders do not establish installation in ChatGPT web/mobile or a cloud workspace. Where account skill uploads are available, upload a ZIP for each skill (for example `skills/deep-fix` as a `deep-fix` folder with `SKILL.md` at its top level). Account uploads are separate snapshots and need updating after later changes.

## Check the installer

```sh
python3 tests/test_install.py
```

The test uses a temporary installation root and does not modify real agent settings.
