import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { areaStats, CITIES, findLandmark, searchProjects, type ProjectMatch } from "@tthome/data";
import { EmptyState, buttonStyles } from "@tthome/ui";
import { AreaFilterBanner } from "@/components/area-filter-banner";
import { MapLinkedCard } from "@/components/map-linked-card";
import { PAGE_SIZE, Pagination, pageFrom } from "@/components/pagination";
import { ResultsLayout } from "@/components/results-layout";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { RoomListingCard } from "@/components/room-listing-card";
import { SearchToolbar, type WardCount } from "@/components/search-filters";
import type { Dictionary } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n/server";
import { toApproxMapPins, toMapLandmarks } from "@/lib/map-pins";
import { liveSearchEnabled } from "@/lib/search-api";
import { searchLive } from "@/lib/search-live";
import { activeFilterCount, parseSearchParams, toSearchQuery } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function headline(f: ReturnType<typeof parseSearchParams>, t: Dictionary): string {
  const landmark = f.landmark ? findLandmark(f.landmark) : undefined;
  const city = f.city ? CITIES.find((c) => c.slug === f.city) : undefined;
  const ward = city?.wards.find((w) => w.slug === f.ward);
  if (landmark) return t.search.nearLandmark(landmark.name);
  if (ward && city) return t.search.inWard(ward.name, city.name);
  if (city) return t.search.inCity(city.name);
  if (f.q) return t.search.forQuery(f.q);
  return t.search.all;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseSearchParams(await searchParams);
  const { t } = await getServerI18n();
  const title = headline(filters, t);
  return {
    title,
    description: t.search.metaDescription(title),
    alternates: { canonical: `/tim-kiem${toSearchQuery({ landmark: filters.landmark, city: filters.city, ward: filters.ward })}` },
    robots: activeFilterCount(filters) > 2 || filters.q ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const { lang, t } = await getServerI18n();
  const live = liveSearchEnabled();
  let results: ProjectMatch[] = [];
  let failed = false;
  try {
    results = live ? await searchLive(filters) : searchProjects(filters);
  } catch {
    failed = true;
  }
  const roomCount = results.reduce((n, r) => n + r.rooms.length, 0);
  const page = pageFrom(params.trang, results.length);
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // The map shows the buildings on this page, so choosing an area filters exactly the cards in view.
  const pins = toApproxMapPins(shown);
  // Well-known places are drawn by the map itself; a landmark only shows when the search is near it.
  const landmarks = filters.landmark ? toMapLandmarks([filters.landmark]) : [];

  const wards = wardCounts(filters, live);

  const list = (
      <div className="@container mx-auto min-w-0 max-w-[1320px] px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{headline(filters, t)}</h1>
          <Link href={`/dang-nhap?next=${encodeURIComponent(`/tim-kiem${toSearchQuery(filters)}`)}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
            <Bookmark aria-hidden />
            {t.search.save}
          </Link>
        </div>

        <div className="mt-4 rounded-card border border-line bg-white p-3 shadow-[var(--shadow-soft)] sm:p-4">
          <SearchToolbar filters={filters} live={live} wards={wards} total={{ buildings: results.length, rooms: roomCount }} />
        </div>

        {failed ? (
          <EmptyState className="mt-8" title={t.search.liveDownTitle} description={t.search.liveDownText} />
        ) : results.length === 0 ? (
          <EmptyState
            className="mt-8"
            title={t.search.emptyTitle}
            description={t.search.emptyText}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/tim-kiem" className={buttonStyles({ variant: "secondary" })}>
                  {t.common.clearFilters}
                </Link>
                <Link href="/dat-lich" className={buttonStyles()}>
                  {t.common.askForHelp}
                </Link>
              </div>
            }
          />
        ) : (
          <>
          <AreaFilterBanner />
          {/* Five across like the home page when the list has the full width, fewer as the map takes room. */}
          <ul className="mt-6 grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @6xl:grid-cols-5">
            {shown.map((m, i) => (
              <li key={m.project.id} className="flex empty:hidden">
                <MapLinkedCard id={m.project.id} name={m.project.name}>
                  <RoomListingCard listing={{ room: cheapest(m), project: m.project }} otherRooms={m.rooms.length - 1} priority={i < 5} className="h-full w-full" lang={lang} />
                </MapLinkedCard>
              </li>
            ))}
          </ul>
          <Pagination page={page} total={results.length} basePath="/tim-kiem" params={params} labels={t.pagination} />
          </>
        )}
      </div>
  );

  return <ResultsLayout list={list} initialMap="hidden" map={<SearchMapLazy pins={pins} landmarks={landmarks} className="size-full" />} />;
}

/** The room a building's card shows: the cheapest one matching the search. */
function cheapest(m: ProjectMatch) {
  return m.rooms.reduce((a, b) => (b.price < a.price ? b : a));
}

/**
 * Rooms matching the search in each ward, ignoring the ward filter itself, so the chips show where else to look.
 * With the live search the counts would need another request, so the vacant rooms per ward are shown instead.
 */
function wardCounts(filters: ReturnType<typeof parseSearchParams>, live: boolean): WardCount[] {
  const inCity = (slug: string) => !filters.city || slug === filters.city;
  if (live) {
    return areaStats()
      .filter((s) => inCity(s.city.slug) && s.vacant > 0)
      .map((s) => ({ city: s.city.slug, ward: s.ward.slug, name: s.ward.name, rooms: s.vacant }));
  }
  const counts = new Map<string, WardCount>();
  for (const m of searchProjects({ ...filters, ward: undefined })) {
    const key = `${m.project.citySlug}/${m.project.wardSlug}`;
    const ward = CITIES.find((c) => c.slug === m.project.citySlug)?.wards.find((w) => w.slug === m.project.wardSlug);
    if (!ward) continue;
    const entry = counts.get(key) ?? { city: m.project.citySlug, ward: ward.slug, name: ward.name, rooms: 0 };
    entry.rooms += m.rooms.length;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) => b.rooms - a.rooms);
}
