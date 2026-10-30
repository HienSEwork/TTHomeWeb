"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import circle from "@turf/circle";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { StyleSpecification } from "maplibre-gl";
import type { LucideIcon } from "lucide-react";
import { GraduationCap, Hospital, Landmark, Pill, ShoppingBag, Store, X } from "lucide-react";
import MapGL, { Layer, Marker, NavigationControl, Source, type LayerProps, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { Plate, cn } from "@tthome/ui";
import { CAN_THO_MAX_BOUNDS, CAN_THO_OUTLINE, OUTSIDE_CAN_THO } from "@/lib/can-tho-area";
import { useI18n } from "@/lib/i18n/client";
import { distanceMeters } from "@/lib/location-privacy";
import { LABEL_ZOOM, MAP_PLACES, PLACE_KINDS, type PlaceKind } from "@/lib/map-places";
import { emitMapArea, overlappingIds, useMapArea, useMapFocus, type MapAreaEvent, type MapFocusEvent } from "@/lib/map-focus";
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

/**
 * Every building's area as a circle that is never smaller than ~16 px on screen and matches the real
 * 700 m radius once zoomed in (at Cần Thơ's latitude one pixel is ~154 166 / 2^zoom metres).
 */
const areaDots: LayerProps = {
  id: "areas-dot",
  type: "circle",
  paint: {
    "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 10, 16, 12, 18.6, 18, 1190],
    "circle-color": AMBER,
    "circle-opacity": ["match", ["get", "state"], "active", 0.32, "near", 0.24, "hover", 0.24, 0.14],
    "circle-stroke-color": ["match", ["get", "state"], "active", "#A8702C", AMBER],
    "circle-stroke-width": ["match", ["get", "state"], "active", 2, "near", 1.5, 1],
    "circle-stroke-opacity": 0.9,
    "circle-pitch-alignment": "map",
  },
};

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

const PLACE_STYLE: Record<PlaceKind, { icon: LucideIcon; color: string }> = {
  school: { icon: GraduationCap, color: "#3B6FB6" },
  hospital: { icon: Hospital, color: "#C2543F" },
  shopping: { icon: ShoppingBag, color: "#A1477A" },
  store: { icon: Store, color: "#2F7D4F" },
  pharmacy: { icon: Pill, color: "#0E7C70" },
  landmark: { icon: Landmark, color: "#8A5A1E" },
};

type Props = {
  /** Pins already moved off the real address (see toApproxMapPins). */
  pins: MapPin[];
  landmarks?: MapLandmark[];
  className?: string;
};

/**
 * The buildings within 5 km of the median one, so a single far-off building does not zoom the first view out
 * to the whole city (where place names are hidden). Falls back to every pin when the results are spread out.
 */
export function mainCluster<T extends { lat: number; lng: number }>(points: T[]): T[] {
  const mid = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const center = { lat: mid(points.map((p) => p.lat)), lng: mid(points.map((p) => p.lng)) };
  const near = points.filter((p) => distanceMeters(center, p) <= 5000);
  return near.length * 2 >= points.length ? near : points;
}

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
  const [zoom, setZoom] = useState(12);
  const [kinds, setKinds] = useState<Set<PlaceKind>>(() => new Set(PLACE_KINDS));
  const toggleKind = (k: PlaceKind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const initialBounds = useMemo(() => boundsOf(pins.length ? mainCluster(pins) : landmarks), [pins, landmarks]);

  const shapes = useMemo(() => new Map(pins.map((p) => [p.id, circle([p.lng, p.lat], AREA_RADIUS_KM, { steps: 64, units: "kilometers" })])), [pins]);

  // Buildings whose areas overlap the chosen one; the list beside the map filters to these too.
  const nearIds = useMemo(() => (selectedId ? overlappingIds(pins, selectedId, AREA_RADIUS_KM * 1000, distanceMeters) : []), [pins, selectedId]);
  const near = useMemo(() => nearIds.map((id) => pins.find((p) => p.id === id)!), [nearIds, pins]);

  const stateOf = useCallback((id: string) => (id === selectedId ? "active" : nearIds.includes(id) ? "near" : id === hoverId ? "hover" : "idle"), [selectedId, nearIds, hoverId]);

  const dots = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: pins.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { id: p.id, state: stateOf(p.id) } })),
    }),
    [pins, stateOf],
  );

  // The exact 700 m outline, dashed, only for the area in focus.
  const outlines = useMemo<FeatureCollection<Polygon>>(
    () => ({
      type: "FeatureCollection",
      features: [...new Set([selectedId, hoverId].filter((id): id is string => Boolean(id)))].map((id) => ({ ...shapes.get(id)!, properties: { id, state: stateOf(id) } })),
    }),
    [selectedId, hoverId, shapes, stateOf],
  );

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return emitMapArea({ ids: null });
      const ids = overlappingIds(pins, id, AREA_RADIUS_KM * 1000, distanceMeters);
      emitMapArea({ ids });
      const rings = ids.map((x) => shapes.get(x)!.geometry.coordinates[0]!);
      const lngs = rings.flatMap((r) => r.map((c) => c[0]!));
      const lats = rings.flatMap((r) => r.map((c) => c[1]!));
      map.current?.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: { top: 70, bottom: 230, left: 40, right: 40 }, duration: 1200, maxZoom: 15.5 },
      );
    },
    [pins, shapes],
  );

  // "Bỏ lọc vùng" beside the list clears the choice here too.
  useMapArea(useCallback((e: MapAreaEvent) => e.ids === null && setSelectedId(null), []));

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
    select(id && id !== selectedId ? id : null);
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
        onLoad={(e) => {
          e.target.touchZoomRotate.disableRotation();
          setZoom(e.target.getZoom());
        }}
        onZoomEnd={(e) => setZoom(e.viewState.zoom)}
        interactiveLayerIds={["areas-dot", "areas-fill"]}
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
        <Source id="dots" type="geojson" data={dots}>
          <Layer {...areaDots} />
        </Source>
        <Source id="areas" type="geojson" data={outlines}>
          <Layer {...areaFill} />
          <Layer {...areaLine} />
        </Source>

        {MAP_PLACES.filter((p) => kinds.has(p.kind)).map((p) => {
          const { icon: Icon, color } = PLACE_STYLE[p.kind];
          const named = zoom >= LABEL_ZOOM[p.kind];
          const onPhoto = view === "satellite";
          return (
            <Marker key={p.name} longitude={p.lng} latitude={p.lat} anchor="center" style={{ zIndex: 0 }}>
              <span className="group/place flex items-center gap-1" title={p.name}>
                <span aria-hidden className="grid size-6 place-items-center rounded-full border-2 border-white text-white shadow-[0_1px_4px_rgb(0_0_0/0.35)]" style={{ backgroundColor: color }}>
                  <Icon className="size-3.5" />
                </span>
                <span
                  className={cn(
                    "max-w-[11rem] truncate rounded-md px-1.5 py-0.5 text-[0.6875rem] leading-tight font-semibold",
                    onPhoto ? "bg-black/55 text-white" : "bg-white/85 text-ink shadow-[0_1px_3px_rgb(0_0_0/0.15)]",
                    named ? "inline-block" : "hidden group-hover/place:inline-block",
                  )}
                >
                  {p.name}
                </span>
              </span>
            </Marker>
          );
        })}

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
            <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom" offset={[0, -10]} style={{ zIndex: active ? 2 : 1 }}>
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

      <div role="group" aria-label={t.map.places} className="scrollbar-none absolute top-[4.75rem] right-3 left-3 z-10 flex gap-1.5 overflow-x-auto pb-1 sm:top-14">
        {PLACE_KINDS.map((k) => {
          const { icon: Icon, color } = PLACE_STYLE[k];
          const on = kinds.has(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => toggleKind(k)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[0_4px_12px_-6px_rgb(45_35_20/0.35)] backdrop-blur-md transition-colors",
                on ? "border-white/70 bg-white/90 text-ink" : "border-white/40 bg-white/55 text-muted line-through decoration-1",
              )}
            >
              <span aria-hidden className="grid size-4 place-items-center rounded-full text-white" style={{ backgroundColor: on ? color : "#9A938A" }}>
                <Icon className="size-2.5" />
              </span>
              {t.map.placeKinds[k]}
            </button>
          );
        })}
      </div>

      <p className="pointer-events-none absolute top-3 right-3 z-10 max-w-[min(20rem,calc(100%-10rem))] rounded-2xl border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-ink shadow-[0_8px_24px_-12px_rgb(45_35_20/0.35)] backdrop-blur-md">
        {t.map.privacyNote(AREA_RADIUS_KM * 1000)}
      </p>

      {selected ? (
        <div className="absolute inset-x-3 bottom-3 z-10 flex max-h-[45%] flex-col rounded-[18px] border border-white/60 bg-white/95 shadow-[0_24px_48px_-20px_rgb(45_35_20/0.4)] backdrop-blur-md sm:right-auto sm:w-[26rem]">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <p className="text-sm font-bold text-ink">{t.map.inArea(near.length)}</p>
            <button type="button" onClick={() => select(null)} className="rounded-md p-1 text-muted hover:bg-wash hover:text-ink" aria-label={t.common.close}>
              <X aria-hidden className="size-4" />
            </button>
          </div>
          <ul className="min-h-0 overflow-y-auto overscroll-contain p-2">
            {near.map((p) => (
              <li key={p.id}>
                <Link href={p.href} className={cn("flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ivory", p.id === selectedId && "bg-ivory")}>
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-line">
                    <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 font-semibold text-ink">{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="text-sm font-extrabold text-ink">{fmt.fromPrice(p.minPrice)}</span>
                      <Plate value={p.vacant} unit={t.map.vacantShort} size="xs" />
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-gold-ink">{t.map.seeRooms}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
