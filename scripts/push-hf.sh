#!/usr/bin/env bash
# Push backend/ to HuggingFace Spaces as a clean root-level commit.
# Usage:  git push-hf          (via git alias)
#         ./scripts/push-hf.sh  (directly)
set -e

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
HF_REMOTE="${1:-hf-space}"
WORKTREE_DIR="$(mktemp -d)"

cleanup() { git -C "$REPO_ROOT" worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true; rm -rf "$WORKTREE_DIR"; }
trap cleanup EXIT

echo "→ Creating deploy worktree…"
git -C "$REPO_ROOT" worktree add --detach "$WORKTREE_DIR"

cd "$WORKTREE_DIR"
git branch -D hf-deploy 2>/dev/null || true
git checkout --orphan hf-deploy
git rm -rf . --quiet

echo "→ Copying backend/…"
cp -r "$REPO_ROOT/backend/." .

echo "→ Configuring Git LFS…"
git lfs install --local
git lfs track "model/*.keras"

echo "→ Staging…"
git add .
# Never commit secrets
git rm --cached .env 2>/dev/null || true
git rm --cached .DS_Store 2>/dev/null || true

COMMIT_MSG="deploy: $(git -C "$REPO_ROOT" log -1 --pretty='%h %s')"
git commit -m "$COMMIT_MSG" --quiet

echo "→ Pushing to $HF_REMOTE…"
git push "$HF_REMOTE" hf-deploy:main --force

echo "✓ Done — HuggingFace Space updated."
