import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("checks the email and password format first", async () => {
    expect((await signIn(initial, form({ email: "nope", password: "12345678" }))).error).toMatch(/^Nhập email/);
    expect((await signIn(initial, form({ email: "admin@tthome.demo", password: "short" }))).error).toMatch(/^Mật khẩu/);
  });

  it("explains wrong credentials and keeps the typed email", async () => {
    const state = await signIn(initial, form({ email: "admin@tthome.demo", password: "Sai@20266" }));
    expect(state.error).toMatch(/^Email hoặc mật khẩu không đúng/);
    expect(state.email).toBe("admin@tthome.demo");
    expect(jar.set).not.toHaveBeenCalled();
  });

  it("stores the demo admin session in an httpOnly cookie and opens the dashboard", async () => {
    await expect(signIn(initial, form({ email: "admin@tthome.demo", password: "Demo@2026" }))).rejects.toThrow("REDIRECT /");
    expect(jar.set).toHaveBeenCalledWith("tthome_demo_admin", "admin@tthome.demo", expect.objectContaining({ httpOnly: true, path: "/admin" }));
  });
});
