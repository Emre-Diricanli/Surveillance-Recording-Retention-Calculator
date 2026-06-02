import Calculator from "@/components/calculator";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              Surveillance Recording Retention Calculator · Storage planning
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Recording retention calculator
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Estimate how many days of footage your NVR can keep given camera
              count, storage volume, resolution, and recording schedule.
            </p>
          </div>
        </header>

        <Calculator />

        <footer className="mt-10 text-xs text-muted-foreground">
          Bitrate model: bits-per-pixel × FPS × codec factor (H.264, H.264+,
          H.265, H.265+). Estimates assume CBR-like steady state; actual usage
          varies with scene complexity and encoder tuning.
        </footer>
      </main>
    </div>
  );
}
