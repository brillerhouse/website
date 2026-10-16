# Inspiration gallery

`gallery-catalogue.json` defines the seven room types and twelve styles. Each room and style has English and Ukrainian labels and a substantive design brief. `lib/gallery.ts` combines them into 84 distinct concepts and localized redesign prompts; camera viewpoint, openings and structural elements remain part of every prompt.

Each style has one locally generated WebP image set in `public/images/gallery/`. The source composition has two columns and four rows: living room, bedroom, bathroom, kitchen, office, dining room, creative workspace, then an unused entrance scene. The seven normalized `crops` isolate the relevant photographs and exclude the seams. The gallery renders one scene per card and preview, preserving its 4:3 proportions. Review every crop if replacing an image set; generated scene boundaries can vary.

`gallery.json` retains the six original photographic references, also available with copyable prompts. The homepage continues to preview three of these original references. The full gallery separates generated inspiration from the original collection and labels their provenance.

There is no automatic prompt transfer to the redesign app. Copy the prompt, open Briller, upload a room photo and paste the brief. Clipboard rejection opens the selectable prompt as a fallback.

Run `BRILLER_PREVIEW=1 npm run build`, `npm run check` and `BRILLER_PREVIEW=1 npm test`. The gallery tests check complete matrix coverage, localized prompts, assets, valid crops and preservation of the original collection. Browser checks should also cover filters, pagination, clipboard success/denial, native-dialog keyboard/focus behavior and mobile layout.

The revised image sets use natural photographic exposure, ordinary inhabited rooms, mixed furnishings and realistic daily-use details. Exact generation briefs are retained in `gallery-generation.json` (not imported into the client bundle). Every cell has an independent architectural setting and functional scene brief; do not regenerate a style by merely recoloring the previous set. The shared `photography` guidance in the catalogue also strengthens the copyable app prompts without asking the app to change the uploaded room’s architecture.
