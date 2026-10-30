import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { DISTRICTS, findLandmark, searchProjects } from "@tthome/data";
import { EmptyState, buttonStyles } from "@tthome/ui";
import { MapSheet } from "@/components/map-sheet";
import { MapLinkedCard } from "@/components/map-linked-card";
import { ProjectCard } from "@/components/project-card";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { SearchBox } from "@/components/search-box";
import { SearchToolbar } from "@/components/search-filters";
import type { Dictionary } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n/server";
import { toApproxMapPins, toMapLandmarks } from "@/lib/map-pins";
import { activeFilterCount, parseSearchParams, toSearchQuery } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function headline(f: ReturnType<typeof parseSearchParams>, t: Dictionary): string {
  const landmark = f.landmark ? findLandmark(f.landmark) : undefined;
  const district = f.district ? DISTRICTS.find((d) => d.slug === f.district) : undefined;
  const ward = district?.wards.find((w) => w.slug === f.ward);
  if (landmark) return t.search.nearLandmark(landmark.name);
  if (ward && district) return t.search.inWard(ward.name, district.name);
  if (district) return t.search.inDistrict(district.name);
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
    alternates: { canonical: `/tim-kiem${toSearchQuery({ landmark: filters.landmark, district: filters.district, ward: filters.ward })}` },
    robots: activeFilterCount(filters) > 2 || filters.q ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const { lang, t } = await getServerI18n();
  const results = searchProjects(filters);
  const roomCount = results.reduce((n, r) => n + r.rooms.length, 0);
  const pins = toApproxMapPins(results);
  const landmarks = toMapLandmarks(filters.landmark ? [filters.landmark] : undefined);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,40%)]">
      <div className="min-w-0 px-4 pt-6 pb-24 sm:px-6 lg:pb-12 xl:pl-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))]">
        <SearchBox defaultValue={filters.q ?? ""} size="md" className="max-w-2xl" />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{headline(filters, t)}</h1>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {t.search.summary(roomCount, results.length)}
            </p>
          </div>
          <Link href={`/dang-nhap?next=${encodeURIComponent(`/tim-kiem${toSearchQuery(filters)}`)}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <Bookmark aria-hidden />
            {t.search.save}
          </Link>
        </div>

        <div className="sticky top-16 z-20 -mx-4 mt-4 border-b border-line bg-wash/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <SearchToolbar filters={filters} />
        </div>

        {results.length === 0 ? (
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
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {results.map((m, i) => (
              <li key={m.project.id} className="flex">
                <MapLinkedCard id={m.project.id} name={m.project.name}>
                  <ProjectCard match={m} priority={i < 2} className="w-full" lang={lang} />
                </MapLinkedCard>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside aria-label={t.search.mapRegion} className="hidden lg:block">
        <div className="sticky top-16 h-[calc(100dvh-4rem)] border-l border-line">
          <SearchMapLazy pins={pins} landmarks={landmarks} className="size-full" />
        </div>
      </aside>
      <MapSheet pins={pins} landmarks={landmarks} />
    </div>
  );
}
