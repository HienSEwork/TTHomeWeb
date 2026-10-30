/** True when the device hovers with a precise pointer and the visitor has not asked for less motion. */
export function canDoPointerMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * How far a magnetic element moves toward the pointer: a fraction of the offset from its centre,
 * fading to nothing at `radius` px outside its edges.
 */
export function magneticOffset(
  rect: { left: number; top: number; width: number; height: number },
  pointer: { x: number; y: number },
  { strength = 0.3, radius = 80 }: { strength?: number; radius?: number } = {},
): { x: number; y: number; near: boolean } {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = pointer.x - cx;
  const dy = pointer.y - cy;
  const outsideX = Math.max(0, Math.abs(dx) - rect.width / 2);
  const outsideY = Math.max(0, Math.abs(dy) - rect.height / 2);
  const gap = Math.hypot(outsideX, outsideY);
  if (gap >= radius) return { x: 0, y: 0, near: false };
  const pull = strength * (1 - gap / radius);
  return { x: Math.round(dx * pull * 10) / 10, y: Math.round(dy * pull * 10) / 10, near: true };
}

/** Which of `count` images a pointer at `x` across a box of `width` points to; the box is split into equal zones. */
export function zoneIndex(x: number, width: number, count: number): number {
  if (count <= 1 || width <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor((x / width) * count)));
}
