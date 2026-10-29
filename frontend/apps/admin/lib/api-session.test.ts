import { afterEach, describe, expect, it, vi } from "vitest";
import { withQuery } from "./api";
import { refreshOnce } from "./refresh";
import { breakdown, dailySeries, nameIndex, unavailableLabels, vnDay, vnDayBounds } from "./report";
import { accessTokenFresh } from "./session";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function jwt(expSeconds: number): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "HS256" })}.${b64({ sub: "u", exp: expSeconds })}.sig`;
}

describe("accessTokenFresh", () => {
  const now = Date.UTC(2026, 9, 29, 12);
  it("accepts a token with more than 30 seconds left", () => {
    expect(accessTokenFresh(jwt(now / 1000 + 120), now)).toBe(true);
  });
  it("rejects a token about to expire, a missing token and garbage", () => {
    expect(accessTokenFresh(jwt(now / 1000 + 10), now)).toBe(false);
    expect(accessTokenFresh(undefined, now)).toBe(false);
    expect(accessTokenFresh("not-a-jwt", now)).toBe(false);
  });
});

describe("refreshOnce", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends one refresh for parallel requests that carry the same token", async () => {
    const tokens = { accessToken: "a2", accessExpiresAt: "2026-10-29T13:00:00Z", refreshToken: "r2", refreshExpiresAt: "2026-11-29T13:00:00Z" };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(tokens), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const results = await Promise.all([refreshOnce("r1-shared"), refreshOnce("r1-shared"), refreshOnce("r1-shared")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([tokens, tokens, tokens]);
  });

  it("returns null when the refresh token is rejected or the gateway is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    expect(await refreshOnce("r-rejected")).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await refreshOnce("r-down")).toBeNull();
  });
});

describe("report helpers", () => {
  it("uses the Vietnam calendar day, not UTC", () => {
    expect(vnDay(new Date("2026-10-29T18:30:00Z"))).toBe("2026-10-30");
    expect(vnDayBounds("2026-10-30")).toEqual({ from: "2026-10-29T17:00:00.000Z", to: "2026-10-30T17:00:00.000Z" });
  });

  it("fills a 30 day series ending today with zeros for quiet days", () => {
    const series = dailySeries([{ day: "2026-10-28", count: 5 }], new Date("2026-10-29T05:00:00Z"));
    expect(series).toHaveLength(30);
    expect(series.at(-1)).toEqual({ day: "2026-10-29", value: 0 });
    expect(series.at(-2)).toEqual({ day: "2026-10-28", value: 5 });
    expect(series[0]!.day).toBe("2026-09-30");
  });

  it("orders a breakdown by count and drops empty keys", () => {
    expect(breakdown({ web: 3, zalo: 7, tiktok: 0 }, { web: "Website", zalo: "Zalo", tiktok: "TikTok" })).toEqual([
      { label: "Zalo", value: 7 },
      { label: "Website", value: 3 },
    ]);
  });

  it("names services once and indexes names by id", () => {
    expect(unavailableLabels(["listing", "booking", "listing"])).toEqual(["phòng", "lịch hẹn"]);
    expect(nameIndex([{ id: "p1", name: "Riverside" }, { id: "u1", fullName: "Lan" }]).get("u1")).toBe("Lan");
  });

  it("builds a query string without empty values", () => {
    expect(withQuery("/x", { a: 1, b: "", c: null, d: "q r" })).toBe("/x?a=1&d=q+r");
    expect(withQuery("/x")).toBe("/x");
  });
});
