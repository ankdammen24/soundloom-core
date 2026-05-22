import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropZone({
  onFiles,
  accept = "audio/*",
  multiple = true,
  className,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (e.currentTarget === e.target) setOver(false);
      }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={cn(
        "group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-all",
        over
          ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.01]"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
        className,
      )}
    >
      <div
        className={cn(
          "grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary transition-transform",
          over && "scale-110",
        )}
      >
        <UploadCloud className="h-7 w-7" />
      </div>
      <div className="text-sm font-medium">
        {over ? "Drop to upload" : "Drag audio files here or click to browse"}
      </div>
      <div className="text-xs text-muted-foreground">WAV, FLAC, MP3 — multiple files supported</div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
