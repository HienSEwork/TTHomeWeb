import { describe, expect, it } from "vitest";
import { hasDemoSession, isDemoUser, safeNext } from "./demo-session";

describe("demo session", () => {
  it("recognises the demo user's cookie only", () => {
    expect(hasDemoSession("theme=light; tthome_demo_user=nguoidung%40tthome.demo")).toBe(true);
    expect(hasDemoSession("tthome_demo_user=someone%40example.com")).toBe(false);
    expect(hasDemoSession("")).toBe(false);
    expect(isDemoUser("%E0%A4%A")).toBe(false);
  });

  it("follows only same-site paths after sign-in", () => {
    expect(safeNext("/tai-khoan/da-luu")).toBe("/tai-khoan/da-luu");
    expect(safeNext("//evil.example")).toBe("/tai-khoan/ho-so");
    expect(safeNext("https://evil.example")).toBe("/tai-khoan/ho-so");
    expect(safeNext(null)).toBe("/tai-khoan/ho-so");
  });
});
