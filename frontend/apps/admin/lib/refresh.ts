import { apiBaseUrl, type TokenPair } from "./session";

// identity-service treats reuse of a rotated refresh token as theft and revokes every session, so parallel requests
// that carry the same expiring token must share one refresh call and its result.
// shortcut: per-process only; move to a shared store if the admin app ever runs as several instances.
const inflight = new Map<string, Promise<TokenPair | null>>();

async function rotate(refreshToken: string): Promise<TokenPair | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as TokenPair) : null;
  } catch {
    return null;
  }
}

export function refreshOnce(refreshToken: string): Promise<TokenPair | null> {
  let pending = inflight.get(refreshToken);
  if (!pending) {
    pending = rotate(refreshToken);
    inflight.set(refreshToken, pending);
    // Keep the answer briefly for requests that were already on their way with the old token.
    void pending.finally(() => setTimeout(() => inflight.delete(refreshToken), 15_000));
  }
  return pending;
}
