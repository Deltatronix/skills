#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

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
