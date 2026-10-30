"use client";

import { useCallback, useState, type ReactNode } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { useMapFocus, type MapFocusEvent } from "@/lib/map-focus";

/**
 * Results beside the map on wide screens. Below 1024 px one of them fills the page at a time and a floating
 * switch flips between the list and a full-screen map; "Xem vùng" on a card opens the map. The map stays
 * mounted either way, so it keeps its position and choice.
 */
export function ResultsLayout({ list, map }: { list: ReactNode; map: ReactNode }) {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "map">("list");

  const show = (next: "list" | "map") => {
    setView(next);
    window.scrollTo({ top: 0 });
  };

  useMapFocus(
    useCallback((e: MapFocusEvent) => {
      if (e.kind === "select" && e.id && !window.matchMedia("(min-width: 1024px)").matches) {
        setView("map");
        window.scrollTo({ top: 0 });
      }
    }, []),
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,40%)]">
      <div className={cn("min-w-0", view === "map" && "max-lg:hidden")}>{list}</div>
      <aside aria-label={t.map.region} className={cn("lg:block", view === "list" && "max-lg:hidden")}>
        <div className="sticky top-16 h-[calc(100dvh-4rem)] border-line max-lg:h-[calc(100dvh-5rem)] lg:border-l">{map}</div>
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
            className={cn("inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors", view === key ? "bg-gold text-[#1C1A17]" : "text-white/80 hover:text-white")}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
