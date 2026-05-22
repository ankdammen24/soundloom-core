import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_DECODE_BYTES = 80 * 1024 * 1024;

async function computePeaks(buffer: ArrayBuffer, buckets: number): Promise<Float32Array> {
  const AC: typeof AudioContext =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const audio = await ctx.decodeAudioData(buffer.slice(0));
    const ch = audio.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(ch.length / buckets));
    const peaks = new Float32Array(buckets);
    for (let i = 0; i < buckets; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, ch.length);
      for (let j = start; j < end; j += 32) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
      peaks[i] = max;
    }
    return peaks;
  } finally {
    if (ctx.state !== "closed") void ctx.close();
  }
}

export function Waveform({
  file,
  url,
  height = 48,
  className,
  buckets = 200,
  progress = 0,
}: {
  file?: File | null;
  url?: string | null;
  height?: number;
  className?: string;
  buckets?: number;
  progress?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [state, setState] = useState<"idle" | "decoding" | "ready" | "skipped" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!file && !url) return;
      setState("decoding");
      try {
        let buf: ArrayBuffer;
        if (file) {
          if (file.size > MAX_DECODE_BYTES) {
            setState("skipped");
            return;
          }
          buf = await file.arrayBuffer();
        } else {
          const res = await fetch(url!);
          const blob = await res.blob();
          if (blob.size > MAX_DECODE_BYTES) {
            setState("skipped");
            return;
          }
          buf = await blob.arrayBuffer();
        }
        const p = await computePeaks(buf, buckets);
        if (!cancelled) {
          setPeaks(p);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [file, url, buckets]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = height;
    c.width = w * dpr;
    c.height = h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const root = getComputedStyle(document.documentElement);
    const mutedC = root.getPropertyValue("--muted-foreground").trim() || "#888";
    const primaryC = root.getPropertyValue("--primary").trim() || "#7c3aed";

    if (!peaks) {
      // shimmer fallback
      ctx.fillStyle = `oklch(${mutedC} / 0.25)`;
      const barW = 2;
      const gap = 1;
      const count = Math.floor(w / (barW + gap));
      for (let i = 0; i < count; i++) {
        const ph = Math.abs(Math.sin(i * 0.4)) * h * 0.5 + 2;
        ctx.fillRect(i * (barW + gap), (h - ph) / 2, barW, ph);
      }
      return;
    }

    const barW = Math.max(1, Math.floor(w / peaks.length) - 1);
    const step = w / peaks.length;
    const playX = w * Math.min(1, Math.max(0, progress));
    for (let i = 0; i < peaks.length; i++) {
      const ph = Math.max(2, peaks[i] * h);
      const x = i * step;
      ctx.fillStyle = x < playX ? `oklch(${primaryC})` : `oklch(${mutedC} / 0.45)`;
      ctx.fillRect(x, (h - ph) / 2, barW, ph);
    }
  }, [peaks, height, progress]);

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} style={{ width: "100%", height }} />
      {state === "decoding" && (
        <div className="absolute inset-0 grid place-items-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Decoding…
        </div>
      )}
      {state === "skipped" && (
        <div className="absolute inset-0 grid place-items-center text-[10px] uppercase tracking-wider text-muted-foreground/60">
          File too large for preview
        </div>
      )}
    </div>
  );
}
