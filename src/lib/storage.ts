export type Resolution =
  | "CIF"
  | "VGA"
  | "720p"
  | "1080p"
  | "2K"
  | "4MP"
  | "4K"
  | "8MP"
  | "12MP";

export type Quality = "low" | "medium" | "high";

export type Codec = "h264" | "h264p" | "h265" | "h265p";

export type BitrateMode = "cbr" | "vbr";

export const RESOLUTIONS: Record<Resolution, { label: string; megapixels: number }> = {
  CIF: { label: "CIF (0.1 MP)", megapixels: 0.1 },
  VGA: { label: "VGA (0.3 MP)", megapixels: 0.3 },
  "720p": { label: "720p (1 MP)", megapixels: 1.0 },
  "1080p": { label: "1080p (2 MP)", megapixels: 2.0 },
  "2K": { label: "2K / 1440p (3.7 MP)", megapixels: 3.7 },
  "4MP": { label: "4 MP", megapixels: 4.0 },
  "4K": { label: "4K / 2160p (8.3 MP)", megapixels: 8.3 },
  "8MP": { label: "8 MP", megapixels: 8.0 },
  "12MP": { label: "12 MP", megapixels: 12.0 },
};

// Bits-per-pixel quality presets. Re-calibrated (2026-06) against measured
// on-disk recordings from 24 deployed cameras across 5 stores — see
// CALIBRATION in the README. The recorded bitrates implied a midrange bpp
// clustered around 0.015–0.055 (median ~0.03) for "medium", far below the
// previous 0.06. The values below sit slightly ABOVE the measured median on
// purpose: for a storage planner, erring high means over-estimating bytes /
// under-estimating retention, which is the safe direction (you won't run out
// of disk sooner than predicted). Across the calibration fleet the model now
// predicts ~1.3x the measured rate at the median — deliberately conservative.
//
// Caveat: real bitrate is sub-linear in pixel count (large sensors compress
// much more efficiently per pixel than tiny ones), which this pixel-linear
// model can't fully capture. It is therefore most accurate in the midrange
// and conservative (over-predicts) for very high-res, efficiently-encoded
// streams. "high" is anchored on a single 1440p sample, so treat it as a
// rough upper bound rather than a tight fit.
export const QUALITY_BPP: Record<Quality, number> = {
  low: 0.022,
  medium: 0.035,
  high: 0.16,
};

// Per-codec compression multipliers relative to H.264 (= 1.0). Re-tuned so
// H.265 lands ~30% below H.264 (rather than ~45%), matching observed data.
export const CODEC_FACTOR: Record<Codec, number> = {
  h264: 1.0,
  h264p: 0.6,
  h265: 0.7,
  h265p: 0.5,
};

// Bitrate mode multiplier. CBR holds a fixed budget; VBR averages lower on
// typical (largely static) surveillance scenes, so it gets a discount.
export const MODE_FACTOR: Record<BitrateMode, number> = {
  cbr: 1.0,
  vbr: 0.85,
};

export const MODE_LABEL: Record<BitrateMode, string> = {
  cbr: "CBR",
  vbr: "VBR",
};

export const CODEC_LABEL: Record<Codec, string> = {
  h264: "H.264",
  h264p: "H.264+",
  h265: "H.265",
  h265p: "H.265+",
};

// Fixed per-stream overhead (encoder headers, I-frames, container) that does
// not scale with resolution. Keeps low-resolution substreams from being
// underestimated by the purely pixel-proportional term. Nudged up from 0.10
// to 0.15 during the 2026-06 calibration: several deployed low-res substreams
// recorded at ~0.1 Mbps regardless of pixel count, i.e. essentially floor.
export const FLOOR_MBPS = 0.15;

export const AUDIO_KBPS = 96;

export interface StreamConfig {
  resolution: Resolution;
  fps: number;
  quality: Quality;
}

export type StreamChoice = "mainstream" | "substream";

export interface CalcInput {
  cameras: number;
  hddTB: number;
  hoursPerDay: number;
  codec: Codec;
  bitrateMode: BitrateMode;
  audio: boolean;
  recordStream: StreamChoice;
  mainstream: StreamConfig;
  substream: StreamConfig;
}

export interface StreamBreakdown {
  bitrateMbps: number;
  gbPerDay: number;
}

export interface CalcResult {
  mainstream: StreamBreakdown;
  substream: StreamBreakdown;
  audioMbps: number;
  bitratePerCameraMbps: number;
  perCameraGBPerDay: number;
  totalGBPerDay: number;
  usableGB: number;
  days: number;
  hours: number;
}

function streamBps(
  stream: StreamConfig,
  codec: Codec,
  mode: BitrateMode
): number {
  const px = RESOLUTIONS[stream.resolution].megapixels * 1_000_000;
  const bpp = QUALITY_BPP[stream.quality];
  const variable = px * stream.fps * bpp * CODEC_FACTOR[codec] * MODE_FACTOR[mode];
  return FLOOR_MBPS * 1_000_000 + variable;
}

export function calculate(input: CalcInput): CalcResult {
  const recordedStream =
    input.recordStream === "mainstream" ? input.mainstream : input.substream;
  const recordedBps = streamBps(recordedStream, input.codec, input.bitrateMode);
  const audioBps = input.audio ? AUDIO_KBPS * 1000 : 0;

  const totalBps = recordedBps + audioBps;
  const bitratePerCameraMbps = totalBps / 1_000_000;

  const secondsPerDay = input.hoursPerDay * 3600;
  const toGB = (bps: number) => (bps / 8) * secondsPerDay / 1_000_000_000;

  const perCameraGBPerDay = toGB(totalBps);
  const totalGBPerDay = perCameraGBPerDay * input.cameras;

  const usableGB = input.hddTB * 1000;
  const days = totalGBPerDay > 0 ? usableGB / totalGBPerDay : 0;

  const mainBpsAll = streamBps(input.mainstream, input.codec, input.bitrateMode);
  const subBpsAll = streamBps(input.substream, input.codec, input.bitrateMode);

  return {
    mainstream: { bitrateMbps: mainBpsAll / 1_000_000, gbPerDay: toGB(mainBpsAll) },
    substream: { bitrateMbps: subBpsAll / 1_000_000, gbPerDay: toGB(subBpsAll) },
    audioMbps: audioBps / 1_000_000,
    bitratePerCameraMbps,
    perCameraGBPerDay,
    totalGBPerDay,
    usableGB,
    days,
    hours: days * 24,
  };
}

export function formatDays(days: number): string {
  if (!isFinite(days) || days <= 0) return "—";
  if (days < 1) {
    const h = Math.max(1, Math.round(days * 24));
    return `${h} hour${h === 1 ? "" : "s"}`;
  }
  if (days < 90) {
    return `${days.toFixed(1)} days`;
  }
  const months = days / 30.44;
  if (months < 24) return `${months.toFixed(1)} months`;
  return `${(days / 365.25).toFixed(2)} years`;
}
