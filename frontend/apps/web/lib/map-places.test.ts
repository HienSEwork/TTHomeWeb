import { describe, expect, it } from "vitest";
import { CAN_THO_MAX_BOUNDS } from "./can-tho-area";
import { LABEL_ZOOM, MAP_PLACES, PLACE_KINDS } from "./map-places";

describe("MAP_PLACES", () => {
  it("names every place in full, once", () => {
    const names = MAP_PLACES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((n) => n.length >= 8)).toBe(true);
  });

  it("keeps every place inside the area the map can show", () => {
    const [w, s, e, n] = CAN_THO_MAX_BOUNDS;
    for (const p of MAP_PLACES) {
      expect(p.lng).toBeGreaterThan(w);
      expect(p.lng).toBeLessThan(e);
      expect(p.lat).toBeGreaterThan(s);
      expect(p.lat).toBeLessThan(n);
    }
  });

  it("covers every category the map can filter, each with a label zoom", () => {
    for (const k of PLACE_KINDS) {
      expect(MAP_PLACES.some((p) => p.kind === k)).toBe(true);
      expect(LABEL_ZOOM[k]).toBeGreaterThan(10);
    }
  });
});
