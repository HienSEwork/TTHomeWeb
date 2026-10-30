import { describe, expect, it } from "vitest";
import { APPOINTMENTS, TODAY } from "./index";
import { PROJECTS } from "./listings";

const vnDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
const vnTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

describe("mock dates", () => {
  it("schedules today's first appointment today at 09:00 Ho Chi Minh City time", () => {
    const first = APPOINTMENTS[0]!;
    expect(vnDay(first.scheduledAt)).toBe(TODAY);
    expect(vnTime(first.scheduledAt)).toBe("09:00");
  });

  it("never dates a vacant room before today", () => {
    const vacant = PROJECTS.flatMap((p) => p.rooms).filter((r) => r.status === "available");
    expect(vacant.every((r) => r.availableFrom >= TODAY)).toBe(true);
  });
});
