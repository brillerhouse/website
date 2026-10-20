# Blog checklist delivery: Brevo + a small Cloud Run service

The website remains a static Next.js export. This separate Node 22 service stores requested-resource contacts in Brevo and sends one transactional email. No application database is required. It does not subscribe anyone to a newsletter, change marketing consent, or expose a Brevo key to the browser.

## What works now, and what needs connection

- The article, index, category/tag archives, keyword search and supplied PDF work in the static export.
- The form waits for a real successful contact-save response before showing the download. It never fabricates a successful submission.
- Server validation, Brevo contact/email requests, partial email failures, request deduplication, rate limits, CORS and CSP generation are covered by automated tests with a local mock provider.
- Real delivery requires a Brevo account, verified sender, list, API key and deployed service URL. No live email has been sent during development.
- The PDF is a free public resource. The form is a contact-request workflow, not access control or a paywall; anyone who receives its URL can share it.

## Brevo account setup

1. Verify the sender address (proposed: `hello@briller.house`) and authenticate its sending domain in Brevo. Preserve existing MX, SPF and DKIM records; coordinate any requested DNS additions.
2. Create a separate contact list named **Builder checklist requests**. Record its numeric list ID. Do not connect this list to newsletter campaigns or marketing automations.
3. Under contact attributes, check that `FIRSTNAME` exists and add text attributes `BRILLER_RESOURCE` and `BRILLER_CHECKLIST_AT`. The service records the requested resource and the latest request timestamp.
4. Generate a Brevo API key and store it securely. Do not paste it into chat, source files, public build variables, URLs or shell history.
5. Set a retention period for resource requests in Brevo and apply it in an automated list-cleanup process or documented periodic review. Do not delete contacts who have a separate legitimate account or marketing relationship merely because their checklist request is old. The website does not silently invent a retention period for this new workflow.

## Local development

Create an ignored `.env.blog-leads` in the repository root and enter these values in an editor:

```dotenv
BREVO_API_KEY=
BLOG_SENDER_EMAIL=hello@briller.house
BREVO_CHECKLIST_LIST_ID=
BLOG_ALLOWED_ORIGINS=http://localhost:3001
PORT=8782
```

Start the email service in one terminal:

```bash
node --env-file=.env.blog-leads services/blog-leads/server.mjs
```

Start the website in a second terminal:

```bash
BRILLER_PREVIEW=1 NEXT_PUBLIC_BLOG_LEAD_ENDPOINT=http://localhost:8782/checklist npm run dev -- --port 3001
```

Open `/blog/`. The email service has no dry-run mode that pretends to deliver mail. A real form submission with these credentials stores a contact and sends an email. Use your own address for an authorized integration test. Missing credentials produce HTTP 503 and the form's retry/contact message.

## Production connection

### One-time Google Cloud prerequisite

Run `deployment/setup-blog-leads.sh` in Google Cloud Shell as the project administrator. It creates a dedicated runtime account and regional Secret Manager secret, grants that runtime access to this secret only, and allows the existing GitHub deployer to use the runtime account and inspect secret metadata. It grants no project-wide administrative role.

If there is no enabled secret version, the script privately prompts for the Brevo key and sends it directly to Secret Manager through standard input. It preserves an existing enabled key. A proxy-backed key configured in the Codex environment can validate Brevo API requests, but cannot be exported into a production Google secret.

The manual **Briller Resource Delivery** workflow (`blog-leads.yml`) runs on `dev`, like the existing keyless deployment identity. First use `mode=inspect`; after setup use `mode=deploy`, the exact approved `source_sha`, verified sender `hello@briller.house` and the configured contact-list ID. The workflow tests the service, verifies the container, deploys only `briller-blog-leads`, and checks health/CORS/invalid submissions without sending email or creating test contacts.


Use a dedicated Cloud Run service, `briller-blog-leads`, in the existing Google project and region. Keep it separate from the static website and the Briller app. Configure a dedicated runtime service account and allow that identity to access only the relevant Brevo secret in Secret Manager.

Required runtime settings:

| Setting | Value |
| --- | --- |
| `BREVO_API_KEY` | Secret Manager binding, never a public variable |
| `BLOG_SENDER_EMAIL` | Verified Brevo sender |
| `BREVO_CHECKLIST_LIST_ID` | Numeric requested-resource list ID |
| `BLOG_ALLOWED_ORIGINS` | `https://briller.house` (add the actual Dev origin only if needed) |
| `PORT` | `8080`, supplied by Cloud Run |

Build `services/blog-leads/Dockerfile` with `services/blog-leads` as its context. Deploy with public HTTP access, **maximum one instance**, a 30-second timeout and HTTPS. In-memory rate limits and deduplication intentionally assume one instance; use a shared store or edge rate limiter before scaling out. State can reset on a cold start; this is basic abuse protection, not durable exactly-once delivery.

After deployment:

1. `GET /healthz` must return `deliveryConfigured: true`. This reports the presence of settings; it does not validate Brevo authorization or inbox delivery.
2. Set the GitHub repository variable `BLOG_LEAD_ENDPOINT` to the service's public HTTPS URL followed by `/checklist`. This URL is public; it contains no credentials.
3. The existing Dev and production workflows pass that variable to the static build. `scripts/render-nginx.mjs` adds only the exact endpoint origin to `connect-src`; no wildcard or tracking changes are needed.
4. Rebuild/redeploy the website through the existing reviewed-preview pipeline. The endpoint is baked into the static client bundle.
5. Submit with an authorized test address and verify the Brevo list entry, inbox link, visible download and supplied PDF. Check failure behavior as well. Confirm the processor/privacy and retention settings before accepting real requests.

The service accepts `POST /checklist` and `POST /api/blog-leads/` with the same schema. The website defaults to the latter same-origin path only when no endpoint is configured; static nginx does not pretend to provide an API. Unconfigured forms show a real error and a manual email fallback.

## Data and failure behavior

Only the submitted name, normalized email, requested resource and request timestamp are stored in Brevo. The service does not log the request body, email address or provider response. The request's consent flag is required; it means delivery of the requested resource, not permission to market. The resource list and timestamp attribute document the request.

- A failed contact save returns an error and does not show a download success.
- A successful save followed by failed email delivery still supplies the download, with a clear message that the email was not sent.
- Repeating a successful request ID reuses its result during the in-memory window.
- User-supplied names are escaped in the email HTML.
- The source article/resource identifiers cannot choose arbitrary files or external download destinations.

Run `BRILLER_PREVIEW=1 npm run test:blog` after a preview build. Tests never contact Brevo.
