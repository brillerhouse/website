# Briller website editing and review

Repository: brillerhouse/website. The user changed the workflow: edits in chat must be available for local review BEFORE Dev deployment. Default working branch is `preview`.

## Ordinary changes

1. Work on `preview`. Preserve `dev` and `main` unless the user explicitly requests deployment or a release.
2. Implement the requested change and run checks appropriate to it. Copy-only/style changes do not require new tests. Website build validation uses `BRILLER_PREVIEW=1 npm run build`, `npm run check` and `BRILLER_PREVIEW=1 npm test` when relevant.
3. Commit the reviewed source and run `bash scripts/publish-preview.sh`. This pushes `preview` only; it must not dispatch workflows or deploy Cloud Run.
4. Tell the user that the change is available on `preview`, give its commit, and remind them to run `git pull --ff-only` in their local preview checkout. Do not claim localhost or online Dev updated without verification.

## Deploying an approved preview

Only after the user explicitly approves the preview for deployment (for example, "deploy this version"), record the exact approved full commit SHA and run `bash scripts/promote-preview.sh <approved-sha>`. The script checks that local and remote preview match that SHA, fast-forwards `dev`, and uses the existing Dev publishing pipeline. Inspect the matching GitHub Actions run and report its actual deployment status and URL. A successful push or build is not a successful deployment.

If `dev` has advanced independently and a fast-forward is impossible, integrate it into `preview` and run the necessary checks. Reuse an existing approval only if the exact reviewed source remains unchanged; otherwise make the revised result available for review before deployment. Never force-push to resolve divergence.

Production remains separate and is updated when the user requests a release. Never upload private credentials; authentication uses the configured GitHub connection and Google Workload Identity Federation. Domain/DNS changes stay within the user's requested scope.

## Content and branding

Copy is in content/en.json and content/uk.json. Plans in content/plans.json are the single source for pricing. Gallery images and the hero kitchen illustration are explicitly illustrative. Legal policies remain drafts with noindex until the user supplies and confirms their content. Keep the warm Briller palette. The header logo is briller followed by an asterisk, and the hero eyebrow is YOUR SPACE. A NEW PERSPECTIVE with an asterisk (localized in Ukrainian).

Use **Briller** for the product/assistant in all user-facing copy. The user corrected the earlier name Brill. Internal component and CSS names may remain unchanged.
