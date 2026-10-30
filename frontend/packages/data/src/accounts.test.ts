import { describe, expect, it } from "vitest";
import { checkDemoCredentials, checkDemoPhone, DEMO_ACCOUNTS, DEMO_OTP } from "./accounts";

describe("demo accounts", () => {
  it("accepts the demo user and admin with their password", () => {
    expect(checkDemoCredentials("user", "nguoidung@tthome.demo", "Demo@2026")?.name).toBe("Nguyễn Minh Anh");
    expect(checkDemoCredentials("admin", " Admin@TTHome.demo ", "Demo@2026")?.role).toBe("admin");
  });

  it("rejects a wrong password or the other app's account", () => {
    expect(checkDemoCredentials("user", "nguoidung@tthome.demo", "demo@2026")).toBeNull();
    expect(checkDemoCredentials("admin", "nguoidung@tthome.demo", "Demo@2026")).toBeNull();
  });

  it("signs the demo user in by phone with the demo code", () => {
    expect(checkDemoPhone(DEMO_ACCOUNTS.user.phone.replace(/\s/g, ""), DEMO_OTP)?.email).toBe(DEMO_ACCOUNTS.user.email);
    expect(checkDemoPhone(DEMO_ACCOUNTS.user.phone, "000000")).toBeNull();
  });
});
