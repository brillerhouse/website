# Briller website editing and publication

The user wants edits in chat to reach the online Dev environment without manual ZIP uploads. Repository: brillerhouse/website. Use branch `dev` for edits. Preserve `main` unless the user requests a release or setup changes there.

After implementing a user-authorized website change, run appropriate checks, commit the reviewed source and execute `bash scripts/publish-dev.sh`. This pushes the code and explicitly dispatches CI if no run exists for the commit. Inspect the matching GitHub Actions run and report its actual deployment status and URL. Do not claim that the Dev site changed merely because a commit or build succeeded. When Google Cloud identity references are empty, CI only exports artifacts and reports deployment pending.

Production is separate from Dev and is updated when the user requests release. Never upload private credentials; authentication uses the configured GitHub connection and Google Workload Identity Federation. Changes to domain/DNS require the user's requested scope.

Copy lives in content/en.json and content/uk.json. Plans in content/plans.json are the single source for pricing. Gallery images are marked illustrative. Legal policies remain drafts with noindex until the user supplies and confirms their content. Production build: npm run build. Preview build: BRILLER_PREVIEW=1 npm run build. Validation: npm run check and npm test after relevant source changes.
