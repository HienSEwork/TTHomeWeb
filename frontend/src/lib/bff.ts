import { NextRequest, NextResponse } from "next/server";

const API = process.env.TTHOME_API_URL ?? "http://localhost:8081";
const AT = "tt_at";
const RT = "tt_rt";

// Endpoints that return a TokenPair: the browser never sees the tokens, only the cookies.
const SIGN_IN = new Set(["login", "login/otp/verify", "register/phone/verify", "register/email/verify"]);
const PUBLIC = new Set([
  ...SIGN_IN,
  "register/phone/request", "login/otp/request", "register/email", "password/forgot", "password/reset",
]);
const PRIVATE = new Set(["me", "logout-all", "password/change", "contact/change/request", "contact/change/confirm"]);

type Tokens = { accessToken: string; accessExpiresAt: string; refreshToken: string; refreshExpiresAt: string };

function setSession(res: NextResponse, t: Tokens) {
  const base = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;
  res.cookies.set(AT, t.accessToken, { ...base, expires: new Date(t.accessExpiresAt) });
  res.cookies.set(RT, t.refreshToken, { ...base, expires: new Date(t.refreshExpiresAt) });
}

function clearSession(res: NextResponse) {
  res.cookies.delete(AT);
  res.cookies.delete(RT);
}

const send = (url: string, method: string, body?: string, bearer?: string) =>
  fetch(`${API}${url}`, {
    method,
    headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body,
    cache: "no-store",
  });

const call = (path: string, method: string, body?: string, bearer?: string) =>
  send(`/api/v1/auth/${path}`, method, body, bearer);

const relay = async (up: Response) => {
  const headers: Record<string, string> = { "Content-Type": up.headers.get("Content-Type") ?? "application/json" };
  const disposition = up.headers.get("Content-Disposition");
  if (disposition) headers["Content-Disposition"] = disposition;
  return new NextResponse(up.status === 204 ? null : await up.arrayBuffer(), { status: up.status, headers });
};

export async function handle(req: NextRequest, segments: string[]): Promise<NextResponse> {
  const path = segments.join("/");
  const body = req.method === "GET" ? undefined : await req.text();
  const rt = req.cookies.get(RT)?.value;

  if (path === "logout" && req.method === "POST") {
    if (rt) await call("logout", "POST", JSON.stringify({ refreshToken: rt })).catch(() => undefined);
    const res = new NextResponse(null, { status: 204 });
    clearSession(res);
    return res;
  }

  if (req.method === "POST" && PUBLIC.has(path)) {
    const up = await call(path, "POST", body);
    if (!up.ok || !SIGN_IN.has(path)) return relay(up);
    const res = NextResponse.json({ ok: true });
    setSession(res, (await up.json()) as Tokens);
    return res;
  }

  if (PRIVATE.has(path) && req.method === (path === "me" ? "GET" : "POST")) {
    return forward(req, `/api/v1/auth/${path}`, body);
  }

  return NextResponse.json({ code: "NOT_FOUND", message: "Unknown endpoint" }, { status: 404 });
}

// Sends an authenticated call; on 401 refreshes the session once and retries.
export async function forward(req: NextRequest, url: string, body?: string): Promise<NextResponse> {
  const at = req.cookies.get(AT)?.value;
  const rt = req.cookies.get(RT)?.value;
  const up = await send(url, req.method, body, at);
  if (up.status !== 401 || !rt) return relay(up);

  const refreshed = await call("refresh", "POST", JSON.stringify({ refreshToken: rt }));
  if (!refreshed.ok) {
    const res = NextResponse.json({ code: "TOKEN_INVALID", message: "Session expired" }, { status: 401 });
    clearSession(res);
    return res;
  }
  const tokens = (await refreshed.json()) as Tokens;
  const res = await relay(await send(url, req.method, body, tokens.accessToken));
  setSession(res, tokens);
  return res;
}
