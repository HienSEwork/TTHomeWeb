import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handle } from "./bff";

const tokens = {
  accessToken: "AT1",
  accessExpiresAt: "2030-01-01T00:00:00Z",
  refreshToken: "RT1",
  refreshExpiresAt: "2030-02-01T00:00:00Z",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const req = (method: string, cookie = "", body?: unknown) =>
  new NextRequest("http://web/api/auth/x", {
    method,
    headers: cookie ? { cookie } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  });

afterEach(() => vi.restoreAllMocks());

describe("bff", () => {
  it("turns a token pair into httpOnly cookies and hides it from the browser", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json(tokens));
    const res = await handle(req("POST", "", { identifier: "a", password: "b" }), ["login"]);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.cookies.get("tt_at")?.value).toBe("AT1");
    expect(res.cookies.get("tt_at")?.httpOnly).toBe(true);
    expect(res.cookies.get("tt_rt")?.value).toBe("RT1");
  });

  it("relays backend errors untouched and sets no cookies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ code: "INVALID_CREDENTIALS" }, 401));
    const res = await handle(req("POST", "", {}), ["login"]);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ code: "INVALID_CREDENTIALS" });
    expect(res.cookies.getAll()).toHaveLength(0);
  });

  it("refreshes once on 401 and retries with the new access token", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({ code: "TOKEN_INVALID" }, 401))
      .mockResolvedValueOnce(json({ ...tokens, accessToken: "AT2" }))
      .mockResolvedValueOnce(json({ id: "u1", roles: [] }));
    const res = await handle(req("GET", "tt_at=old; tt_rt=RT0"), ["me"]);
    expect(res.status).toBe(200);
    expect(res.cookies.get("tt_at")?.value).toBe("AT2");
    expect((fetchMock.mock.calls[2][1]?.headers as Record<string, string>).Authorization).toBe("Bearer AT2");
  });

  it("clears the session when refresh fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({}, 401));
    const res = await handle(req("GET", "tt_at=old; tt_rt=RT0"), ["me"]);
    expect(res.status).toBe(401);
    expect(res.cookies.get("tt_rt")?.value).toBe("");
  });

  it("does not forward unknown paths", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const res = await handle(req("POST", "", {}), ["refresh"]);
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
