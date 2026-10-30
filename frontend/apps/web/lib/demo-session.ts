import { DEMO_ACCOUNTS, WEB_SESSION_COOKIE } from "@tthome/data";

/** The demo keeps the signed-in user in a plain cookie; there is no backend to issue tokens. */
const MAX_AGE = 60 * 60 * 24 * 7;

export function startDemoSession(email: string): void {
  document.cookie = `${WEB_SESSION_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function endDemoSession(): void {
  document.cookie = `${WEB_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/** True when the cookie holds the demo user's email. Reads `document.cookie` unless a cookie string is given. */
export function hasDemoSession(cookie: string = typeof document === "undefined" ? "" : document.cookie): boolean {
  return isDemoUser(
    cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${WEB_SESSION_COOKIE}=`))
      ?.slice(WEB_SESSION_COOKIE.length + 1),
  );
}

/** Whether a raw cookie value is the demo user's session. */
export function isDemoUser(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return decodeURIComponent(value) === DEMO_ACCOUNTS.user.email;
  } catch {
    return false;
  }
}

/** Only same-site paths are followed after sign-in. */
export function safeNext(next: string | null | undefined, fallback = "/tai-khoan/ho-so"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
