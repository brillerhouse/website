# Production at briller.house

The production service is `briller-website` in project `nifty-atlas-473013-f9`, region `europe-west1`. Dev remains `briller-website-dev`; the app at `build.briller.house` is separate. Only the apex and `www` marketing hostnames are mapped; `www` redirects to the apex.

Production is manual, after the user requests a release. Promote the reviewed source to `main` without force-pushing; preserve any main-only changes. `.github/workflows/production.yml` is also available on `dev` because the existing Google keyless provider trusts that execution ref. Dispatch it on **dev**, passing the exact approved **main** SHA as `release_sha`. The workflow checks out that SHA and confirms it is still the main head. The app build uses `BRILLER_PREVIEW=0`: marketing pages, robots.txt and sitemap are indexable; draft legal pages retain noindex. A dev image must never be reused as a production image.

```bash
gh workflow run production.yml --repo brillerhouse/website --ref dev \
  -f release_sha=FULL_APPROVED_MAIN_SHA -F connect_domain=true
```

The workflow verifies and packages the site, builds a separately tagged production container and deploys only `briller-website`. Its image tag and downloadable source/static ZIPs identify the release SHA. A successful service deployment does not confirm that the custom domain works.

## One-time domain and DNS setup

Cloudflare manages DNS. Google Cloud Run must first create the domain mappings and provide the exact records. `deployment/connect-domain.sh` checks existing mappings and refuses to replace a different service. A Google identity that owns the verified `briller.house` domain may need to run this script once in Cloud Shell if the GitHub deployment identity cannot map the domain. Do not grant account-wide Owner/Editor or share a private key.

If Google reports that the caller is not a verified domain owner, verify `briller.house` through Google Search Console as that Google user, using the exact verification TXT token it provides. Then run the mapping script as that same user. This token is distinct from the Cloud Run A/AAAA/CNAME routing records.

Copy the returned `status.resourceRecords` into Cloudflare for `@` and `www` only. Use **DNS only** (grey cloud) initially so Google can provision its managed HTTPS certificate. Preserve all `build`, MX, SPF, DKIM, DMARC and other existing records. Do not guess Google IP addresses or point the apex directly at the run.app hostname. Certificate issuance can take time after DNS propagation.

Check HTTPS on `https://briller.house/en/` and `/uk/`, the `www` redirect, localized Solutions/pricing, the consent controls, the corrected CSP and `robots.txt` Allow: /. Confirm the app hostname still has its original DNS records. Before finalizing legal drafts, confirm remaining retention, provider and subscription terms; company identity and the unchanged address were supplied by the user.

## HTTPS proxy redirects

Cloud Run terminates TLS and forwards to nginx over HTTP on port 8080. Keep `absolute_redirect off` in the server block so root, locale and automatic directory redirects remain relative; the browser then retains the public HTTPS origin. The explicit www-to-apex redirect stays HTTPS. Do not fix this with `port_in_redirect off` alone, which can still expose the backend HTTP scheme.

Both publishing workflows run `node scripts/check-redirects.mjs http://127.0.0.1:18080` against the built container before pushing its image. After deployment they follow the service root with HTTPS-only redirects. Check the bare custom domain and `/en` and `/uk` as well as `/en/` and `/uk/`; testing only the final slash URLs misses this failure.
