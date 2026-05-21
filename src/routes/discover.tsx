import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { playerStore } from "@/features/player/player-store";
const URL = "https://soundloom-core.lovable.app/discover";
export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover – Soundloom" },
      { name: "description", content: "Discover new and featured tracks across the Soundloom music catalog for Media Rosenqvist services." },
      { property: "og:title", content: "Discover – Soundloom" },
      { property: "og:description", content: "New and featured tracks in the Media Rosenqvist music catalog." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Discover,
});

function Discover(){ const tracks = useQuery({queryKey:["tracks"], queryFn: apiClient.getTracks});
 if(tracks.isLoading) return <p>Loading discover…</p>; if(tracks.error) return <p>API nere: {(tracks.error as Error).message}</p>;
 if((tracks.data?.length ?? 0)===0) return <p>Inget sökresultat.</p>;
 return <div className="grid gap-2">{tracks.data!.map(t=><button key={t.id} className="rounded border p-3 text-left" onClick={()=>void playerStore.playTrack(t, tracks.data!)}>{t.title}</button>)}</div>; }
