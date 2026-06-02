"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "@/components/export-dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CODEC_LABEL,
  RESOLUTIONS,
  calculate,
  formatDays,
  type Codec,
  type Quality,
  type Resolution,
  type StreamChoice,
  type StreamConfig,
} from "@/lib/storage";

const QUALITY_LABEL: Record<Quality, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const FPS_PRESETS = [10, 15, 20, 25, 30];

interface StreamEditorProps {
  title: string;
  description: string;
  value: StreamConfig;
  onChange: (next: StreamConfig) => void;
  fpsMax?: number;
  active?: boolean;
}

function StreamEditor({
  title,
  description,
  value,
  onChange,
  fpsMax = 30,
  active = false,
}: StreamEditorProps) {
  return (
    <div
      className={
        "space-y-4 rounded-lg border p-4 transition-colors " +
        (active
          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
          : "bg-card/50 opacity-70")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {active && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground">
            Recording
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select
            value={value.resolution}
            onValueChange={(v) =>
              onChange({ ...value, resolution: v as Resolution })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RESOLUTIONS) as Resolution[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RESOLUTIONS[r].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quality</Label>
          <Select
            value={value.quality}
            onValueChange={(v) =>
              onChange({ ...value, quality: v as Quality })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                <SelectItem key={q} value={q}>
                  {QUALITY_LABEL[q]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Frame rate</Label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {value.fps} fps
          </span>
        </div>
        <Slider
          min={1}
          max={fpsMax}
          step={1}
          value={[value.fps]}
          onValueChange={(v) =>
            onChange({
              ...value,
              fps: Array.isArray(v) ? v[0] ?? value.fps : v,
            })
          }
        />
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {FPS_PRESETS.filter((f) => f <= fpsMax).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ ...value, fps: f })}
              className="rounded border px-2 py-0.5 hover:bg-accent"
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Calculator() {
  const [cameras, setCameras] = useState(8);
  const [hddTB, setHddTB] = useState(8);
  const [hoursPerDay, setHoursPerDay] = useState(24);
  const [codec, setCodec] = useState<Codec>("h265");
  const [audio, setAudio] = useState(false);
  const [recordStream, setRecordStream] = useState<StreamChoice>("mainstream");
  const [exportOpen, setExportOpen] = useState(false);

  const [mainstream, setMainstream] = useState<StreamConfig>({
    resolution: "1080p",
    fps: 15,
    quality: "medium",
  });
  const [substream, setSubstream] = useState<StreamConfig>({
    resolution: "VGA",
    fps: 10,
    quality: "low",
  });

  const input = useMemo(
    () => ({
      cameras,
      hddTB,
      hoursPerDay,
      codec,
      audio,
      recordStream,
      mainstream,
      substream,
    }),
    [cameras, hddTB, hoursPerDay, codec, audio, recordStream, mainstream, substream]
  );

  const result = useMemo(() => calculate(input), [input]);

  const chartData = useMemo(() => {
    const points = 8;
    const maxCams = Math.max(cameras, points);
    return Array.from({ length: points }, (_, i) => {
      const camCount = Math.max(1, Math.round(((i + 1) / points) * maxCams));
      const r = calculate({
        cameras: camCount,
        hddTB,
        hoursPerDay,
        codec,
        audio,
        recordStream,
        mainstream,
        substream,
      });
      return { cameras: camCount, days: Number(r.days.toFixed(1)) };
    });
  }, [cameras, hddTB, hoursPerDay, codec, audio, recordStream, mainstream, substream]);

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Recording parameters</CardTitle>
          <CardDescription>
            Choose which stream to record. Only the selected stream counts
            toward storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cameras">Number of cameras</Label>
              <Input
                id="cameras"
                type="number"
                min={1}
                max={512}
                value={cameras}
                onChange={(e) =>
                  setCameras(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hdd">HDD volume (TB)</Label>
              <Input
                id="hdd"
                type="number"
                min={0.5}
                step={0.5}
                value={hddTB}
                onChange={(e) =>
                  setHddTB(Math.max(0.1, Number(e.target.value) || 0))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Codec (applies to both streams)</Label>
              <Select
                value={codec}
                onValueChange={(v) => setCodec(v as Codec)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CODEC_LABEL) as Codec[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CODEC_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hours">Recording hours / day</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {hoursPerDay} h
                </span>
              </div>
              <Slider
                id="hours"
                min={1}
                max={24}
                step={1}
                value={[hoursPerDay]}
                onValueChange={(v) =>
                  setHoursPerDay(
                    Array.isArray(v) ? v[0] ?? hoursPerDay : v
                  )
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Record from</Label>
            <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
              {(["mainstream", "substream"] as StreamChoice[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRecordStream(s)}
                  className={
                    "rounded-md px-3 py-1.5 capitalize transition-colors " +
                    (recordStream === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StreamEditor
              title="Mainstream"
              description="High-quality recording stream"
              value={mainstream}
              onChange={setMainstream}
              active={recordStream === "mainstream"}
            />
            <StreamEditor
              title="Substream"
              description="Lower-res stream for live view / mobile"
              value={substream}
              onChange={setSubstream}
              fpsMax={20}
              active={recordStream === "substream"}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audio">Record audio</Label>
              <p className="text-xs text-muted-foreground">
                Adds ~96 kbps per camera
              </p>
            </div>
            <Switch id="audio" checked={audio} onCheckedChange={setAudio} />
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Estimated retention</CardTitle>
            <CardDescription>
              {cameras} camera{cameras === 1 ? "" : "s"} · {hddTB} TB ·{" "}
              {CODEC_LABEL[codec]}
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExportOpen(true)}
          >
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="text-4xl font-semibold tracking-tight tabular-nums">
              {formatDays(result.days)}
            </div>
            <p className="text-sm text-muted-foreground">
              {result.days > 0
                ? `${result.days.toFixed(1)} days · ${Math.round(result.hours).toLocaleString()} hours`
                : "Increase storage or reduce inputs"}
            </p>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {recordStream} (recorded)
              </span>
              <span className="tabular-nums">
                {result[recordStream].bitrateMbps.toFixed(2)} Mbps ·{" "}
                {result[recordStream].gbPerDay.toFixed(2)} GB/day
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground/70">
              <span className="capitalize">
                {recordStream === "mainstream" ? "substream" : "mainstream"} (not
                recorded)
              </span>
              <span className="tabular-nums">
                {result[
                  recordStream === "mainstream" ? "substream" : "mainstream"
                ].bitrateMbps.toFixed(2)} Mbps
              </span>
            </div>
            {audio && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Audio</span>
                <span className="tabular-nums">
                  {result.audioMbps.toFixed(3)} Mbps
                </span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-medium">
              <span>Per camera total</span>
              <span className="tabular-nums">
                {result.bitratePerCameraMbps.toFixed(2)} Mbps ·{" "}
                {result.perCameraGBPerDay.toFixed(2)} GB/day
              </span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span>All cameras / day</span>
              <span className="tabular-nums">
                {result.totalGBPerDay.toFixed(1)} GB
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Usable storage</span>
              <span className="tabular-nums">
                {result.usableGB.toFixed(0)} GB
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">Days vs. cameras</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="cameras" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v ?? 0} days`, "Retention"]}
                  />
                  <Bar
                    dataKey="days"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        input={input}
        result={result}
      />
    </div>
  );
}
