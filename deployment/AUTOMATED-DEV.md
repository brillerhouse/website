# Automated Briller Dev

## Everyday workflow

Default edits in chat go to `preview` for local review. This branch does not trigger CI or deployment. The user runs Next.js locally and pulls preview changes; see [LOCAL-PREVIEW.md](LOCAL-PREVIEW.md).

After explicit approval of the reviewed commit, the agent promotes that commit to `dev`. GitHub Actions verifies static output, uploads source/static artifacts, pushes a container to Artifact Registry and updates Cloud Run `briller-website-dev` at the same online URL.

Repository write access in this conversation is configured. Updates to the online site take a few minutes after approved promotion. Production is separate. Download source/static ZIPs from a successful Dev run’s artifacts (30-day retention). Dev static output has noindex and robots Disallow: /; build production with BRILLER_PREVIEW unset for indexable marketing pages.

## One-time setup

1. Create/connect the chosen GitHub repository and `dev` branch; connect repository write access to this conversation.
2. Google Cloud project: `nifty-atlas-473013-f9`, region `europe-west1`; verify Billing.
3. Enable Cloud Run, Artifact Registry, IAM Credentials and Security Token Service APIs.
4. Create Docker Artifact Registry repository `briller-web` in europe-west1.
5. Create runtime account `briller-web-runtime` with no application roles, and deployer account `briller-dev-deployer`.
6. Give the deployer `roles/run.admin` in the project and `roles/artifactregistry.writer` on the `briller-web` repository; give `roles/iam.serviceAccountUser` on the runtime account. An organisation policy may additionally restrict public invoker; do not bypass it.
7. Set up a Workload Identity pool/provider for GitHub’s OIDC issuer `https://token.actions.githubusercontent.com`. Attribute mapping: `google.subject=assertion.sub`, `attribute.repository=assertion.repository`. Restrict the provider condition to the exact GitHub repository AND `assertion.ref == 'refs/heads/dev'`. Prefer immutable repository and owner IDs when available. Grant `roles/iam.workloadIdentityUser` on the deployer account to this repository principalSet only.
8. Set the non-secret `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOY_SERVICE_ACCOUNT` values in the `env` section of `.github/workflows/dev.yml`. The provider is the full resource name; the deployer is `briller-dev-deployer@nifty-atlas-473013-f9.iam.gserviceaccount.com`. Do not add a JSON service-account key.
9. Push the prepared workflow and source to `dev`. Confirm the run’s deployment URL and verify online content.

IAM provisioning is a one-time administrator action; exact commands must be completed with the chosen repo, its immutable IDs, project number and existing IAM state. No private credentials are stored in source. This workflow has been prepared locally but has not yet run in GitHub or deployed Google Cloud resources.

## Cost and access

Dev URL is public for convenient viewing. It is excluded from indexing, but noindex is not authentication. Do not publish private project data. Runtime scales from 0 to at most 1 instance; billing still applies to runtime, registry storage and network traffic. Repository and Google Cloud access remain controlled by their respective accounts.

## Configured repository and one-time Cloud Shell command

Repository: https://github.com/brillerhouse/website. Trust uses immutable GitHub repository ID `1416951704` and owner ID `274613550`, and is limited to `refs/heads/dev`.

As an authorised Google Cloud project administrator, open Cloud Shell, download and inspect the provisioning script, then run it once:

```bash
curl --fail --location https://raw.githubusercontent.com/brillerhouse/website/main/deployment/setup-gcp-dev.sh -o setup-gcp-dev.sh
cat setup-gcp-dev.sh
bash setup-gcp-dev.sh
```

The script enables required APIs, creates the image repository and two service accounts if absent, grants the documented deployment IAM roles, and creates a GitHub OIDC provider restricted to this repository and branch. It does not create a private key or alter app data/DNS. The printed provider resource and service-account email are not secrets; they can be supplied back in chat so the assistant can update the tracked workflow configuration and rerun Dev.

Until identity references are configured, the workflow builds/tests and exports ZIPs, then explicitly reports that online deployment is pending. A successful build in this state is not a successful Google Cloud deployment.
