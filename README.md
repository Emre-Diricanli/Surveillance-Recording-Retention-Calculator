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
bitrate = megapixels × 1,000,000 × FPS × bits-per-pixel × codec-factor
```

- **bits-per-pixel** comes from the quality preset (low `0.05`, medium `0.1`, high `0.18`)
- **codec-factor** scales H.264 (`1.0`) down for more efficient codecs (H.265+ ≈ `0.4`)
- Optional audio adds 96 kbps
- Daily storage = bitrate × recording-hours, converted to GB; retention = usable storage ÷ daily storage

## Accuracy & limitations

The arithmetic is exact — bitrate → GB/day → retention is straightforward math.
All of the uncertainty lives in two hand-tuned constants: the bits-per-pixel
quality presets and the per-codec compression factors. This is a **first-principles
estimator, not a model validated against a labeled dataset**, so there is no measured
"accuracy percentage."

In practice:

- **Good for sizing decisions** (e.g. "do I need a 4 TB or a 12 TB drive?"). Expect
  results within roughly **±25%** when the quality preset matches the scene and the
  camera records at a constant bitrate (CBR).
- **Not exact to the day.** With variable bitrate (VBR) — the common default — a quiet
  hallway can use a fraction of the bitrate of a busy street at identical settings, so
  real usage can differ by **2× or more**.

What is **not** modeled, and why estimates drift:

| Factor | Effect |
| --- | --- |
| CBR vs VBR | Largest source of error; bits-per-pixel is a single fixed value |
| Scene complexity / motion | More motion, foliage, rain, or night IR = more bits |
| Smart codecs (H.264+/H.265+) | Real savings swing ~30–70%; the model uses one average factor |
| Vendor encoder tuning | Different manufacturers differ at nominally identical settings |

Audio (fixed 96 kbps) and the unit conversions are accurate. Treat the retention figure
as a **planning estimate, not a guarantee** — to tighten it, measure actual GB/day from a
few deployed cameras and adjust the `QUALITY_BPP` / `CODEC_FACTOR` constants in
[`src/lib/storage.ts`](./src/lib/storage.ts) to match your hardware and scenes.

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
