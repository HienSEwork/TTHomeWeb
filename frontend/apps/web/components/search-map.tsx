"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import circle from "@turf/circle";
import type { FeatureCollection, Polygon } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import { X } from "lucide-react";
import MapGL, { Layer, Marker, NavigationControl, Source, type LayerProps, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { Plate, cn } from "@tthome/ui";
import { CAN_THO_MAX_BOUNDS, CAN_THO_OUTLINE, OUTSIDE_CAN_THO } from "@/lib/can-tho-area";
import { useI18n } from "@/lib/i18n/client";
import { useMapFocus, type MapFocusEvent } from "@/lib/map-focus";
import type { MapLandmark, MapPin } from "./map-view";

const AMBER = "#D99B4B";

/** Coloured street map (roads, water, parks, building footprints when zoomed in); free, no token. */
const STREETS = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const esri = (service: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`;

/** Satellite photos with road and place names on top. The credit line follows the visitor's language. */
const satellite = (credit: string): StyleSpecification => ({
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    imagery: { type: "raster", tiles: [esri("World_Imagery")], tileSize: 256, maxzoom: 19, attribution: credit },
    roads: { type: "raster", tiles: [esri("Reference/World_Transportation")], tileSize: 256, maxzoom: 19 },
    places: { type: "raster", tiles: [esri("Reference/World_Boundaries_and_Places")], tileSize: 256, maxzoom: 19 },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "roads", type: "raster", source: "roads", paint: { "raster-opacity": 0.85 } },
    { id: "places", type: "raster", source: "places" },
  ],
});

/** Each area is wide enough to always contain the real building, which sits at most 500 m from the centre. */
const AREA_RADIUS_KM = 0.7;

const maskLayer: LayerProps = { id: "outside-fill", type: "fill", paint: { "fill-color": "#FBF9F5", "fill-opacity": 0.88 } };
const borderLayer: LayerProps = { id: "city-border", type: "line", paint: { "line-color": "#C58635", "line-width": 1.5, "line-opacity": 0.6 } };

const areaFill: LayerProps = {
  id: "areas-fill",
  type: "fill",
  paint: {
    "fill-color": AMBER,
    "fill-opacity": ["match", ["get", "state"], "active", 0.3, "hover", 0.22, 0.12],
  },
};
const areaLine: LayerProps = {
  id: "areas-line",
  type: "line",
  paint: {
    "line-color": ["match", ["get", "state"], "active", "#A8702C", AMBER],
    "line-width": ["match", ["get", "state"], "active", 2.5, "hover", 2, 1.25],
    "line-dasharray": [2, 2],
  },
};

type Props = {
  /** Pins already moved off the real address (see toApproxMapPins). */
  pins: MapPin[];
  landmarks?: MapLandmark[];
  className?: string;
};

function boundsOf(points: { lat: number; lng: number }[]): [[number, number], [number, number]] {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.012;
  return [
    [Math.min(...lngs) - pad, Math.min(...lats) - pad],
    [Math.max(...lngs) + pad, Math.max(...lats) + pad],
  ];
}

/**
 * Search results on a real map of Cần Thơ. Every building is a shaded area instead of a pin, so the map never
 * points at a landlord's address. Choosing an area, its price tag or "Xem vùng" on a card flies the map to it.
 */
export default function SearchMap({ pins, landmarks = [], className }: Props) {
  const map = useRef<MapRef>(null);
  const { t, fmt } = useI18n();
  const satelliteStyle = useMemo(() => satellite(t.map.satelliteCredit), [t]);
  const [view, setView] = useState<"streets" | "satellite">("streets");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const initialBounds = useMemo(() => boundsOf(pins.length ? pins : landmarks), [pins, landmarks]);

  const shapes = useMemo(() => new Map(pins.map((p) => [p.id, circle([p.lng, p.lat], AREA_RADIUS_KM, { steps: 64, units: "kilometers" })])), [pins]);

  const areas = useMemo<FeatureCollection<Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        ...shapes.get(p.id)!,
        properties: { id: p.id, state: p.id === selectedId ? "active" : p.id === hoverId ? "hover" : "idle" },
      })),
    }),
    [pins, shapes, selectedId, hoverId],
  );

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const shape = id ? shapes.get(id) : null;
      if (!shape) return;
      const ring = shape.geometry.coordinates[0]!;
      const lngs = ring.map((c) => c[0]!);
      const lats = ring.map((c) => c[1]!);
      map.current?.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: { top: 70, bottom: 150, left: 40, right: 40 }, duration: 1200, maxZoom: 15.5 },
      );
    },
    [shapes],
  );

  useMapFocus(
    useCallback(
      (e: MapFocusEvent) => {
        if (e.kind === "hover") setHoverId(e.id);
        else select(e.id);
      },
      [select],
    ),
  );

  const onMapClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    if (id) select(id === selectedId ? null : id);
    else setSelectedId(null);
  };

  return (
    <div className={cn("relative isolate overflow-hidden bg-[#f2f0eb]", className)} role="region" aria-label={t.map.region}>
      <MapGL
        ref={map}
        initialViewState={{ bounds: initialBounds, fitBoundsOptions: { padding: 48, maxZoom: 14 } }}
        mapStyle={view === "streets" ? STREETS : satelliteStyle}
        maxBounds={CAN_THO_MAX_BOUNDS}
        minZoom={10}
        maxZoom={18}
        dragRotate={false}
        touchPitch={false}
        pitchWithRotate={false}
        maxPitch={0}
        onLoad={(e) => e.target.touchZoomRotate.disableRotation()}
        interactiveLayerIds={["areas-fill"]}
        onClick={onMapClick}
        onMouseMove={(e) => setHoverId((e.features?.[0]?.properties?.id as string | undefined) ?? null)}
        onMouseLeave={() => setHoverId(null)}
        cursor={hoverId ? "pointer" : "grab"}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        <Source id="outside" type="geojson" data={OUTSIDE_CAN_THO}>
          <Layer {...maskLayer} />
        </Source>
        <Source id="border" type="geojson" data={{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: CAN_THO_OUTLINE } }}>
          <Layer {...borderLayer} />
        </Source>
        <Source id="areas" type="geojson" data={areas}>
          <Layer {...areaFill} />
          <Layer {...areaLine} />
        </Source>

        {landmarks.map((l) => (
          <Marker key={l.slug} longitude={l.lng} latitude={l.lat} anchor="top" style={{ pointerEvents: "none" }}>
            <span className={cn("flex flex-col items-center text-[0.6875rem] font-semibold whitespace-nowrap", view === "satellite" ? "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]" : "text-ink-soft")}>
              <span aria-hidden className={cn("mb-0.5 block size-2 rotate-45", view === "satellite" ? "bg-white" : "bg-ink-soft")} />
              {l.name}
            </span>
          </Marker>
        ))}

        {pins.map((pin) => {
          const active = pin.id === selectedId;
          return (
            <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="center" style={{ zIndex: active ? 2 : 1 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  select(active ? null : pin.id);
                }}
                onPointerEnter={() => setHoverId(pin.id)}
                onPointerLeave={() => setHoverId(null)}
                aria-pressed={active}
                aria-label={t.map.pin(pin.name, fmt.fromPrice(pin.minPrice), pin.vacant)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-[0_2px_8px_rgb(45_35_20/0.25)] transition-[scale,background-color,color] duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C58635]",
                  active ? "scale-110 bg-[#1C1A17] text-white" : "bg-white text-ink ring-1 ring-black/10",
                )}
              >
                {fmt.mapPrice(pin.minPrice)}
              </button>
            </Marker>
          );
        })}
      </MapGL>

      <div className="absolute top-3 left-3 z-10 inline-flex rounded-full border border-white/60 bg-white/85 p-1 text-xs font-semibold shadow-[0_8px_24px_-12px_rgb(45_35_20/0.35)] backdrop-blur-md" role="group" aria-label={t.map.style}>
        {(
          [
            ["streets", t.map.streets],
            ["satellite", t.map.satellite],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={cn("rounded-full px-3 py-1.5 transition-colors", view === key ? "bg-[#1C1A17] text-white" : "text-ink-soft hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="pointer-events-none absolute top-3 right-3 z-10 max-w-[min(20rem,calc(100%-10rem))] rounded-2xl border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink shadow-[0_8px_24px_-12px_rgb(45_35_20/0.35)] backdrop-blur-md">
        {t.map.privacyNote(AREA_RADIUS_KM * 1000)}
      </p>

      {selected ? (
        <div className="absolute inset-x-3 bottom-3 z-10 flex gap-3 rounded-[18px] border border-white/60 bg-white/90 p-3 shadow-[0_24px_48px_-20px_rgb(45_35_20/0.4)] backdrop-blur-md sm:right-auto sm:w-96">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-line">
            <Image src={selected.image} alt="" fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={selected.href} className="line-clamp-1 font-bold text-ink hover:underline">
              {selected.name}
            </Link>
            <p className="text-sm text-muted">{t.map.insideArea}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-extrabold text-ink">{fmt.fromPrice(selected.minPrice)}</span>
              <Plate value={selected.vacant} unit={t.map.vacantShort} size="xs" />
            </div>
          </div>
          <button type="button" onClick={() => setSelectedId(null)} className="self-start rounded-md p-1 text-muted hover:bg-wash hover:text-ink" aria-label={t.common.close}>
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
