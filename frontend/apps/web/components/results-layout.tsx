"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { emitMapFocus, useMapFocus, type MapFocusEvent } from "@/lib/map-focus";

const WIDE = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * Results beside the map on wide screens. Below 1024 px one of them fills the page at a time and a floating
 * switch flips between the list and a full-screen map; "Xem vùng" on a card opens the map. On small screens
 * the map (MapLibre is the heaviest script on the site) is only built once it is first opened, and its code is
 * fetched while the browser is idle; after that it stays mounted and keeps its position and choice.
 */
export function ResultsLayout({ list, map }: { list: ReactNode; map: ReactNode }) {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "map">("list");
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
  const [opened, setOpened] = useState(false);
  if (view === "map" && !opened) setOpened(true);
  const mapMounted = wide || opened;
  const mountedRef = useRef(mapMounted);
  useEffect(() => {
    mountedRef.current = mapMounted;
  }, [mapMounted]);

  useEffect(() => {
    if (wide) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => void import("./search-map"));
    return () => cancel(handle);
  }, [wide]);

  const show = (next: "list" | "map") => {
    setView(next);
    window.scrollTo({ top: 0 });
  };

  useMapFocus(
    useCallback((e: MapFocusEvent) => {
      if (e.kind === "select" && e.id && !window.matchMedia(WIDE).matches) {
        setView("map");
        window.scrollTo({ top: 0 });
        // The map is built on first open and missed this request; repeat it once it is listening.
        if (!mountedRef.current) window.setTimeout(() => emitMapFocus(e), 1200);
      }
    }, []),
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,40%)]">
      <div className={cn("min-w-0", view === "map" && "max-lg:hidden")}>{list}</div>
      <aside aria-label={t.map.region} className={cn("lg:block", view === "list" && "max-lg:hidden")}>
        <div className="sticky top-16 h-[calc(100dvh-4rem)] border-line max-lg:h-[calc(100dvh-5rem)] lg:border-l">{mapMounted ? map : null}</div>
      </aside>

      <div role="group" aria-label={t.map.viewSwitch} className="fixed bottom-5 left-1/2 z-30 inline-flex -translate-x-1/2 rounded-full bg-[#1C1A17] p-1 shadow-[0_16px_40px_-12px_rgb(28_26_23/0.6)] lg:hidden">
        {(
          [
            ["list", t.map.listView, List],
            ["map", t.map.mapView, MapIcon],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => show(key)}
            className={cn("inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors sm:px-5", view === key ? "bg-gold text-[#1C1A17]" : "text-white/80 hover:text-white")}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
