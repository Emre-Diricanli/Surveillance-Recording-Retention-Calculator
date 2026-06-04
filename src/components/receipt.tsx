"use client";

import { forwardRef } from "react";
import {
  CODEC_LABEL,
  MODE_LABEL,
  RESOLUTIONS,
  formatDays,
  type CalcInput,
  type CalcResult,
} from "@/lib/storage";

interface ReceiptProps {
  input: CalcInput;
  result: CalcResult;
  generatedAt: Date;
  estimateId: string;
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={
        "flex items-baseline gap-2 " + (bold ? "font-semibold" : "")
      }
    >
      <span className="whitespace-nowrap">{label}</span>
      <span
        aria-hidden
        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-zinc-400"
      />
      <span className="whitespace-nowrap tabular-nums">{value}</span>
    </div>
  );
}

function Centered({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={"text-center " + className}>{children}</div>;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(function Receipt(
  { input, result, generatedAt, estimateId },
  ref
) {
  const recorded =
    input.recordStream === "mainstream" ? input.mainstream : input.substream;

  const dateStr = generatedAt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      className="w-[380px] bg-white px-7 py-8 font-mono text-[12.5px] leading-relaxed text-zinc-900 shadow-sm"
    >
      <Centered>
        <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Surveillance
        </div>
        <div className="mt-1 text-[15px] font-semibold tracking-tight">
          Recording Retention Estimate
        </div>
        <div className="mt-1 text-[10.5px] text-zinc-500">
          {dateStr} · #{estimateId}
        </div>
      </Centered>

      <div className="my-4 border-t border-dashed border-zinc-400" />

      <div className="space-y-1.5">
        <Row label="Cameras" value={`${input.cameras}`} />
        <Row label="HDD volume" value={`${input.hddTB} TB`} />
        <Row label="Codec" value={CODEC_LABEL[input.codec]} />
        <Row label="Bitrate mode" value={MODE_LABEL[input.bitrateMode]} />
        <Row label="Recording" value={`${input.hoursPerDay} h/day`} />
        <Row label="Audio" value={input.audio ? "on (~96 kbps)" : "off"} />
      </div>

      <div className="my-4 border-t border-dashed border-zinc-400" />

      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Recorded stream · {input.recordStream}
      </div>
      <div className="mt-2 space-y-1.5">
        <Row
          label="Resolution"
          value={RESOLUTIONS[recorded.resolution].label}
        />
        <Row label="Frame rate" value={`${recorded.fps} fps`} />
        <Row label="Quality" value={recorded.quality} />
        <Row
          label="Bitrate"
          value={`${result[input.recordStream].bitrateMbps.toFixed(2)} Mbps`}
        />
      </div>

      <div className="my-4 border-t border-dashed border-zinc-400" />

      <div className="space-y-1.5">
        <Row
          label="Per camera/day"
          value={`${result.perCameraGBPerDay.toFixed(2)} GB`}
        />
        <Row
          label="All cameras/day"
          value={`${result.totalGBPerDay.toFixed(1)} GB`}
        />
        <Row
          label="Usable storage"
          value={`${result.usableGB.toFixed(0)} GB`}
        />
      </div>

      <div className="my-4 border-t-2 border-zinc-900" />

      <Row label="RETENTION" value={formatDays(result.days)} bold />
      <Centered className="mt-1 text-[11px] text-zinc-500">
        {result.days.toFixed(1)} days · {Math.round(result.hours).toLocaleString()} hours
      </Centered>

      <div className="my-4 border-t border-dashed border-zinc-400" />

      <Centered className="text-[10px] leading-relaxed text-zinc-500">
        Estimate based on bits-per-pixel × FPS × codec & bitrate-mode factor.
        <br />
        Actual usage varies with scene complexity and tuning.
        <div className="mt-2">— Surveillance Recording Retention Calculator —</div>
      </Centered>
    </div>
  );
});
