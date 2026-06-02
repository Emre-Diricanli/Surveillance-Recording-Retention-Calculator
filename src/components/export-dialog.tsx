"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Receipt } from "@/components/receipt";
import { buildReceiptText } from "@/lib/receipt-text";
import type { CalcInput, CalcResult } from "@/lib/storage";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: CalcInput;
  result: CalcResult;
}

function makeEstimateId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${ts}-${rand}`;
}

export function ExportDialog({
  open,
  onOpenChange,
  input,
  result,
}: ExportDialogProps) {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [meta, setMeta] = useState<{ id: string; at: Date } | null>(null);
  const [busy, setBusy] = useState<null | "pdf" | "png" | "txt" | "copy">(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setMeta({ id: makeEstimateId(), at: new Date() });
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open || !meta) return null;

  const handlePdf = () => {
    setBusy("pdf");
    setTimeout(() => {
      window.print();
      setBusy(null);
    }, 50);
  };

  const handlePng = async () => {
    if (!receiptRef.current) return;
    setBusy("png");
    try {
      const { toPng } = await import("html-to-image");
      const node = receiptRef.current;
      const rect = node.getBoundingClientRect();
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        canvasWidth: Math.ceil(rect.width),
        canvasHeight: Math.ceil(rect.height),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `surveillance-retention-${meta.id}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  };

  const handleTxt = () => {
    setBusy("txt");
    const text = buildReceiptText(input, result, meta.at, meta.id);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `surveillance-retention-${meta.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(null);
  };

  const handleCopy = async () => {
    setBusy("copy");
    try {
      const text = buildReceiptText(input, result, meta.at, meta.id);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:bg-white print:p-0"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl print:max-h-none print:overflow-visible print:rounded-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3 print:hidden">
          <div>
            <h2 className="text-base font-semibold">Export estimate</h2>
            <p className="text-xs text-muted-foreground">
              Choose a format below or print to PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto bg-muted/40 p-6 print:overflow-visible print:bg-white print:p-0">
          <div id="printable-receipt" className="flex justify-center">
            <Receipt
              ref={receiptRef}
              input={input}
              result={result}
              generatedAt={meta.at}
              estimateId={meta.id}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-background px-5 py-3 print:hidden">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={busy !== null}
          >
            {copied ? "Copied" : "Copy text"}
          </Button>
          <Button
            variant="outline"
            onClick={handleTxt}
            disabled={busy !== null}
          >
            {busy === "txt" ? "Saving…" : "Download .txt"}
          </Button>
          <Button
            variant="outline"
            onClick={handlePng}
            disabled={busy !== null}
          >
            {busy === "png" ? "Rendering…" : "Download PNG"}
          </Button>
          <Button onClick={handlePdf} disabled={busy !== null}>
            {busy === "pdf" ? "Opening…" : "Save as PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
