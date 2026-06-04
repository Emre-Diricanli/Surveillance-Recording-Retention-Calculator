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

- **bits-per-pixel** comes from the quality preset (low `0.035`, medium `0.06`, high `0.085`)
- **codec-factor** scales H.264 (`1.0`) down for more efficient codecs (H.265 `0.7`, H.265+ `0.5`)
- **mode-factor** discounts VBR (`0.85`) vs CBR (`1.0`), since VBR averages lower on static scenes
- **floor** is a fixed `0.1 Mbps` per-stream overhead (headers, I-frames) so low-res substreams aren't underestimated
- Optional audio adds 96 kbps
- Daily storage = bitrate × recording-hours, converted to GB; retention = usable storage ÷ daily storage

These constants were **calibrated against a sample of real deployed cameras** (mostly
retail/static scenes), whose implied bits-per-pixel clustered around `0.04–0.09` — well
below the textbook `0.1–0.18` the model originally used, which overestimated H.264
bitrate by roughly 2–3×.

## Accuracy & limitations

The arithmetic is exact — bitrate → GB/day → retention is straightforward math.
All of the uncertainty lives in the hand-tuned constants: the bits-per-pixel quality
presets, the per-codec compression factors, and the CBR/VBR mode factor. This is a
**first-principles estimator calibrated to a small real-world sample, not a model
validated against a large labeled dataset.**

In practice (measured against the calibration sample):

- **Good for sizing decisions** (e.g. "do I need a 4 TB or a 12 TB drive?"). On the
  calibration data, mainstream estimates land **within ~±15%** and most streams within
  **±50%**, once the quality preset and bitrate mode match the camera's configuration.
- **Not exact to the day.** Two cameras with *identical* settings can differ several-fold
  in real GB/day depending on scene content — the model has no scene-complexity input,
  so substream estimates in particular can still be off by **2× or more**.

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
