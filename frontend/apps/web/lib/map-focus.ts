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
