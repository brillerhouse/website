# Compare / Порівняння

Routes: `/en/compare/`, `/uk/compare/`, and a localized page for every slug in `catalog.json`. The footer links to the overview. The header, existing pages, gallery images, consent and app routing remain unchanged.

## Research status

The initial directory is a **draft structure**, not a completed competitor study. Competitor facts and prices are marked pending until the official websites can be read. The draft explicitly displays this status, individual pages are `noindex`, and unreviewed pages are omitted from the sitemap. Do not turn a failed fetch or a missing mention into a claim that a competitor lacks a feature.

The proposed shortlist is:

| Product | Official site | Selection hypothesis to verify |
| --- | --- | --- |
| Interior AI | https://interiorai.com/ | Photo-led visual redesign alternative. |
| REimagineHome | https://www.reimaginehome.ai/ | Property presentation and staging use cases. |
| RoomGPT | https://www.roomgpt.io/ | An occasional user comparing a focused room-redesign service. |
| HomeDesignsAI | https://homedesigns.ai/ | Breadth of interior and exterior redesign tasks. |
| Remodel AI | https://remodelai.app/ | A mobile-led homeowner and remodeling workflow. |
| Planner 5D | https://planner5d.com/ | Floor-plan and editable 3D planning needs. |
| Homestyler | https://www.homestyler.com/ | Furnished 3D layouts and visualisation workflows. |
| Foyr Neo | https://foyr.com/ | A professional 3D design and client-presentation workflow. |
| Spacely.ai | https://www.spacely.ai/ | AI visualisation for design work; explicitly requested by the user. |

These selection hypotheses are research questions, not verified current feature or pricing claims.

## Editorial model

`catalog.json` stores the official URLs, review dates, billing-aware numeric offers, cited capability statements and bilingual editorial analysis. `ui.json` stores shared EN/UK labels and methodology. `lib/compare.ts` derives Briller prices, trial and seat counts directly from `content/plans.json`; avoid duplicating them in competitor copy.

For every provider:

1. Read the current official home/product page, pricing and any necessary official help or licensing page. Record the exact URL and actual verification date. Store supporting excerpts and access outcomes in the research notes. A bot block, login wall or inaccessible checkout leaves the relevant fact unconfirmed.
2. Distinguish photo restyling from editable measured floor plans, 3D modelling, professional drawing deliverables and actual technical implementation advice. Do not infer dimension accuracy from an attractive render.
3. Check room/reference inputs, iteration, material/budget advice, floor planning, product discovery, exports/resolution, commercial rights and collaboration. Feature entitlement is plan-dependent; include the qualifying plan or allowance.
4. Record the original currency, price and billing basis. `annual` is a monthly equivalent with annual payment, `yearly` a yearly total, `monthly` month-to-month, and `oneOff` a pack/purchase. Do not convert regional app-store offers into universal web pricing, or credits into renders without a documented conversion.
5. Explain realistic reasons to choose the competitor as well as Briller. Do not claim performance, image fidelity, accuracy, speed, lowest price or universal superiority without supporting tests.
6. Set a fact to `documented` or `different` only with at least one verified source ID. `unconfirmed` means the evidence is insufficient, not that the feature is absent. Numeric pricing offers also require verified sources.
7. Use `verification: reviewed` only after writing the actual analysis and completing the source review. Unavailable numeric prices can remain explicitly unconfirmed on an otherwise useful, reviewed feature analysis.

The comparison is published by Briller and describes a review of public documentation. It is not a hands-on benchmark of paid competitor accounts. Editorial references are ordinary external links; no affiliate status, endorsement, star rating or test results are invented.

## UI and SEO

The overview has a row for Briller and one for each competitor; every competitor links to a full analysis. Detailed pages have source anchors beside the relevant claims, a short official-source list, fit guidance for both products and links to related analyses. External links stay in the source section; table and directory links point to the site's analyses.

Responsive tables have a labeled, keyboard-focusable horizontal scroll region and a sticky tool column. Sources, layout and typography follow the site's Porcelain & Ink Blue tokens. Locale pairs include canonical/hreflang links; structured data uses CollectionPage/ItemList and WebPage, without unsupported ratings or competitor Offer schemas. Research dates are stored facts, not refreshed automatically at build time.

## Validation

```bash
BRILLER_PREVIEW=1 npm run build
npm run check
npm run test:compare
BRILLER_PREVIEW=1 npm test
```

The comparison tests cover the nine-provider directory, Spacely.ai, source-backed facts, prices/billing units, Briller catalogue synchronization, pending-research indexing, locale metadata, table accessibility and actual static links. Review `/en/compare/` and `/uk/compare/` and the individual pages on desktop/mobile before publishing preview. Deploy only through the normal approved release process.

## Alternative-intent SEO and AI retrieval

Each detail page targets its actual competitor name with a localized alternative-intent title, description, H1 and internal anchor text (for example, “Spacely.ai alternative” / “Альтернатива Spacely.ai”). The description is derived from that provider's editorial summary. Avoid duplicated ranking pages, hidden keywords or promises of search positions.

Reviewed pages expose a visible Q&A section and matching FAQPage JSON-LD. The WebPage schema cites verified official sources as CreativeWork references; access dates are not misrepresented as competitor page modification dates. Canonical, EN/UK/x-default hreflang, Open Graph, Twitter, breadcrumbs and CollectionPage/ItemList describe the same static URLs.

Only reviewed analyses enter the sitemap and generated `out/llms.txt`. The hub becomes indexable when the complete proposed comparison set is reviewed. Pending pages stay noindex. Published production robots allow ordinary crawlers; preview retains the site's noindex/nofollow protection. `llms.txt` and structured data improve machine-readable discovery; they do not guarantee AI citations, Google rich results or rankings.
