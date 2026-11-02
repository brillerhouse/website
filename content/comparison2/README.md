# Comparison2 — editorial alternative

Routes: `/comparison2/` and `/comparison2/<competitor>/` open the English version. Canonical locale pairs are `/en/comparison2/` and `/uk/comparison2/`, with nine individual comparisons in each language. The original `/en/compare/` and `/uk/compare/` pages remain unchanged. Neither section is added to the header or footer menus.

This version uses paired paragraphs for each capability: the competitor's actual workflow followed by how Briller fits that project. Capability tables and review-method disclaimers are omitted. Specific uncertainties appear under “To confirm” / “Уточнити”, including unresolved pricing, allowance, export and licence details. A single official competitor link is retained at the bottom of each article.

`articles.json` owns the bilingual editorial copy, trial wording, price-row descriptions and questions to confirm. `ui.json` owns the labels. Numeric competitor prices, billing periods, original source records and review dates still come from `content/compare/catalog.json`. Briller prices, credits, trial and seats come from `content/plans.json`. Keep the editorial plan descriptions aligned with the source plan list; `lib/comparison2.ts` rejects incomplete alignment.

The new pages have canonical/hreflang pairs, social metadata, breadcrumbs and WebPage / CollectionPage structured data. This parallel review version is noindex and omitted from sitemap / llms.txt so it does not compete with the original comparison URLs. It is available by direct URL in local previews and normal static builds.

Validation: normal preview build, TypeScript check, existing comparison tests and `npm run test:comparison2`. Check desktop/mobile prose, TOC links, pricing-table scrolling, confirmation items, direct root routes and locale switching before publishing preview.
