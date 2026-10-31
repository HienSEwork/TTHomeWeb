import { areaStats, CITIES, PRICE_BANDS, findCity, type City, type Ward } from "@tthome/data";

type Band = (typeof PRICE_BANDS)[number];

export type AreaRoute = { city: City; ward?: Ward; band?: Band };

/**
 * Resolves /phong-tro/{thanh-pho}/[{phuong}]/[{khoang-gia}] on the post-2025 map, which has no district level.
 * The optional segments are a ward, a price band, or a ward then a price band.
 */
export function resolveAreaRoute(tinh: string, rest: string[] = []): AreaRoute | null {
  const city = findCity(tinh);
  if (!city || rest.length > 2) return null;
  const [a, b] = rest;
  const bandOf = (s?: string) => PRICE_BANDS.find((p) => p.slug === s);
  if (!a) return { city };
  const ward = city.wards.find((w) => w.slug === a);
  if (ward) {
    if (!b) return { city, ward };
    const band = bandOf(b);
    return band ? { city, ward, band } : null;
  }
  const band = bandOf(a);
  return band && !b ? { city, band } : null;
}

export function areaHref(route: AreaRoute): string {
  return ["/phong-tro", route.city.slug, route.ward?.slug, route.band?.slug].filter(Boolean).join("/");
}

export function areaName(route: AreaRoute): string {
  return route.ward ? `${route.ward.name}, ${route.city.name}` : route.city.name;
}

/** Area pages to prerender: every city, its price bands, and the wards that hold rooms. Other wards render on demand. */
export function allAreaRoutes(): AreaRoute[] {
  const listedWards = new Set(areaStats().map((s) => `${s.city.slug}/${s.ward.slug}`));
  const out: AreaRoute[] = [];
  for (const city of CITIES) {
    out.push({ city });
    for (const band of PRICE_BANDS) out.push({ city, band });
    for (const ward of city.wards) if (listedWards.has(`${city.slug}/${ward.slug}`)) out.push({ city, ward });
  }
  return out;
}
