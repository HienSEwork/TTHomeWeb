import { describe, expect, it } from "vitest";
import { magneticOffset, zoneIndex } from "./motion";

const box = { left: 100, top: 100, width: 100, height: 40 };

describe("magneticOffset", () => {
  it("pulls toward a pointer over the element by the full strength", () => {
    expect(magneticOffset(box, { x: 170, y: 120 }, { strength: 0.3 })).toEqual({ x: 6, y: 0, near: true });
  });

  it("weakens with distance outside the edges", () => {
    const close = magneticOffset(box, { x: 220, y: 120 }, { strength: 0.3, radius: 80 });
    const far = magneticOffset(box, { x: 260, y: 120 }, { strength: 0.3, radius: 80 });
    expect(close.near && far.near).toBe(true);
    expect(close.x / 70).toBeGreaterThan(far.x / 110);
  });

  it("lets go once the pointer is beyond the radius", () => {
    expect(magneticOffset(box, { x: 400, y: 120 }, { radius: 80 })).toEqual({ x: 0, y: 0, near: false });
  });
});

describe("zoneIndex", () => {
  it("splits the width into equal zones, one per image", () => {
    expect([0, 24, 25, 74, 99].map((x) => zoneIndex(x, 100, 4))).toEqual([0, 0, 1, 2, 3]);
  });

  it("clamps pointers outside the box and handles a single image", () => {
    expect(zoneIndex(-5, 100, 4)).toBe(0);
    expect(zoneIndex(140, 100, 4)).toBe(3);
    expect(zoneIndex(50, 100, 1)).toBe(0);
  });
});
