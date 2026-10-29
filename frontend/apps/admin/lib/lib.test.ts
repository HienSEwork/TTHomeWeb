import { SUBMISSIONS } from "@tthome/data";
import { describe, expect, it } from "vitest";
import { linearScale, nearestIndex, niceTicks, shares } from "./chart";
import { countBy, groupByDay, matchesQuery, toCsv } from "./filters";
import { APPOINTMENT_TRANSITIONS, canMove, reviewReducer } from "./workflow";

describe("chart helpers", () => {
  it("maps a domain onto a range", () => {
    const y = linearScale([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
  });

  it("rounds ticks up to a nice step", () => {
    expect(niceTicks(1873)).toEqual([0, 500, 1000, 1500, 2000]);
    expect(niceTicks(0)).toEqual([0]);
  });

  it("finds the nearest point for a crosshair", () => {
    expect(nearestIndex([0, 10, 20, 30], 17)).toBe(2);
  });

  it("turns values into shares that sum to 1", () => {
    const s = shares([1, 1, 2]);
    expect(s).toEqual([0.25, 0.25, 0.5]);
    expect(shares([0, 0])).toEqual([0, 0]);
  });
});

describe("filters", () => {
  it("matches words without accents", () => {
    expect(matchesQuery("nguyen van", "Nguyễn Văn Phước", "0903")).toBe(true);
    expect(matchesQuery("le loi", "Nguyễn Văn Phước")).toBe(false);
    expect(matchesQuery("  ", "anything")).toBe(true);
  });

  it("counts every key, including empty ones", () => {
    const c = countBy(["a", "a", "b"], ["a", "b", "c"] as const, (x) => x as "a" | "b" | "c");
    expect(c).toEqual({ a: 2, b: 1, c: 0 });
  });

  it("groups by Vietnam calendar day", () => {
    const groups = groupByDay(["2026-10-29T17:30:00Z", "2026-10-29T02:00:00Z"], (x) => x);
    expect(groups.map((g) => g.day)).toEqual(["2026-10-29", "2026-10-30"]);
  });

  it("escapes quotes in CSV", () => {
    expect(toCsv([["a", 'b"c']])).toBe('﻿"a","b""c"');
  });
});

describe("workflow", () => {
  it("allows only legal appointment moves", () => {
    expect(canMove(APPOINTMENT_TRANSITIONS, "pending", "confirmed")).toBe(true);
    expect(canMove(APPOINTMENT_TRANSITIONS, "completed", "pending")).toBe(false);
  });

  it("records a consignment decision in the review log", () => {
    const code = SUBMISSIONS.find((s) => s.status === "submitted")!.code;
    const next = reviewReducer(SUBMISSIONS, { type: "decide", code, to: "need_info", by: "Lê Ngọc Hân", at: "2026-10-29T03:00:00Z", reason: "Thiếu ảnh WC" });
    const changed = next.find((s) => s.code === code)!;
    expect(changed.status).toBe("need_info");
    expect(changed.log[0]).toMatchObject({ by: "Lê Ngọc Hân", text: "Yêu cầu bổ sung: Thiếu ảnh WC" });
  });

  it("ignores a decision on a finished consignment", () => {
    const rejected = SUBMISSIONS.find((s) => s.status === "rejected")!;
    const next = reviewReducer(SUBMISSIONS, { type: "decide", code: rejected.code, to: "approved", by: "x", at: "2026-10-29T03:00:00Z", reason: "" });
    expect(next.find((s) => s.code === rejected.code)).toBe(rejected);
  });
});
