import { ADMIN_SESSION_COOKIE, DEMO_ACCOUNTS } from "@tthome/data";

/**
 * The demo has no identity-service: signing in checks the demo admin account
 * locally and keeps its email in an httpOnly cookie scoped to /admin.
 */
export const SESSION_COOKIE = ADMIN_SESSION_COOKIE;

const MAX_AGE = 60 * 60 * 8;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge: MAX_AGE,
  };
}

/** Whether a raw cookie value is the demo admin's session. */
export function isAdminSession(value: string | undefined): boolean {
  return value === DEMO_ACCOUNTS.admin.email;
}
