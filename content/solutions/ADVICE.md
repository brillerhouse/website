# Solution advice and Smart Sparks

The 27 Solutions have 81 independent advice topics, 243 Economy/Standard/Premium recommendations per language, and 73 image hotspots. English and Ukrainian describe the same features and reference sources. The homepage keeps the four supplied room analyses and adds ordering checks, references and budget-specific Spark summaries.

## Content model

- `advice.json`: each page owns three topic IDs. A topic contains its localized title, category, ordering check, optional reference IDs and three budget specifications. Each budget has material/system specification, installation method and a practical trade-off.
- `sparks.json`: coordinates in the **displayed after frame**, not the original combined image. Tips without coordinates remain available in the advice cards.
- `../advice-references.json`: selected topic-specific public guidance. Generic manufacturer homepages and unused sources are removed. A card may have no reference: do not force a weak link into it. Suggested dimensions are example design briefs, not claimed measurements of a render or quoted manufacturer approvals.
- `lib/advice.ts`: resolves reference IDs and rejects missing sources. The comparison bubble uses the currently selected budget's specification; selecting a different budget preserves the active feature.

## Coverage and image review

All 27 after frames were inspected, then marker positions were checked against the actual 16:9 crop and `media.json` focus setting. The content addresses different decisions for homeowners, tenants, remote workers, designers, architects, contractors, agents, investors, developers and rental operators.

Topics include hinge drilling and front construction; slab and sink support; LED profiles, drivers and controls; wet-area membranes and joints; paint sampling and preparation; timber movement and floor acoustics; curtain geometry; ergonomic and occupied clearances; anchoring; nursery safety; structural and fire coordination; moisture and service access; exterior drainage and weathering; cleaning, spares, disclosure and procurement records.

Features absent from the pictures were removed from photo annotations: bathroom ventilation/mirror lights, the investor room's out-of-frame ceiling fitting and closet lighting. Those remain useful proposed improvements in the cards. The developer finish register and other document-only decisions have no arbitrary photo marker. Daybed, parasol and pendant advice replaces previous wall-bed, pergola and ceiling-cove mismatches.

## Editing and review

1. Inspect the current image and its rendered crop before choosing a feature. Separate visible material choices from hidden construction that needs investigation.
2. Write the audience's actual decision: name the assembly, dimensions or performance criterion where appropriate, installation interfaces, and the trade-off for each budget. Never make safety, structural sizing or local compliance depend on a budget tier.
3. Include an official reference only when its destination directly helps the reader act on the advice. Keep a destination once per project, in its most relevant card. Prefer the exact installation guide or technical document and verify it before adding a new URL. Never fill a card with a generic manufacturer homepage. Explain what to check. Use the exact selected manufacturer's current technical documentation before adopting a proprietary assembly. The reference catalogue is a navigation aid, not a live technical-data mirror; HTTP availability of external sites is not asserted by the content tests.
4. Keep EN/UK aligned. Check every marker against the displayed feature, including narrow layouts. Planning guidance can be valuable without a hotspot.
5. Run the preview build, type check and test suite. `solution-examples.test.mjs` rejects shared fallback cards, repeated recommendations, missing translations, unknown source IDs, generic homepage or repeated destinations, empty reference lists and dangling image-to-advice links. It also checks all localized exports preserve existing page sections. Browser review must additionally exercise budget changes, bubble/card navigation, after-only visibility, keyboard dismissal and mobile overflow.

Automated uniqueness checks prevent a regression to reused cards; they do not substitute for visual or technical review.

## Validation on 18 October 2026

The preview build, TypeScript check and full test suite passed. Browser review covered all 54 localized routes at desktop and mobile widths (108 visits, 996 budget-content checks), every after-image hotspot, and 146 compact popup/action checks at 320px, with 900/1024/1440px spot checks. No JavaScript or local asset errors were recorded. The original supplied homepage budget specifications remain unchanged in both languages.

## Reference curation after the SEO review

The previous set had 135 solution-card reference links per language and nine on the homepage. The curated set keeps ten solution-card links across eight pages, drawn from four focused guidance sources (OSHA workstations, CPSC Safe Sleep, the dedicated Anchor It! programme, and EPA lead-paint guidance). All 81 topics, technical budget alternatives, ordering checks and Smart Sparks remain intact. Cards without a useful source omit the reference heading and list. Independent editorial links retain normal link behaviour; none are paid placements.

This is an editorial relevance decision, not an SEO link-count rule. Generic product homepages were removed; no unverified replacement paths were invented. HTTP verification of additional manufacturer guides is pending: the environment proxy denied access outside the existing allowlist (CONNECT 403). The required source domains were saved in the environment configuration draft for user review; that draft does not change runtime network access until applied. Once access is available, select a small set of genuinely useful guides for each solution and test the final URL, redirects and actual document contents before adding them.

The curated-link preview passed the build, type check and full test suite, including all 54 localized Solution exports. Browser checks covered 16 desktop/mobile views in EN/UK: retained sources, duplicate prevention, cards without empty reference headings, budget switching and overflow. Existing technical recommendations were compared with the preceding commit and remain unchanged. External manufacturer URL checks remain unrun because of the documented proxy restriction.
