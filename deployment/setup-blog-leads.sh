#!/usr/bin/env bash
# Run once in Google Cloud Shell as the project administrator.
# The key is entered privately here, never sent to GitHub or chat.
set +x
set -euo pipefail
BRILLER_PROJECT='nifty-atlas-473013-f9'
BRILLER_REGION='europe-west1'
BRILLER_SECRET='briller-blog-leads-brevo-api-key'
BRILLER_RUNTIME="briller-blog-leads-runtime@$BRILLER_PROJECT.iam.gserviceaccount.com"
BRILLER_DEPLOYER="briller-dev-deployer@$BRILLER_PROJECT.iam.gserviceaccount.com"
command -v gcloud >/dev/null
briller_retry_iam() {
  local briller_delay briller_errors briller_status=1
  briller_errors="$(mktemp)"
  for briller_delay in 0 2 4 8 16 20; do
    if (( briller_delay > 0 )); then sleep "$briller_delay"; fi
    if "$@" >/dev/null 2>"$briller_errors"; then rm -f "$briller_errors"; return 0; else briller_status=$?; fi
    if ! grep -Eqi 'does not exist|not found|concurrent.*(change|update)|ABORTED' "$briller_errors"; then cat "$briller_errors" >&2; rm -f "$briller_errors"; return "$briller_status"; fi
    printf 'Waiting for Google IAM propagation...\n' >&2
  done
  cat "$briller_errors" >&2; rm -f "$briller_errors"; return "$briller_status"
}
gcloud services enable secretmanager.googleapis.com run.googleapis.com artifactregistry.googleapis.com --project="$BRILLER_PROJECT" --quiet
BRILLER_ACCOUNTS="$(gcloud iam service-accounts list --project="$BRILLER_PROJECT" --filter="email:$BRILLER_RUNTIME" --format='value(email)')"
if ! grep -Fxq "$BRILLER_RUNTIME" <<< "$BRILLER_ACCOUNTS"; then
  gcloud iam service-accounts create briller-blog-leads-runtime --project="$BRILLER_PROJECT" --display-name='Briller resource email delivery' --quiet
fi
BRILLER_SECRETS="$(gcloud secrets list --project="$BRILLER_PROJECT" --filter="name:$BRILLER_SECRET" --format='value(name)')"
if ! grep -Eq "(^|/)$BRILLER_SECRET$" <<< "$BRILLER_SECRETS"; then
  gcloud secrets create "$BRILLER_SECRET" --project="$BRILLER_PROJECT" --replication-policy=user-managed --locations="$BRILLER_REGION" --quiet
fi
briller_retry_iam gcloud secrets add-iam-policy-binding "$BRILLER_SECRET" --project="$BRILLER_PROJECT" --member="serviceAccount:$BRILLER_RUNTIME" --role=roles/secretmanager.secretAccessor --quiet >/dev/null
briller_retry_iam gcloud secrets add-iam-policy-binding "$BRILLER_SECRET" --project="$BRILLER_PROJECT" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/secretmanager.viewer --quiet >/dev/null
briller_retry_iam gcloud iam service-accounts add-iam-policy-binding "$BRILLER_RUNTIME" --project="$BRILLER_PROJECT" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/iam.serviceAccountUser --quiet >/dev/null
BRILLER_VERSIONS="$(gcloud secrets versions list "$BRILLER_SECRET" --project="$BRILLER_PROJECT" --filter='state=ENABLED' --format='value(name)' --limit=1)"
if [[ -z "$BRILLER_VERSIONS" ]]; then
  read -r -s -p 'Paste the Brevo API key (hidden input): ' BRILLER_BREVO_KEY
  printf '\n'
  [[ -n "$BRILLER_BREVO_KEY" ]] || { echo 'No key entered; secret was not populated.' >&2; exit 1; }
  printf '%s' "$BRILLER_BREVO_KEY" | gcloud secrets versions add "$BRILLER_SECRET" --project="$BRILLER_PROJECT" --data-file=- --quiet
  unset BRILLER_BREVO_KEY
else
  printf 'An enabled secret version already exists; preserving it.\n'
fi
printf 'Ready: dedicated runtime, scoped deployment permissions and Brevo secret.\n'
