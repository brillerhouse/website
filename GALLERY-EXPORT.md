# Download the Inspiration gallery as individual 1080px images

The exporter reads the **current** gallery catalogue and exact crop coordinates used on the website. It separates the individual room scenes from the composite sheets, uses the higher-resolution featured image where available, and includes the six original references. It does not export the unused eighth sheet tile or retired gallery generations.

From your local website checkout:

```bash
git switch preview &&
git pull --ff-only origin preview &&
npm run gallery:export -- --render
```

The script creates a dated **briller-inspiration-1080p** folder and ZIP archive in your **Downloads** folder. It uses the existing `sharp` dependency and the `zip` utility included with macOS. If dependencies have not been installed in this checkout, run `npm ci` first.

Inside the export:

- `designs/<room>/`: 252 individual JPEGs, covering seven rooms, twelve styles and three budget levels.
- `original-references/`: six individually named reference JPEGs.
- `gallery-index.csv`: filenames, English/Ukrainian titles, room, style, budget, size, area and pixel dimensions. Open this in Excel, Numbers or a spreadsheet app.
- `gallery-index.json`: the same catalogue with source/crop metadata for app imports.
- `README.txt`: export notes.

Example filename:

```text
living-room__minimalism__economy__small__13-sqm__living-minimalism-economy.jpg
```

All JPEGs are **1080 pixels high**, usually **1440 × 1080** for the design variants. Reference proportions vary, including square. Framing and proportions are preserved; there is no extra 16:9 crop, letterboxing, text overlay or AI regeneration. Lanczos3 resampling increases pixel dimensions but cannot reconstruct detail missing from the smaller sheet tiles.

For a different destination, specify a new folder:

```bash
npm run gallery:export -- --render --output "$HOME/Downloads/briller-gallery-images"
```

Existing folders and archives are never overwritten. A normal run without `--output` uses a timestamp to avoid collisions. Add `--no-zip` if you only need the separate files. Omit `--render` for a read-only inventory/dry run.

This is a local export tool. It does not change gallery photos, website content or deployment.

## AI-upscale comparison

The export above is ordinary resizing, not detail restoration. To compare real local Real-ESRGAN with Gemini on three original scene crops, use [the comparison guide](GALLERY-UPSCALING-COMPARISON.md).

For a full Gemini-only 4K batch with descriptive filenames, resumable processing and a local review report, see [the Gemini batch guide](GALLERY-GEMINI-4K.md).
