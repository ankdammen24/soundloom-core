import { apiClient } from "@/lib/api/client";
import type { Track } from "@/lib/api/types";
import { useSyncExternalStore } from "react";

type State = { currentTrack: Track | null; queue: Track[]; isPlaying: boolean; shuffle: boolean; repeat: "off"|"one"|"all"; volume: number; playbackUrl: string | null };
const state: State = { currentTrack: null, queue: [], isPlaying: false, shuffle: false, repeat: "off", volume: 0.8, playbackUrl: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => { Object.assign(state, patch); emit(); };
export const playerStore = {
  subscribe: (l: () => void) => (listeners.add(l), () => listeners.delete(l)),
  getSnapshot: () => state,
  async playTrack(track: Track, queue: Track[] = []) { const t = await apiClient.requestPlaybackToken(track.id); set({ currentTrack: track, queue, playbackUrl: t.playbackUrl, isPlaying: true }); },
  setPlaying: (isPlaying: boolean) => set({ isPlaying }),
  setVolume: (volume: number) => set({ volume }),
  toggleShuffle: () => set({ shuffle: !state.shuffle }),
  cycleRepeat: () => set({ repeat: state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off" }),
  next: async () => { if (!state.currentTrack || state.queue.length === 0) return; const idx = state.queue.findIndex((t) => t.id === state.currentTrack?.id); const nextTrack = state.shuffle ? state.queue[Math.floor(Math.random()*state.queue.length)] : state.queue[(idx + 1) % state.queue.length]; await playerStore.playTrack(nextTrack, state.queue); },
  previous: async () => { if (!state.currentTrack || state.queue.length === 0) return; const idx = state.queue.findIndex((t) => t.id === state.currentTrack?.id); const prevTrack = state.queue[(idx - 1 + state.queue.length) % state.queue.length]; await playerStore.playTrack(prevTrack, state.queue); },
};
export function usePlayerStore() { return useSyncExternalStore(playerStore.subscribe, playerStore.getSnapshot); }
