import {
  CODEC_LABEL,
  MODE_LABEL,
  RESOLUTIONS,
  formatDays,
  type CalcInput,
  type CalcResult,
} from "@/lib/storage";

const WIDTH = 40;

function line(char = "-"): string {
  return char.repeat(WIDTH);
}

function row(label: string, value: string): string {
  const dotsLen = Math.max(2, WIDTH - label.length - value.length);
  return `${label}${".".repeat(dotsLen)}${value}`;
}

function center(text: string): string {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return " ".repeat(pad) + text;
}

export function buildReceiptText(
  input: CalcInput,
  result: CalcResult,
  generatedAt: Date,
  estimateId: string
): string {
  const recorded =
    input.recordStream === "mainstream" ? input.mainstream : input.substream;

  const dateStr = generatedAt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines: string[] = [];
  lines.push(center("SURVEILLANCE"));
  lines.push(center("Recording Retention Estimate"));
  lines.push(center(`${dateStr}  #${estimateId}`));
  lines.push(line("="));
  lines.push(row("Cameras", String(input.cameras)));
  lines.push(row("HDD volume", `${input.hddTB} TB`));
  lines.push(row("Codec", CODEC_LABEL[input.codec]));
  lines.push(row("Bitrate mode", MODE_LABEL[input.bitrateMode]));
  lines.push(row("Recording", `${input.hoursPerDay} h/day`));
  lines.push(row("Audio", input.audio ? "on (~96kbps)" : "off"));
  lines.push(line());
  lines.push(`Recorded stream: ${input.recordStream}`);
  lines.push(row("  Resolution", RESOLUTIONS[recorded.resolution].label));
  lines.push(row("  Frame rate", `${recorded.fps} fps`));
  lines.push(row("  Quality", recorded.quality));
  lines.push(
    row("  Bitrate", `${result[input.recordStream].bitrateMbps.toFixed(2)} Mbps`)
  );
  lines.push(line());
  lines.push(row("Per camera / day", `${result.perCameraGBPerDay.toFixed(2)} GB`));
  lines.push(row("All cameras / day", `${result.totalGBPerDay.toFixed(1)} GB`));
  lines.push(row("Usable storage", `${result.usableGB.toFixed(0)} GB`));
  lines.push(line("="));
  lines.push(row("RETENTION", formatDays(result.days)));
  lines.push(
    center(
      `${result.days.toFixed(1)} days  ${Math.round(result.hours).toLocaleString()} hours`
    )
  );
  lines.push(line());
  lines.push(center("Estimate: bpp x fps x codec x mode."));
  lines.push(center("Actual usage varies with scene."));
  lines.push(center("-- Surveillance Recording --"));
  lines.push(center("-- Retention Calculator --"));
  return lines.join("\n");
}
