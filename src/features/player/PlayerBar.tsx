import { Pause, Play, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";
import { playerStore, usePlayerStore } from "./player-store";
export function PlayerBar() {
  const s = usePlayerStore();
  return <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-3">
    <div className="mx-auto flex max-w-6xl items-center gap-3">
      <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{s.currentTrack?.title ?? "Nothing playing"}</div></div>
      <button onClick={() => playerStore.toggleShuffle()}><Shuffle className="h-4 w-4" /></button>
      <button onClick={() => void playerStore.previous()}><SkipBack className="h-4 w-4" /></button>
      <button onClick={() => playerStore.setPlaying(!s.isPlaying)}>{s.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
      <button onClick={() => void playerStore.next()}><SkipForward className="h-4 w-4" /></button>
      <button onClick={() => playerStore.cycleRepeat()}><Repeat className="h-4 w-4" /></button>
      <input type="range" min={0} max={1} step={0.01} value={s.volume} onChange={(e) => playerStore.setVolume(Number(e.target.value))} />
    </div>
  </div>;
}
