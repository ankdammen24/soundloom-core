import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { playerStore } from "@/features/player/player-store";
export const Route = createFileRoute("/tracks")({ component: Tracks });
function Tracks(){ const q=useQuery({queryKey:["tracks"], queryFn: apiClient.getTracks});
 if(q.isLoading) return <p>Loading tracks…</p>; if(q.error) return <p>API nere.</p>; if((q.data?.length ?? 0)===0) return <p>Inga tracks.</p>;
 return <ul className="space-y-2">{q.data!.map(t=><li key={t.id} className="flex items-center justify-between rounded border p-3"><span>{t.title}</span><button className="rounded border px-2 py-1" onClick={()=>void playerStore.playTrack(t,q.data!)}>Play</button></li>)}</ul>; }
