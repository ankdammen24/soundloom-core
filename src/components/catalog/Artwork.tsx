import { Music2 } from "lucide-react";

export function Artwork({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-md bg-gradient-to-br from-muted to-muted/40 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
          <Music2 className="h-1/3 w-1/3" strokeWidth={1.2} />
        </div>
      )}
    </div>
  );
}
