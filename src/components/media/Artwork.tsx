import { useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function Artwork({
  src,
  seed = "",
  size = "md",
  className,
  alt,
}: {
  src?: string | null;
  seed?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dims = {
    sm: "h-10 w-10 rounded-md",
    md: "h-14 w-14 rounded-lg",
    lg: "h-32 w-32 rounded-xl",
    xl: "h-48 w-48 md:h-56 md:w-56 rounded-2xl",
  }[size];

  const hue = hashHue(seed || alt || "x");
  const bg = `linear-gradient(135deg, oklch(0.55 0.18 ${hue}) 0%, oklch(0.35 0.14 ${(hue + 60) % 360}) 100%)`;

  if (src && !errored) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", dims, className)}>
        {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
        <img
          src={src}
          alt={alt ?? "artwork"}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    );
  }
  return (
    <div
      className={cn("grid place-items-center text-white/90 shadow-sm", dims, className)}
      style={{ background: bg }}
      aria-label={alt ?? "artwork placeholder"}
    >
      <Music2
        className={cn(
          size === "xl" ? "h-12 w-12" : size === "lg" ? "h-8 w-8" : "h-5 w-5",
          "opacity-80",
        )}
      />
    </div>
  );
}
