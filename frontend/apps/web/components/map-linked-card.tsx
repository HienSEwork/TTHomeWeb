"use client";

import { useCallback, useState, type ReactNode } from "react";
import { LocateFixed } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { emitMapFocus, useMapArea, type MapAreaEvent } from "@/lib/map-focus";

/** Wraps a result card: hovering it highlights the building's area on the map, the button flies the map to it. */
export function MapLinkedCard({ id, name, children }: { id: string; name: string; children: ReactNode }) {
  const { t } = useI18n();
  // Hidden while an area chosen on the map does not include this building.
  const [outside, setOutside] = useState(false);
  useMapArea(useCallback((e: MapAreaEvent) => setOutside(e.ids !== null && !e.ids.includes(id)), [id]));
  if (outside) return null;
  return (
    <div className="relative flex w-full" onPointerEnter={() => emitMapFocus({ id, kind: "hover" })} onPointerLeave={() => emitMapFocus({ id: null, kind: "hover" })}>
      {children}
      <button
        type="button"
        onClick={() => emitMapFocus({ id, kind: "select" })}
        aria-label={t.map.showAreaLabel(name)}
        className="absolute top-3 right-14 z-10 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 text-xs font-semibold text-ink shadow-[0_2px_8px_rgb(45_35_20/0.15)] backdrop-blur-md transition-colors hover:bg-white"
      >
        <LocateFixed aria-hidden className="size-4 text-[#C58635]" />
        {t.map.showArea}
      </button>
    </div>
  );
}
