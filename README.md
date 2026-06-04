# Surveillance Recording Retention Calculator

A fast, client-side calculator that estimates how many days of footage an NVR/DVR
can retain, given camera count, storage volume, resolution, frame rate, codec, and
recording schedule. Generates a shareable "receipt" you can export as a PNG or
plain-text file.

Built with Next.js 16, React 19, Tailwind CSS v4, and shadcn/ui. All calculations
run entirely in the browser — no backend, no data leaves the page.

## Features

- **Retention estimate** — days/hours of footage from cameras, HDD size, and schedule
- **Per-stream modeling** — configure mainstream and substream independently, pick which one records
- **Codec support** — H.264, H.264+, H.265, H.265+ (with realistic compression factors)
- **Resolutions** — CIF through 12 MP, with megapixel-accurate bitrate math
- **Quality presets** — low / medium / high bits-per-pixel
- **Optional audio** — ~96 kbps added to the stream
- **Exportable receipt** — download a PNG image or a text receipt of any estimate

## How the math works

Bitrate is modeled as:

```
bitrate = floor + (megapixels × 1,000,000 × FPS × bits-per-pixel × codec-factor × mode-factor)
```

- **bits-per-pixel** comes from the quality preset (low `0.022`, medium `0.035`, high `0.16`)
- **codec-factor** scales H.264 (`1.0`) down for more efficient codecs (H.265 `0.7`, H.265+ `0.5`)
- **mode-factor** discounts VBR (`0.85`) vs CBR (`1.0`), since VBR averages lower on static scenes
- **floor** is a fixed `0.15 Mbps` per-stream overhead (headers, I-frames) so low-res substreams aren't underestimated
- Optional audio adds 96 kbps
- Daily storage = bitrate × recording-hours, converted to GB; retention = usable storage ÷ daily storage

## Calibration

The constants were **re-calibrated in June 2026 against measured on-disk recordings**
from **24 deployed cameras across 5 stores** (food-4-less Monteca & Ceres, 164-5-69th-ave,
little-japan, amish). For each camera we read the actual recorded `.ts` segments from
the store's recorder (total bytes ÷ recorded duration ⇒ real bitrate; oldest→newest
segment span ⇒ retention), rather than probing the live stream — so the figures reflect
what is genuinely written to disk.

The measured bitrates implied a "medium" bits-per-pixel clustered around `0.015–0.055`
(median ≈ `0.03`), well below the previous `0.06`. The presets above sit **slightly
above the measured median on purpose**: for a storage planner the safe direction is to
over-estimate bytes (and under-estimate retention), so you don't run out of disk sooner
than predicted. Across the calibration fleet the model now predicts roughly **1.3× the
measured rate at the median** — deliberately a touch conservative.

> **Note on the `high` preset:** real bitrate is *sub-linear* in pixel count — large
> sensors compress far more efficiently per pixel than tiny ones — which this
> pixel-linear model can't fully capture. The model is most accurate in the midrange and
> conservative (over-predicts) for very high-resolution, efficiently-encoded streams.
> The `high` preset is anchored on a single 1440p sample, so treat it as a rough upper
> bound rather than a tight fit.

## Accuracy & limitations

The arithmetic is exact — bitrate → GB/day → retention is straightforward math.
All of the uncertainty lives in the hand-tuned constants: the bits-per-pixel quality
presets, the per-codec compression factors, and the CBR/VBR mode factor. This is a
**first-principles estimator calibrated to a real-world sample (24 cameras / 5 stores),
not a model validated against a large labeled dataset.**

In practice (measured against the calibration sample):

- **Good for sizing decisions** (e.g. "do I need a 4 TB or a 12 TB drive?"), and tuned
  to err on the safe side — the model predicts ~**1.3× the measured rate at the median**,
  so it tends to over-estimate storage and under-estimate retention rather than the
  reverse.
- **Not exact to the day.** Two cameras with *identical* settings can differ several-fold
  in real GB/day depending on scene content — the model has no scene-complexity input,
  so estimates for individual cameras can still be off by **2× or more** in either
  direction (it over-predicts very efficient high-res streams and under-predicts
  over-provisioned low-res ones).

What is **not** modeled, and why estimates drift:

| Factor | Effect |
| --- | --- |
| Scene complexity / motion | Largest remaining source of error; more motion, foliage, rain, or night IR = more bits, and the model has no scene input |
| CBR vs VBR | Now modeled with a single average mode-factor; real VBR savings vary by scene |
| Smart codecs (H.264+/H.265+) | Real savings swing ~30–70%; the model uses one average factor |
| Vendor encoder tuning | Different manufacturers differ at nominally identical settings |

Audio (fixed 96 kbps) and the unit conversions are accurate. Treat the retention figure
as a **planning estimate, not a guarantee** — to tighten it further, measure actual GB/day
from a few deployed cameras and adjust the `QUALITY_BPP` / `CODEC_FACTOR` / `MODE_FACTOR`
constants in [`src/lib/storage.ts`](./src/lib/storage.ts) to match your hardware and scenes.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack)  |
| `npm run build` | Production build                  |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint                        |

## Deploy

This is a static-friendly Next.js app and deploys cleanly to
[Vercel](https://vercel.com/) — import the repo and accept the defaults. It will
also run anywhere Next.js does (`npm run build && npm run start`).

## License

[MIT](./LICENSE) © Emre Diricanli
