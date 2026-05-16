import { createFileRoute, Link } from "@tanstack/react-router";
export const Route = createFileRoute("/")({ component: Home });
function Home(){return <div className="space-y-4"><h1 className="text-2xl font-semibold">Soundloom</h1><p className="text-muted-foreground">Frontend mot music-catalog-core.</p><div className="flex flex-wrap gap-2">{["discover","releases","artists","tracks"].map(p=><Link key={p} to={`/${p}`} className="rounded border px-3 py-2">/{p}</Link>)}</div></div>}
