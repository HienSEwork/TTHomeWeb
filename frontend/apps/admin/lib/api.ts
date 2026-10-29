import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, apiBaseUrl } from "./session";

/** Spring's PageResponse. */
export type Page<T> = { items: T[]; page: number; size: number; total: number };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | undefined | null>;

export function withQuery(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v != null && v !== "") params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Calls the gateway as the signed-in admin. A 401 means the session is gone, so it goes back to sign-in. */
export async function api<T>(path: string, init?: { method?: string; query?: Query; body?: unknown }): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/dang-nhap");
  const res = await fetch(`${apiBaseUrl()}${withQuery(path, init?.query)}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 401) redirect("/dang-nhap");
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
    throw new ApiError(res.status, err?.code ?? "HTTP_" + res.status, err?.message ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** For panels that should still render when one service is down: the error becomes null instead of failing the page. */
export async function optional<T>(call: Promise<T>): Promise<T | null> {
  try {
    return await call;
  } catch (e) {
    if (e instanceof ApiError || e instanceof TypeError) return null;
    throw e;
  }
}
