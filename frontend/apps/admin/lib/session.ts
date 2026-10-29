/** Session tokens issued by identity-service, kept in httpOnly cookies so page code never sees them. */
export const ACCESS_COOKIE = "tthome_admin_at";
export const REFRESH_COOKIE = "tthome_admin_rt";

/** What POST /api/v1/auth/login and /refresh return. */
export type TokenPair = { accessToken: string; accessExpiresAt: string; refreshToken: string; refreshExpiresAt: string };

export function apiBaseUrl(): string {
  return (process.env.API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");
}

export function cookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    expires: new Date(expiresAt),
  };
}

/** Refresh a little before the access token expires so a page never renders with a token that dies mid-request. */
export function accessTokenFresh(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 - now > 30_000;
  } catch {
    return false;
  }
}
