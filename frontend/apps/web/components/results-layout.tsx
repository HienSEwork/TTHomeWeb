"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronRight, List, Map as MapIcon, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { emitMapFocus, useMapFocus, type MapFocusEvent } from "@/lib/map-focus";

const WIDE = "(min-width: 1024px)";
const subscribeWide = (onChange: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** The map's share of the width on wide screens, as a fraction; the list keeps at least 480 px. */
const MIN_SHARE = 0.25;
const MAX_SHARE = 0.7;
const clampShare = (x: number) => Math.min(MAX_SHARE, Math.max(MIN_SHARE, x));

/**
 * Results beside the map on wide screens. Below 1024 px one of them fills the page at a time and a floating
 * switch flips between the list and a full-screen map; "Xem vùng" on a card opens the map. On small screens
 * the map (MapLibre is the heaviest script on the site) is only built once it is first opened, and its code is
 * fetched while the browser is idle; after that it stays mounted and keeps its position and choice. On wide
 * screens the edge between them can be dragged, and the map can be hidden or widened to the full page.
 */
export function ResultsLayout({ list, map }: { list: ReactNode; map: ReactNode }) {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "map">("list");
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
  const [opened, setOpened] = useState(false);
  const [wideMode, setWideMode] = useState<"split" | "hidden" | "full">("split");
  const [share, setShare] = useState(0.4);
  const [dragging, setDragging] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
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

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const drag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || !shell.current) return;
    const box = shell.current.getBoundingClientRect();
    setShare(clampShare((box.right - e.clientX) / box.width));
  };
  const resizeKeys = (e: KeyboardEvent) => {
    const step = { ArrowLeft: 0.05, ArrowRight: -0.05 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    setShare((x) => clampShare(x + step));
  };

  const control = "grid size-9 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-[0_6px_16px_-8px_rgb(45_35_20/0.45)] transition-colors hover:text-ink";

  return (
    <div
      ref={shell}
      style={{ "--map-share": `${Math.round(share * 100)}%` } as CSSProperties}
      className={cn(
        "lg:grid",
        wideMode === "split" && "lg:grid-cols-[minmax(480px,1fr)_var(--map-share)]",
        wideMode === "hidden" && "lg:grid-cols-[minmax(0,1fr)]",
        wideMode === "full" && "lg:grid-cols-[minmax(0,1fr)]",
        dragging && "cursor-col-resize select-none",
      )}
    >
      <div className={cn("min-w-0", view === "map" && "max-lg:hidden", wideMode === "full" && "lg:hidden")}>{list}</div>
      <aside aria-label={t.map.region} className={cn("relative lg:block", view === "list" && "max-lg:hidden", wideMode === "hidden" && "lg:hidden")}>
        <div className={cn("sticky top-16 h-[calc(100dvh-4rem)] border-line max-lg:h-[calc(100dvh-5rem)] lg:border-l", dragging && "pointer-events-none")}>{mapMounted ? map : null}</div>

        <div className={cn("absolute inset-y-0 z-20 hidden lg:block", wideMode === "full" ? "left-4" : "left-0 -translate-x-1/2")}>
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-2">
            {wideMode === "split" ? (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label={t.map.resize}
                aria-valuemin={MIN_SHARE * 100}
                aria-valuemax={MAX_SHARE * 100}
                aria-valuenow={Math.round(share * 100)}
                tabIndex={0}
                onPointerDown={startDrag}
                onPointerMove={drag}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onKeyDown={resizeKeys}
                className="group/handle flex h-16 w-3 cursor-col-resize items-center justify-center rounded-full border border-line bg-white shadow-[0_6px_16px_-8px_rgb(45_35_20/0.45)] focus-visible:outline-2 focus-visible:outline-[#C58635]"
              >
                <span aria-hidden className={cn("h-8 w-0.5 rounded-full bg-line-strong transition-colors group-hover/handle:bg-gold", dragging && "bg-gold")} />
              </div>
            ) : null}
            {wideMode === "full" ? (
              <button type="button" onClick={() => setWideMode("split")} aria-label={t.map.restore} title={t.map.restore} className={control}>
                <Minimize2 aria-hidden className="size-4" />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setWideMode("full")} aria-label={t.map.expand} title={t.map.expand} className={control}>
                  <Maximize2 aria-hidden className="size-4" />
                </button>
                <button type="button" onClick={() => setWideMode("hidden")} aria-label={t.map.collapse} title={t.map.collapse} className={control}>
                  <ChevronRight aria-hidden className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {wideMode === "hidden" ? (
        <button
          type="button"
          onClick={() => setWideMode("split")}
          className="fixed bottom-6 left-1/2 z-30 hidden h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-[#1C1A17] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_-12px_rgb(28_26_23/0.6)] hover:bg-black lg:inline-flex"
        >
          <MapIcon aria-hidden className="size-4" />
          {t.map.showMap}
        </button>
      ) : null}

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
