import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
export const Route = createFileRoute("/artists")({ component: Artists });
function Artists(){ const q=useQuery({queryKey:["artists"], queryFn: apiClient.getArtists});
 if(q.isLoading) return <p>Loading artists…</p>; if(q.error) return <p>API nere.</p>;
 return <ul className="grid gap-2 sm:grid-cols-2">{q.data?.map(a=><li key={a.id} className="rounded border p-3">{a.displayName ?? a.name}</li>)}</ul>; }
