import { useState } from "react";

export function useAutoRefresh(defaultMs = 10_000) {
  const [enabled, setEnabled] = useState(true);
  const [intervalMs] = useState(defaultMs);
  return {
    enabled,
    intervalMs,
    refetchInterval: enabled ? intervalMs : false as const,
    toggle: () => setEnabled((v) => !v),
  };
}
