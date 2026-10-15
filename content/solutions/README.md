# Solutions content

- `en.json` and `uk.json`: hub UI text and 27 audience/use-case pages. Match each page by its stable `slug`.
- `navigation.json`: five project categories, audience labels and three homepage/hub entry groups.
- `examples.json`: a distinct bilingual before/after scenario and three audience-specific Briller advice points for every solution. Each key matches a page slug. Captions explain what changes, what stays and the next practical step.
- `budgets.json`: separate Economy, Standard and Premium scope summaries, materials, installation considerations and trade-offs for all 27 solutions in EN/UK. These are project-scope choices, not subscription plans or price quotes. Each option must stay within the particular use case.
- `public/images/solutions/<slug>.webp`: one original AI-generated diptych per solution, before on the left and the after concept on the right. Both panels are illustrative concepts, not customer photographs. Do not reuse an unrelated pair or imply measured accuracy.
- `media.json`: the actual intrinsic dimensions of each image, used to reserve space during loading.
- `components/SolutionExample.tsx`: shared before/after section, visible concept disclosure and additional advice. The original page sections remain in `Solutions.tsx`.
- `components/SolutionProject.tsx`: places Briller’s take and the budget selector on the left, comparison on the right, and technical advice below both. Switching the budget updates the summary and all three technical recommendations while preserving the divider position. The photo remains an illustrative reference; captions, original advice and next steps are retained. On small screens the columns stack.
- `components/SolutionComparison.tsx`: overlays the two halves of each diptych in a single frame with the homepage-style draggable divider. Supports pointer, touch and keyboard input, keeps each panel's proportions and caps the frame height at 560px. The complete source pair remains available from the full-comparison link.
- `components/Solutions.tsx`: shared page layout; `SolutionControls.tsx`: search, filters and copyable briefs.
- `lib/solutions.ts`: routes, metadata, localized lookups and the header menu tree.
- `components/SolutionsMenu.tsx`: desktop category/page dropdown and mobile category accordion. Header menu labels are in `content/en.json` and `content/uk.json`. The menu uses the same categories and page labels as the hub.

Edit text in JSON. The templates, static routes, sitemap and tests pick up the page list automatically. Keep slugs, category IDs, audience IDs and related-page references synchronized between languages. Current pages adapt the supplied `solutions.zip`; its original image paths were placeholders with no image files. The added examples now use separately generated concept pairs and preserve the supplied brief and advice sections. Existing material specifications are examples for their described scenarios, not universal installation instructions or exact product recommendations.

Routes: `/en/solutions/`, `/uk/solutions/` and `/[locale]/solutions/[slug]/`.

SEO: page-specific metadata, canonical/hreflang, breadcrumbs, visible FAQ structured data, linked directory and sitemap. Preview builds stay noindex.

Validation: `BRILLER_PREVIEW=1 npm run build`, `npm run check`, then `BRILLER_PREVIEW=1 npm test`. The example tests check all 27 bilingual entries, complete budget alternatives, image assets, rendered advice and the preservation of existing page sections across all 54 solution routes. For browser review, check all three budget options, divider-state preservation, desktop column placement and mobile stacking.

Plan entitlements come from `content/plans.json`; do not duplicate prices in solution copy. Commercial use: every paid plan. PDF export and faster queue: Pro Design and Studio / Architect. Shared projects: Studio / Architect.
