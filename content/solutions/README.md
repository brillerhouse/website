# Solutions content

- `en.json` and `uk.json`: hub UI text and 27 audience/use-case pages. Match each page by its stable `slug`.
- `navigation.json`: five project categories, audience labels and three homepage/hub entry groups.
- `components/Solutions.tsx`: shared page layout; `SolutionControls.tsx`: search, filters and copyable briefs.
- `lib/solutions.ts`: routes, metadata, localized lookups and the header menu tree.
- `components/SolutionsMenu.tsx`: desktop category/page dropdown and mobile category accordion. Header menu labels are in `content/en.json` and `content/uk.json`. The menu uses the same categories and page labels as the hub.

Edit text in JSON. The templates, static routes, sitemap and tests pick up the page list automatically. Keep slugs, category IDs, audience IDs and related-page references synchronized between languages. Current pages adapt the supplied `solutions.zip`; its image paths were placeholders with no image files, so the pages use designed brief and advice blocks instead.

Routes: `/en/solutions/`, `/uk/solutions/` and `/[locale]/solutions/[slug]/`.

SEO: page-specific metadata, canonical/hreflang, breadcrumbs, visible FAQ structured data, linked directory and sitemap. Preview builds stay noindex.

Plan entitlements come from `content/plans.json`; do not duplicate prices in solution copy. Commercial use: every paid plan. PDF export and faster queue: Pro Design and Studio / Architect. Shared projects: Studio / Architect.
