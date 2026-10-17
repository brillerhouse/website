# Inspiration gallery

The gallery covers **12 styles × 7 room types × 3 versions = 252 concepts**, plus six original references. Each room/style has Economy, Budget and Premium versions, with Small/Medium/Large sizes distributed independently across those three versions. This is deliberately not the nine-combination budget/size Cartesian product.

`gallery-catalogue.json` defines localized room/style descriptions. `gallery-variants.json` defines the versions, sizes, scene sources and framing. `lib/gallery.ts` interleaves the collection, selects three opening images and builds the bilingual copyable redesign prompts. Those prompts preserve the customer's actual room geometry and now explicitly discourage crowded shelves, competing patterns and excessive plants. Generation briefs and quality records are never imported into the client bundle.

## Current visual review

The October 17 quality pass reviewed all 252 concepts and all six original references. It replaced **162 concepts**, preserved **90**, and retained the six reference image files byte-for-byte. The original reference named `bedroom` actually depicts a lounge corner; its room filter is now Living room. Only two intentional roof examples remain: `bedroom-scandinavian-economy` and `living-industrial-premium`. Normal camera perspective is not classified as a tilted wall or ceiling.

The review prioritizes one clear focal point, usable clear surfaces, quiet areas, credible construction, natural materials/light and recognizable style. Studios show one making activity instead of walls of tiny props. Style comes from furniture, color and material rather than accumulating decoration. Two additional candidates were regenerated after the similarity check flagged their compositions.

`gallery-quality-changes.json` records every replacement and reason, current/previous render fingerprints, the 90 preserved renders, source-asset hashes and original-reference hashes. `gallery-quality-review.json` records visual decisions and observations bound to the **current rendered image**, not its filename alone. The earlier 43-image geometry pass remains historical in `gallery-geometry-review.json`; it is not the current approval record.

`gallery-quality-generation.json` records generation guidance, sets and similarity rejections. `gallery-variant-prompts.json` contains all 252 updated standalone generation briefs. The original 36 briefs in `gallery-variant-generation.json` remain historical source records. Their older stylistic/roof instructions do not override the current quality policy.

## Quality gate

Run `npm run gallery:quality` to validate the current collection. It also runs automatically before `npm run build`.

1. Decode the actual image and isolate its configured scene. Reject missing/invalid images, out-of-bounds crops, insufficient native resolution, wrong scene aspect ratio and duplicate decoded images, including duplicates with different encodings.
2. Analyze image gradients and quiet regions to flag high detail density or little quiet space. Flag unusual exposure or very low detail. Compare same-room perceptual hashes and average color to flag similar compositions. These measurements are **triage**, not an aesthetic score: tile joints, woven fabric and a window view can legitimately trigger them.
3. Require a visual decision for every current concept and original reference, including explicit geometry, restraint, function, photographic credibility and style checks. Flagged images need a recorded acknowledgement and an observation explaining the result of inspection.
4. Count sloped ceilings, rooflight wells and angled walls across both collections. The maximum is **three**; currently two are approved. Reject failed or pending reviews and incomplete room/style/version/size coverage.
5. Bind approval to SHA-256 of source bytes plus the exact crop, and bind the manifest to the quality policy. Changing pixels, framing or policy invalidates approval. A replacement sheet invalidates approval for every scene using it, which is intentionally conservative.

The gate cannot identify every impossible reflection or decide whether a design is beautiful. Visual inspection is mandatory; numeric metrics never automatically approve a new image. Do not raise thresholds merely to make a failed image pass.

For a new generation or replacement:

- Use the current standalone brief and review criteria in `gallery-quality-policy.json`. Default to a continuous level ceiling, vertical walls and rectangular openings. Preserve compelling material/color choices while simplifying styling.
- Run `npm run gallery:review`. This writes a local review board, measurements and **pending** records under ignored `.gallery-review/`. Serve the repository root over local HTTP and open `/.gallery-review/` to inspect current crops at full size, with pending/flagged filters.
- Inspect every changed scene and every similarity pair. Regenerate failed candidates. Record real observations and checks in `gallery-quality-review.json`, using the pending file as a starting point. Preparing records never approves them; matching existing approvals are kept only if both image and policy fingerprints still match.
- Update the change ledger and generation briefs with the final replacements. Keep source/reference files unless a separate cleanup is intended. Run the quality gate, build, type check and tests before publishing preview.

## Rendering and behavior

Most sources are portrait 1024×1536 sets of eight landscape scenes. Each variant has a normalized 4:3 crop; SVG viewports isolate the scene without changing its camera framing or creating cropped raster derivatives. Current replacements use `quality-review-01.webp` through `quality-review-22.webp`. Unused cells and superseded cells are not gallery entries. Opening images use larger standalone assets through `detailImage`; all three quieter opening photographs use `quality-featured-<variant-id>.webp`.

`components/Gallery.tsx` provides room/style/budget/size filters, pagination, three-way version switching and bilingual prompt copying. Some exact filter combinations have no matching version and offer a reset. Original references have no assigned budget/size and disappear when either filter is active. Clipboard rejection exposes a selectable prompt. There is no automatic prompt transfer to the redesign app.

Verify with `BRILLER_PREVIEW=1 npm run build`, `npm run check` and `BRILLER_PREVIEW=1 npm test`. Browser checks should cover all 252 versions in both languages, source/crop matching, filters, copying and clipboard rejection, dialog focus/Escape, and desktop/mobile layouts. Ordinary edits are published to `preview` only, following the repository's AGENTS.md.
