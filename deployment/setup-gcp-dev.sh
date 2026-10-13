#!/usr/bin/env bash
# ONE-TIME setup. Run in Google Cloud Shell as a project administrator.
# No private keys are created. Prints only non-secret GitHub configuration.
set -euo pipefail
PROJECT_ID='nifty-atlas-473013-f9'
BRILLER_REGION='europe-west1'
BRILLER_REPO_ID='1416951704'
BRILLER_OWNER_ID='274613550'
BRILLER_POOL='briller-website-dev'
BRILLER_PROVIDER='github-dev'
BRILLER_DEPLOYER="briller-dev-deployer@$PROJECT_ID.iam.gserviceaccount.com"
BRILLER_RUNTIME="briller-web-runtime@$PROJECT_ID.iam.gserviceaccount.com"
command -v gcloud >/dev/null
# Newly created accounts and workload identity pools may not be visible to IAM yet.
# Retry only missing-resource/concurrent-update errors; permission failures stop immediately.
briller_retry_iam() {
  local briller_delay briller_error_file briller_exit_code=1
  briller_error_file="$(mktemp)"
  for briller_delay in 0 2 4 8 16 20 20; do
    if (( briller_delay > 0 )); then sleep "$briller_delay"; fi
    if "$@" >/dev/null 2>"$briller_error_file"; then
      rm -f "$briller_error_file"
      return 0
    else
      briller_exit_code=$?
    fi
    if ! grep -Eqi 'does not exist|not found|concurrent.*(change|update)|ABORTED' "$briller_error_file"; then
      cat "$briller_error_file" >&2
      rm -f "$briller_error_file"
      return "$briller_exit_code"
    fi
    printf 'Waiting for Google IAM propagation; retrying the same operation...\n' >&2
  done
  cat "$briller_error_file" >&2
  rm -f "$briller_error_file"
  return "$briller_exit_code"
}
BRILLER_BILLING="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)')"
if [[ "${BRILLER_BILLING,,}" != 'true' ]]; then
  echo 'Billing is not enabled. Enable Billing for this project first.' >&2
  exit 1
fi
BRILLER_PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
[[ "$BRILLER_PROJECT_NUMBER" =~ ^[0-9]+$ ]]
gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project="$PROJECT_ID"
BRILLER_REPOSITORIES="$(gcloud artifacts repositories list --project="$PROJECT_ID" --location="$BRILLER_REGION" --format='value(name)')"
if ! grep -Eq '(^|/)briller-web$' <<< "$BRILLER_REPOSITORIES"; then
  gcloud artifacts repositories create briller-web --project="$PROJECT_ID" --location="$BRILLER_REGION" --repository-format=docker --description='Briller website images'
fi
BRILLER_ACCOUNTS="$(gcloud iam service-accounts list --project="$PROJECT_ID" --format='value(email)')"
if ! grep -Fxq "$BRILLER_RUNTIME" <<< "$BRILLER_ACCOUNTS"; then
  gcloud iam service-accounts create briller-web-runtime --project="$PROJECT_ID" --display-name='Briller static website runtime'
fi
if ! grep -Fxq "$BRILLER_DEPLOYER" <<< "$BRILLER_ACCOUNTS"; then
  gcloud iam service-accounts create briller-dev-deployer --project="$PROJECT_ID" --display-name='Briller GitHub Dev deployer'
fi
# The deployer manages Cloud Run; runtime has no application roles.
briller_retry_iam gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/run.admin --condition=None --quiet
briller_retry_iam gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/serviceusage.serviceUsageConsumer --condition=None --quiet
briller_retry_iam gcloud artifacts repositories add-iam-policy-binding briller-web --project="$PROJECT_ID" --location="$BRILLER_REGION" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/artifactregistry.writer --quiet
briller_retry_iam gcloud iam service-accounts add-iam-policy-binding "$BRILLER_RUNTIME" --project="$PROJECT_ID" --member="serviceAccount:$BRILLER_DEPLOYER" --role=roles/iam.serviceAccountUser --quiet
BRILLER_POOLS="$(gcloud iam workload-identity-pools list --project="$PROJECT_ID" --location=global --format='value(name)')"
if ! grep -q "/workloadIdentityPools/$BRILLER_POOL$" <<< "$BRILLER_POOLS"; then
  gcloud iam workload-identity-pools create "$BRILLER_POOL" --project="$PROJECT_ID" --location=global --display-name='Briller website Dev'
fi
BRILLER_PROVIDERS="$(gcloud iam workload-identity-pools providers list --project="$PROJECT_ID" --location=global --workload-identity-pool="$BRILLER_POOL" --format='value(name)')"
BRILLER_CONDITION="assertion.repository_id == '$BRILLER_REPO_ID' && assertion.repository_owner_id == '$BRILLER_OWNER_ID' && assertion.ref == 'refs/heads/dev'"
BRILLER_MAPPING='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id'
if grep -q "/providers/$BRILLER_PROVIDER$" <<< "$BRILLER_PROVIDERS"; then
  gcloud iam workload-identity-pools providers update-oidc "$BRILLER_PROVIDER" --project="$PROJECT_ID" --location=global --workload-identity-pool="$BRILLER_POOL" --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping="$BRILLER_MAPPING" --attribute-condition="$BRILLER_CONDITION"
else
  gcloud iam workload-identity-pools providers create-oidc "$BRILLER_PROVIDER" --project="$PROJECT_ID" --location=global --workload-identity-pool="$BRILLER_POOL" --issuer-uri='https://token.actions.githubusercontent.com' --attribute-mapping="$BRILLER_MAPPING" --attribute-condition="$BRILLER_CONDITION"
fi
BRILLER_PRINCIPAL="principalSet://iam.googleapis.com/projects/$BRILLER_PROJECT_NUMBER/locations/global/workloadIdentityPools/$BRILLER_POOL/attribute.repository_id/$BRILLER_REPO_ID"
briller_retry_iam gcloud iam service-accounts add-iam-policy-binding "$BRILLER_DEPLOYER" --project="$PROJECT_ID" --member="$BRILLER_PRINCIPAL" --role=roles/iam.workloadIdentityUser --quiet
printf '\nGoogle Cloud setup complete. These values are NOT secrets:\n'
printf 'GCP_WORKLOAD_IDENTITY_PROVIDER=projects/%s/locations/global/workloadIdentityPools/%s/providers/%s\n' "$BRILLER_PROJECT_NUMBER" "$BRILLER_POOL" "$BRILLER_PROVIDER"
printf 'GCP_DEPLOY_SERVICE_ACCOUNT=%s\n' "$BRILLER_DEPLOYER"
