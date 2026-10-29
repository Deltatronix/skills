#!/bin/sh
set -eu

repo_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)

# A separate root lets tests exercise backups without changing real agent settings.
install_root=${SKILLS_INSTALL_HOME:-$HOME}
backup_dir="$install_root/.local/share/agent-skills-backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"

link_skill() {
    label=$1
    root=$2
    destination="$root/$skill_name"

    if [ "$destination" -ef "$skill_dir" ]; then
        printf '%s: already linked\n' "$label"
        return
    fi

    if [ -e "$destination" ] || [ -L "$destination" ]; then
        mkdir -p "$backup_dir"
        mv "$destination" "$backup_dir/$label-$skill_name"
        printf '%s: backed up to %s\n' "$label" "$backup_dir/$label-$skill_name"
    fi

    mkdir -p "$root"
    ln -s "$skill_dir" "$destination"
    printf '%s: linked %s\n' "$label" "$destination"
}

for skill_file in "$repo_dir"/skills/*/SKILL.md; do
    test -f "$skill_file" || continue
    skill_dir=${skill_file%/SKILL.md}
    skill_name=${skill_dir##*/}
    link_skill shared "$install_root/.agents/skills"
    link_skill claude "$install_root/.claude/skills"
done

# Codex reads only AGENTS.md by default; these repos keep their agent rules in CLAUDE.md.
codex_config="$install_root/.codex/config.toml"
fallback_line='project_doc_fallback_filenames = ["CLAUDE.md"]'
if [ -L "$codex_config" ]; then
    printf 'codex: config.toml is a symlink, add project_doc_fallback_filenames to its target yourself\n'
elif [ ! -d "$install_root/.codex" ]; then
    printf 'codex: not installed, skipped\n'
elif [ ! -e "$codex_config" ]; then
    printf '%s\n' "$fallback_line" > "$codex_config"
    printf 'codex: created config.toml with project_doc_fallback_filenames\n'
elif grep -q '^[[:blank:]]*project_doc_fallback_filenames' "$codex_config"; then
    printf 'codex: project_doc_fallback_filenames already set\n'
else
    mkdir -p "$backup_dir"
    cp -p "$codex_config" "$backup_dir/codex-config.toml"
    tmp_config="$codex_config.tmp.$$"
    # cp -p first so the rewrite keeps the file's permissions.
    cp -p "$codex_config" "$tmp_config"
    { printf '%s\n' "$fallback_line"; cat "$codex_config"; } > "$tmp_config"
    mv "$tmp_config" "$codex_config"
    printf 'codex: set project_doc_fallback_filenames\n'
fi
