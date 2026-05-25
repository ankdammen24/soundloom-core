// Health probes for the media-catalog backend. Auth is not required.

import { api } from "./client";

export type HealthStatus = {
  ok: boolean;
  status?: string;
  latency_ms?: number;
  raw?: unknown;
};

async function probe(path: string): Promise<HealthStatus> {
  const start = performance.now();
  try {
    const raw = await api.get<unknown>(path, { skipAuth: true });
    const status =
      raw && typeof raw === "object" && "status" in raw
        ? String((raw as { status: unknown }).status)
        : "ok";
    return {
      ok: status === "ok" || status === "up" || status === "healthy",
      status,
      latency_ms: Math.round(performance.now() - start),
      raw,
    };
  } catch (e) {
    return {
      ok: false,
      status: (e as Error).message,
      latency_ms: Math.round(performance.now() - start),
    };
  }
}

export const healthApi = {
  api: () => probe("/health"),
  storage: () => probe("/health/storage"),
  database: () => probe("/health/database"),
};
