#!/usr/bin/env bash
# Called by the editing agent after committing a reviewed change to dev.
# Uses configured GitHub authentication, never a token embedded in a URL.
set -euo pipefail
BRILLER_BRANCH="$(git branch --show-current)"
[[ "$BRILLER_BRANCH" == dev ]] || { echo 'Publish from dev only' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Commit changes before publishing' >&2; exit 1; }
BRILLER_REPO='brillerhouse/website'
BRILLER_SHA="$(git rev-parse HEAD)"
git -c 'credential.helper=!gh auth git-credential' push origin dev
BRILLER_RUNS="$(gh run list --repo "$BRILLER_REPO" --branch dev --commit "$BRILLER_SHA" --workflow dev.yml --limit 1 --json databaseId --jq 'length')"
if [[ "$BRILLER_RUNS" == 0 ]]; then
  gh workflow run dev.yml --repo "$BRILLER_REPO" --ref dev
fi
printf 'Dev commit published: %s\nCI: https://github.com/%s/actions/workflows/dev.yml\n' "$BRILLER_SHA" "$BRILLER_REPO"
