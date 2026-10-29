import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signIn } from "./actions";

const jar = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => jar }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT ${to}`);
  }),
}));

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const initial = { error: null, email: "" };

describe("signIn", () => {
  beforeEach(() => jar.set.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("checks the email and password before calling the server", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await signIn(initial, form({ email: "nope", password: "12345678" }))).error).toMatch(/^Nhập email/);
    expect((await signIn(initial, form({ email: "a@tthome.vn", password: "short" }))).error).toMatch(/^Mật khẩu/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains a wrong password and keeps the typed email", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    expect(await signIn(initial, form({ email: "a@tthome.vn", password: "12345678" }))).toEqual({
      error: "Email hoặc mật khẩu không đúng.",
      email: "a@tthome.vn",
    });
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("stores both tokens in httpOnly cookies and opens the dashboard", async () => {
    const tokens = { accessToken: "at", accessExpiresAt: "2026-10-29T13:00:00Z", refreshToken: "rt", refreshExpiresAt: "2026-11-29T13:00:00Z" };
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(tokens), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(signIn(initial, form({ email: "a@tthome.vn", password: "12345678", remember: "on" }))).rejects.toThrow("REDIRECT /");
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({ identifier: "a@tthome.vn", password: "12345678", rememberMe: true });
    expect(jar.set).toHaveBeenCalledWith("tthome_admin_at", "at", expect.objectContaining({ httpOnly: true, path: "/admin" }));
    expect(jar.set).toHaveBeenCalledWith("tthome_admin_rt", "rt", expect.objectContaining({ httpOnly: true }));
  });
});
