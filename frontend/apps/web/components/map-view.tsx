"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Plate, cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { CITY_BOUNDS, fitBounds, googleMapsUrl, project, RIVERS, type LatLng, type Bounds } from "@/lib/map-projection";

export type MapPin = {
  id: string;
  name: string;
  href: string;
  address: string;
  image: string;
  lat: number;
  lng: number;
  minPrice: number | null;
  /** The dearest vacant room, for the "3 phòng: 16tr - 22tr" tag on the search map. */
  maxPrice?: number | null;
  vacant: number;
};

export type MapLandmark = { slug: string; name: string; lat: number; lng: number };

type Props = {
  pins: MapPin[];
  landmarks?: MapLandmark[];
  /** Zoom to the pins instead of showing the whole city. */
  fit?: boolean;
  className?: string;
};

function riverPath(river: LatLng[], b: Bounds): string {
  return river.map((p, i) => {
    const { x, y } = project(p, b);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

/**
 * Overview map: price pins placed by real coordinates over a sketch of the river.
 * Google Maps only loads when someone follows "Mở trên Google Maps".
 */
export function MapView({ pins, landmarks = [], fit, className }: Props) {
  const { t, fmt } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gridId = useId();
  const bounds = useMemo(() => (fit ? fitBounds([...pins, ...landmarks]) : CITY_BOUNDS), [fit, pins, landmarks]);
  const selected = pins.find((p) => p.id === selectedId) ?? null;

  return (
    <div className={cn("relative isolate overflow-hidden bg-[#e9eeec]", className)} role="region" aria-label={t.map.sketchRegion}>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          <pattern id={gridId} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M6 0H0V6" fill="none" stroke="#dbe3df" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${gridId})`} />
        {RIVERS.map((river, i) => (
          <g key={i}>
            <path d={riverPath(river, bounds)} fill="none" stroke="#c6d8ee" strokeWidth={i === 0 ? 14 : 7} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d={riverPath(river, bounds)} fill="none" stroke="#b3cbe8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>

      {landmarks.map((l) => {
        const { x, y } = project(l, bounds);
        return (
          <span key={l.slug} className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 text-[0.6875rem] font-semibold whitespace-nowrap text-ink-soft" style={{ left: `${x}%`, top: `${y}%` }}>
            <span aria-hidden className="mx-auto mb-0.5 block size-2 rotate-45 bg-ink-soft" />
            {l.name}
          </span>
        );
      })}

      <ul className="absolute inset-0 z-20">
        {pins.map((pin) => {
          const { x, y } = project(pin, bounds);
          const active = pin.id === selectedId;
          return (
            <li key={pin.id} className={cn("absolute -translate-x-1/2 -translate-y-full", active && "z-10")} style={{ left: `${x}%`, top: `${y}%` }}>
              <button
                type="button"
                onClick={() => setSelectedId(active ? null : pin.id)}
                aria-pressed={active}
                aria-label={t.map.pin(pin.name, fmt.fromPrice(pin.minPrice), pin.vacant)}
                className={cn(
                  "relative rounded-md px-1.5 py-0.5 text-xs font-bold whitespace-nowrap shadow-sm transition-transform after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent hover:scale-110",
                  active ? "plate scale-110 after:border-t-plate" : "bg-surface text-ink ring-1 ring-line-strong after:border-t-surface",
                )}
              >
                {fmt.mapPrice(pin.minPrice)}
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="absolute inset-x-3 bottom-3 z-30 flex gap-3 rounded-card bg-surface p-3 shadow-[var(--shadow-lift)] sm:right-auto sm:w-96">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-[10px] bg-line">
            <Image src={selected.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={selected.href} className="line-clamp-1 font-bold text-ink hover:underline">
              {selected.name}
            </Link>
            <p className="line-clamp-1 text-sm text-muted">{selected.address}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-extrabold text-ink">{fmt.fromPrice(selected.minPrice)}</span>
              <Plate value={selected.vacant} unit={t.map.vacantShort} size="xs" />
            </div>
            <a href={googleMapsUrl(selected)} target="_blank" rel="noopener" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-plate hover:underline">
              {t.map.openGoogle}
              <ExternalLink aria-hidden className="size-3" />
            </a>
          </div>
          <button type="button" onClick={() => setSelectedId(null)} className="self-start rounded-md p-1 text-muted hover:bg-wash hover:text-ink" aria-label={t.common.close}>
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}

      <p className="absolute top-3 right-3 z-30 rounded-md bg-surface/90 px-2 py-1 text-[0.6875rem] text-muted">{t.map.sketchNote}</p>
    </div>
  );
}
