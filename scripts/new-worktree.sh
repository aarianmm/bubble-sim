#!/usr/bin/env bash
# scripts/new-worktree.sh <name> <branch>
# Creates .worktrees/<name> on <branch> off mvp, sharing the root node_modules.
set -euo pipefail
name="$1"; branch="$2"
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
git worktree add -q ".worktrees/$name" -b "$branch" mvp
ln -s ../../node_modules ".worktrees/$name/node_modules"
echo "$root/.worktrees/$name"
