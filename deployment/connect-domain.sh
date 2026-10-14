#!/usr/bin/env bash
# Only briller.house and www.briller.house; no app or email DNS changes.
set -euo pipefail
PROJECT_ID='nifty-atlas-473013-f9'
REGION='europe-west1'
SERVICE='briller-website'
command -v gcloud >/dev/null
BRILLER_MAPPING_DIR="$(mktemp -d)"
trap 'rm -rf "$BRILLER_MAPPING_DIR"' EXIT
gcloud beta run domain-mappings list --project="$PROJECT_ID" --region="$REGION" --format=json > "$BRILLER_MAPPING_DIR/existing.json"
for BRILLER_DOMAIN in briller.house www.briller.house; do
  BRILLER_TARGET="$(python3 - "$BRILLER_MAPPING_DIR/existing.json" "$BRILLER_DOMAIN" <<'PY'
import json,sys
for mapping in json.load(open(sys.argv[1])):
    if mapping.get('metadata',{}).get('name')==sys.argv[2]:
        print(mapping.get('spec',{}).get('routeName','UNKNOWN'))
        break
PY
  )"
  if [[ -n "$BRILLER_TARGET" && "$BRILLER_TARGET" != "$SERVICE" ]]; then
    printf 'STOP: %s is already mapped to %s; no existing mapping was changed.\n' "$BRILLER_DOMAIN" "$BRILLER_TARGET" >&2
    exit 1
  fi
  if [[ -z "$BRILLER_TARGET" ]]; then
    gcloud beta run domain-mappings create --project="$PROJECT_ID" --region="$REGION" --service="$SERVICE" --domain="$BRILLER_DOMAIN" --quiet
  fi
  gcloud beta run domain-mappings describe --project="$PROJECT_ID" --region="$REGION" --domain="$BRILLER_DOMAIN" --format=json > "$BRILLER_MAPPING_DIR/current.json"
  python3 - "$BRILLER_MAPPING_DIR/current.json" <<'PY'
import json,sys
mapping=json.load(open(sys.argv[1]))
print(json.dumps({'domain':mapping['metadata']['name'], 'dnsRecords':mapping.get('status',{}).get('resourceRecords',[]), 'conditions':mapping.get('status',{}).get('conditions',[])},ensure_ascii=False,indent=2))
PY
done
