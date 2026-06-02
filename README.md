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

Estimates are based on bits-per-pixel × FPS × codec factor. Real-world usage varies
with scene complexity, motion, and encoder tuning — treat the result as a planning
estimate, not a guarantee.

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
