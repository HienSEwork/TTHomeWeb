"use client";

import { useEffect } from "react";

/** Links the result list and the map: hovering a card highlights its area, "Xem vùng" flies the map there. */
export type MapFocusEvent = { id: string | null; kind: "hover" | "select" };

const EVENT = "tthome:map-focus";

export function emitMapFocus(detail: MapFocusEvent) {
  window.dispatchEvent(new CustomEvent<MapFocusEvent>(EVENT, { detail }));
}

export function useMapFocus(handler: (e: MapFocusEvent) => void) {
  useEffect(() => {
    const listener = (e: Event) => handler((e as CustomEvent<MapFocusEvent>).detail);
    window.addEventListener(EVENT, listener);
    return () => window.removeEventListener(EVENT, listener);
  }, [handler]);
}

/** The buildings whose areas overlap the one chosen on the map; null when no area is chosen. */
export type MapAreaEvent = { ids: string[] | null };

const AREA_EVENT = "tthome:map-area";

export function emitMapArea(detail: MapAreaEvent) {
  window.dispatchEvent(new CustomEvent<MapAreaEvent>(AREA_EVENT, { detail }));
}

export function useMapArea(handler: (e: MapAreaEvent) => void) {
  useEffect(() => {
    const listener = (e: Event) => handler((e as CustomEvent<MapAreaEvent>).detail);
    window.addEventListener(AREA_EVENT, listener);
    return () => window.removeEventListener(AREA_EVENT, listener);
  }, [handler]);
}

/** Ids of the pins whose areas overlap `center`'s: centres closer than two radii. */
export function overlappingIds(pins: { id: string; lat: number; lng: number }[], centerId: string, radiusMeters: number, distance: (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => number): string[] {
  const center = pins.find((p) => p.id === centerId);
  if (!center) return [];
  return pins
    .filter((p) => distance(center, p) <= radiusMeters * 2)
    .sort((a, b) => distance(center, a) - distance(center, b))
    .map((p) => p.id);
}
