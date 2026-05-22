export function JsonView({ data }: { data: unknown }) {
  let pretty: string;
  try {
    pretty = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch {
    pretty = String(data);
  }
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] bg-muted/40 rounded p-2 max-h-96 overflow-auto">
      {pretty}
    </pre>
  );
}
