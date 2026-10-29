import { DISTRICTS, PRICE_BANDS, PROVINCE, findDistrict, type District, type Ward } from "@tthome/data";

type Band = (typeof PRICE_BANDS)[number];

export type AreaRoute = { district: District; ward?: Ward; band?: Band };

/**
 * Resolves /phong-tro/{tinh}/{quan}/[{phuong}]/[{khoang-gia}].
 * The optional segments are a ward, a price band, or a ward then a price band.
 */
export function resolveAreaRoute(tinh: string, quan: string, rest: string[] = []): AreaRoute | null {
  if (tinh !== PROVINCE.slug || rest.length > 2) return null;
  const district = findDistrict(quan);
  if (!district) return null;
  const [a, b] = rest;
  const bandOf = (s?: string) => PRICE_BANDS.find((p) => p.slug === s);
  if (!a) return { district };
  const ward = district.wards.find((w) => w.slug === a);
  if (ward) {
    if (!b) return { district, ward };
    const band = bandOf(b);
    return band ? { district, ward, band } : null;
  }
  const band = bandOf(a);
  return band && !b ? { district, band } : null;
}

export function areaHref(route: { district: District; ward?: Ward; band?: Band }): string {
  return ["/phong-tro", PROVINCE.slug, route.district.slug, route.ward?.slug, route.band?.slug].filter(Boolean).join("/");
}

export function areaName(route: AreaRoute): string {
  return route.ward ? `${route.ward.name}, ${route.district.name}` : route.district.name;
}

/** Every area page, for generateStaticParams and the sitemap. */
export function allAreaRoutes(): AreaRoute[] {
  const out: AreaRoute[] = [];
  for (const district of DISTRICTS) {
    out.push({ district });
    for (const band of PRICE_BANDS) out.push({ district, band });
    for (const ward of district.wards) out.push({ district, ward });
  }
  return out;
}
