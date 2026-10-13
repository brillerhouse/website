#!/usr/bin/env bash
# Publish reviewable source only. Does not invoke CI or Google Cloud.
set -euo pipefail
BRILLER_BRANCH="$(git branch --show-current)"
[[ "$BRILLER_BRANCH" == preview ]] || { echo 'Publish preview from the preview branch only' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Commit changes before publishing preview' >&2; exit 1; }
git -c 'credential.helper=!gh auth git-credential' push --set-upstream origin preview
printf 'Preview source published: %s\nNo Cloud Run deployment was requested.\n' "$(git rev-parse HEAD)"
