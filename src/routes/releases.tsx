import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
export const Route = createFileRoute("/releases")({ component: Releases });
function Releases(){ const q=useQuery({queryKey:["releases"], queryFn: apiClient.getReleases});
 if(q.isLoading) return <p>Loading releases…</p>; if(q.error) return <p>API nere.</p>; if((q.data?.length ?? 0)===0) return <p>Inga releases.</p>;
 return <ul className="space-y-2">{q.data!.map(r=><li key={r.id} className="rounded border p-3">{r.title}</li>)}</ul>; }
