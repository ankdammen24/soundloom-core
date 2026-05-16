import { useEffect, useRef } from "react";
import { playerStore, usePlayerStore } from "./player-store";
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const s = usePlayerStore();
  useEffect(() => { if (audioRef.current && s.playbackUrl) audioRef.current.src = s.playbackUrl; }, [s.playbackUrl]);
  useEffect(() => { if (!audioRef.current) return; s.isPlaying ? audioRef.current.play().catch(() => null) : audioRef.current.pause(); }, [s.isPlaying]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = s.volume; }, [s.volume]);
  return <audio ref={audioRef} onEnded={() => void playerStore.next()} />;
}
