# Agent skills

Personal agent skills, kept in Git and shared across local coding tools.

## Included

- **deep-fix**: discover existing implementations, fix shared causes, and simplify overengineered code while preserving contracts and resource constraints.

The skill includes its sweep/rebalance guide and qualitative regression cases. The cases are decision checks, not proof of correctness for an application.

## Install globally on macOS or Linux

Authenticate GitHub CLI for access to this private repository, then:

```sh
gh repo clone ddeskov-limechain/skills "$HOME/Documents/skills"
cd "$HOME/Documents/skills"
./install.sh
```

The installer links two user-level locations to this checkout:

| Tool | Skill root |
|---|---|
| Codex, Kimi Code, OpenCode, Gemini CLI | `~/.agents/skills` |
| Claude Code | `~/.claude/skills` |

Existing conflicting entries are moved to a timestamped backup outside skill discovery folders. Repeated installation leaves correct links in place. The installer does not install agent applications or change their permissions. Reopen the agent or refresh its skills if needed.

## Update on another computer

```sh
git -C "$HOME/Documents/skills" pull --ff-only
```

The linked tools read the updated files from that checkout. Commit and push intentional skill edits from this repository using your normal review and publication rules.

## ChatGPT account skills

Local skill folders do not establish installation in ChatGPT web/mobile or a cloud workspace. Where account skill uploads are available, upload a ZIP containing `skills/deep-fix` as a `deep-fix` folder with `SKILL.md` at its top level. Account uploads are separate snapshots and need updating after later changes.

## Check the installer

```sh
python3 tests/test_install.py
```

The test uses a temporary installation root and does not modify real agent settings.
