import { API_BASE_URL } from "@/lib/api";

export function PreviewPlayer({ trackId }: { trackId: string }) {
  const src = `${API_BASE_URL}/playback/${trackId}/preview`;

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-sm font-medium">Preview</p>
      <audio controls src={src} className="w-full" />
    </div>
  );
}
