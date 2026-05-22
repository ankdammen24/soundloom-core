import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Music2 } from "lucide-react";
import { playerStore, usePlayerStore } from "./player-store";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const s = usePlayerStore();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary/40 to-accent text-primary-foreground">
            <Music2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {s.currentTrack?.title ?? "Nothing playing"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {s.currentTrack ? "Catalogus Musicus" : "Pick a track to start"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => playerStore.toggleShuffle()}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            onClick={() => void playerStore.previous()}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={() => playerStore.setPlaying(!s.isPlaying)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30",
              "hover:scale-105 transition-transform",
            )}
            aria-label={s.isPlaying ? "Pause" : "Play"}
          >
            {s.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button
            onClick={() => void playerStore.next()}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next"
          >
            <SkipForward className="h-5 w-5" />
          </button>
          <button
            onClick={() => playerStore.cycleRepeat()}
            className="rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Repeat"
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-end gap-2 text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.volume}
            onChange={(e) => playerStore.setVolume(Number(e.target.value))}
            className="w-28 accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
