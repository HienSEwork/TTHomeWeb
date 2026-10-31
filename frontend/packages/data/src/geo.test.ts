import { describe, expect, it } from "vitest";
import { CITIES, LANDMARKS } from "./geo";

describe("administrative map since 1 July 2025", () => {
  it("lists every commune-level unit of both cities", () => {
    const count = (slug: string) => CITIES.find((c) => c.slug === slug)!.wards.length;
    // NQ 1685/NQ-UBTVQH15 (TP.HCM) and NQ 1668/NQ-UBTVQH15 (TP. Cần Thơ).
    expect(count("ho-chi-minh")).toBe(168);
    expect(count("can-tho")).toBe(103);
  });

  it("gives every ward a unique slug within its city, with no district level", () => {
    for (const city of CITIES) {
      const slugs = city.wards.map((w) => w.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(city.wards.every((w) => /^(Phường|Xã|Đặc khu) /.test(w.name) && w.citySlug === city.slug)).toBe(true);
    }
  });

  it("keeps places unique and inside the two cities", () => {
    const slugs = LANDMARKS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const l of LANDMARKS) {
      expect(CITIES.some((c) => c.slug === l.citySlug)).toBe(true);
      expect(l.lat).toBeGreaterThan(8.4);
      expect(l.lat).toBeLessThan(11.8);
      expect(l.lng).toBeGreaterThan(104.8);
      expect(l.lng).toBeLessThan(107.9);
    }
  });
});
