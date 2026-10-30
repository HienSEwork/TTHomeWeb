import { describe, expect, it } from "vitest";
import { searchProjects } from "@tthome/data";
import { distanceMeters } from "./location-privacy";
import { toApproxMapPins, toMapPins } from "./map-pins";

describe("toApproxMapPins", () => {
  const matches = searchProjects({}).slice(0, 8);

  it("never hands out a building's real coordinates", () => {
    const exact = toMapPins(matches);
    toApproxMapPins(matches).forEach((pin, i) => {
      const d = distanceMeters(exact[i]!, pin);
      expect(d).toBeGreaterThanOrEqual(249);
      expect(d).toBeLessThanOrEqual(501);
    });
  });

  it("puts each building on the same approximate spot every time", () => {
    expect(toApproxMapPins(matches)).toEqual(toApproxMapPins(matches));
  });
});
