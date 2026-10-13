#!/usr/bin/env bash
# Run only after the user approves this exact preview commit for Dev deployment.
# All publishing checks happen before advancing dev. Divergence never force-pushes.
set -euo pipefail
: "${1:?Usage: bash scripts/promote-preview.sh <approved-full-commit-sha>}"
BRILLER_APPROVED_SHA="$1"
[[ "$BRILLER_APPROVED_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'Supply the full reviewed commit SHA' >&2; exit 1; }
[[ "$(git branch --show-current)" == preview ]] || { echo 'Promote from preview only' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Working tree must be clean' >&2; exit 1; }
[[ "$(git rev-parse HEAD)" == "$BRILLER_APPROVED_SHA" ]] || { echo 'Preview contains changes beyond the approved commit' >&2; exit 1; }
git -c 'credential.helper=!gh auth git-credential' fetch origin dev preview
[[ "$(git rev-parse origin/preview)" == "$BRILLER_APPROVED_SHA" ]] || { echo 'Remote preview differs from the approved commit' >&2; exit 1; }
git merge-base --is-ancestor origin/dev "$BRILLER_APPROVED_SHA" || { echo 'Dev has diverged; integrate it into preview for review first' >&2; exit 1; }
# Restore the review branch after publishing or failure.
trap 'git switch preview >/dev/null 2>&1 || true' EXIT
git switch dev
git merge --ff-only origin/dev
git merge-base --is-ancestor HEAD "$BRILLER_APPROVED_SHA" || { echo 'Local dev contains changes outside the approved preview' >&2; exit 1; }
git merge --ff-only "$BRILLER_APPROVED_SHA"
[[ "$(git rev-parse HEAD)" == "$BRILLER_APPROVED_SHA" ]] || { echo 'Dev does not match the approved commit' >&2; exit 1; }
bash scripts/publish-dev.sh
