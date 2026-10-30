"use client";

import { useCallback, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { emitMapArea, useMapArea, type MapAreaEvent } from "@/lib/map-focus";

/** Shown above the results while an area chosen on the map filters them, with a way back to all results. */
export function AreaFilterBanner() {
  const { t } = useI18n();
  const [count, setCount] = useState<number | null>(null);
  useMapArea(useCallback((e: MapAreaEvent) => setCount(e.ids ? e.ids.length : null), []));
  if (count === null) return null;
  return (
    <div role="status" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-ink">
      <span className="inline-flex items-center gap-2 font-medium">
        <MapPin aria-hidden className="size-4 text-gold-deep" />
        {t.map.areaFilter(count)}
      </span>
      <button type="button" onClick={() => emitMapArea({ ids: null })} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-ivory">
        <X aria-hidden className="size-4" />
        {t.map.clearArea}
      </button>
    </div>
  );
}
