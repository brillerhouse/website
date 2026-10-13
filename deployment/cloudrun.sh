#!/usr/bin/env bash
set -euo pipefail
# Run from the project root in Google Cloud Shell or an authenticated gcloud environment.
# PROJECT_ID must be explicit; credentials are supplied through gcloud's configured identity.
: "${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project ID}"
BRILLER_REGION="${BRILLER_REGION:-europe-west1}"
BRILLER_SERVICE="${BRILLER_SERVICE:-briller-website}"
BRILLER_REPOSITORY="${BRILLER_REPOSITORY:-briller-web}"
BRILLER_RUNTIME_SA="briller-web-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
if [[ ! "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
  echo 'Invalid Google Cloud project ID' >&2
  exit 1
fi
command -v gcloud >/dev/null
# gcloud run deploy --source builds using the repository Dockerfile.
# Account roles and organisation policy must be checked before executing these mutations.
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="$PROJECT_ID"
if ! gcloud iam service-accounts list --project="$PROJECT_ID" --filter="email=$BRILLER_RUNTIME_SA" --format='value(email)' | grep -q .; then
  gcloud iam service-accounts create briller-web-runtime --project="$PROJECT_ID" --display-name='Briller static website runtime'
fi
# Runtime identity needs no application IAM roles: Nginx only serves static files.
gcloud run deploy "$BRILLER_SERVICE" \
  --project="$PROJECT_ID" \
  --region="$BRILLER_REGION" \
  --source=. \
  --port=8080 \
  --service-account="$BRILLER_RUNTIME_SA" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=1 \
  --memory=256Mi \
  --cpu=1 \
  --concurrency=80 \
  --timeout=30 \
  --quiet
BRILLER_URL="$(gcloud run services describe "$BRILLER_SERVICE" --project="$PROJECT_ID" --region="$BRILLER_REGION" --format='value(status.url)')"
printf 'Website URL: %s/uk/\n' "$BRILLER_URL"
curl --fail --silent --show-error "$BRILLER_URL/uk/" -o /dev/null
