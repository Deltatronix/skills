#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
skill_dir="$repo_dir/skills/deep-fix"
test -f "$skill_dir/SKILL.md"

# A separate root lets tests exercise backups without changing real agent settings.
install_root=${SKILLS_INSTALL_HOME:-$HOME}
backup_dir="$install_root/.local/share/agent-skills-backups/$(date -u +%Y%m%dT%H%M%SZ)-$$"

link_skill() {
    label=$1
    root=$2
    destination="$root/deep-fix"

    if [ "$destination" -ef "$skill_dir" ]; then
        printf '%s: already linked\n' "$label"
        return
    fi

    if [ -e "$destination" ] || [ -L "$destination" ]; then
        mkdir -p "$backup_dir"
        mv "$destination" "$backup_dir/$label-deep-fix"
        printf '%s: backed up to %s\n' "$label" "$backup_dir/$label-deep-fix"
    fi

    mkdir -p "$root"
    ln -s "$skill_dir" "$destination"
    printf '%s: linked %s\n' "$label" "$destination"
}

link_skill shared "$install_root/.agents/skills"
link_skill claude "$install_root/.claude/skills"
