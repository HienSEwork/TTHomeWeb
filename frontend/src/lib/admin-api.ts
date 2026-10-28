"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

export async function adminApi<T = void>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(res.status, err.code ?? "UNKNOWN");
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Loads a GET endpoint; `reload` fetches again after a change. `path` null waits.
export function useAdminQuery<T>(path: string | null) {
  const [tick, setTick] = useState(0);
  const key = `${tick}:${path}`;
  const [result, setResult] = useState<{ key: string; data?: T; error?: unknown }>();

  useEffect(() => {
    if (path === null) return;
    let live = true;
    adminApi<T>(path)
      .then((data) => live && setResult({ key, data }))
      .catch((error) => live && setResult({ key, error }));
    return () => {
      live = false;
    };
  }, [path, key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const settled = result?.key === key;
  return { data: result?.data, error: settled ? result.error : undefined, loading: path !== null && !settled, reload };
}
