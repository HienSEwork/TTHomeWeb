import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areaStats, PRICE_BANDS, searchProjects, type ProjectMatch } from "@tthome/data";
import { Container, EmptyState, Plate, buttonStyles, cn } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { RoomListingCard } from "@/components/room-listing-card";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { areaHref, areaName, resolveAreaRoute, type AreaRoute } from "@/lib/area-route";
import { labelOf, type Dictionary } from "@/lib/i18n";
import { getServerI18n } from "@/lib/i18n/server";
import { toApproxMapPins } from "@/lib/map-pins";

type Props = { params: Promise<{ tinh: string; slug?: string[] }> };

function matchesFor(route: AreaRoute): ProjectMatch[] {
  const max = route.band && route.band.max !== Number.MAX_SAFE_INTEGER ? route.band.max : undefined;
  return searchProjects({ city: route.city.slug, ward: route.ward?.slug, priceMin: route.band?.min || undefined, priceMax: max, sort: "price_asc" });
}

function title(route: AreaRoute, t: Dictionary): string {
  const base = t.area.title(areaName(route));
  return route.band ? t.area.titleWithBand(base, labelOf(t.labels.priceBand, route.band.slug)) : base;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tinh, slug } = await params;
  const route = resolveAreaRoute(tinh, slug);
  if (!route) return {};
  const matches = matchesFor(route);
  const rooms = matches.reduce((n, m) => n + m.rooms.length, 0);
  const from = Math.min(...matches.map((m) => m.minPrice ?? Infinity));
  const { t, fmt } = await getServerI18n();
  return {
    title: title(route, t),
    description: t.area.metaDescription(rooms, areaName(route), Number.isFinite(from) ? fmt.priceShort(from) : null),
    alternates: { canonical: areaHref(route) },
  };
}

export default async function AreaPage({ params }: Props) {
  const { tinh, slug } = await params;
  const route = resolveAreaRoute(tinh, slug);
  if (!route) notFound();
  const { lang, t, fmt } = await getServerI18n();

  const matches = matchesFor(route);
  const rooms = matches.reduce((n, m) => n + m.rooms.length, 0);
  const from = matches.length ? Math.min(...matches.map((m) => m.minPrice ?? Infinity)) : null;
  const wards = areaStats().filter((s) => s.city.slug === route.city.slug);
  const name = areaName(route);
  const placeRoute = { city: route.city, ward: route.ward };

  const faqs = [
    { q: t.area.faqPriceQ(name), a: from ? t.area.faqPriceA(name, fmt.priceShort(from)) : t.area.faqPriceNone(name) },
    { q: t.area.faqVacantQ(name), a: t.area.faqVacantA(rooms, matches.length, name) },
    { q: t.area.faqFeeQ, a: t.area.faqFeeA },
  ];

  const crumbs = [
    { href: "/tim-kiem", label: t.project.crumb },
    { href: areaHref({ city: route.city }), label: route.city.name },
    ...(route.ward ? [{ href: areaHref(placeRoute), label: route.ward.name }] : []),
    ...(route.band ? [{ label: labelOf(t.labels.priceBand, route.band.slug) }] : []),
  ];

  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-8 sm:py-10">
          <Breadcrumbs items={crumbs} lang={lang} />
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-title font-extrabold text-ink sm:text-[2.5rem] sm:leading-[1.1]">{title(route, t)}</h1>
              <p className="mt-3 max-w-2xl text-ink-soft">{t.area.lead(name)}</p>
            </div>
            <dl className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <dt className="sr-only">{t.area.vacant}</dt>
                <dd>
                  <Plate value={rooms} unit={t.area.vacantUnit} size="lg" />
                </dd>
              </div>
              <div className="flex flex-col justify-center rounded-plate border border-line px-4">
                <dt className="text-xs text-muted">{t.area.buildings}</dt>
                <dd className="tabular text-2xl font-extrabold">{matches.length}</dd>
              </div>
              <div className="flex flex-col justify-center rounded-plate border border-line px-4">
                <dt className="text-xs text-muted">{t.area.from}</dt>
                <dd className="text-2xl font-extrabold">{from && Number.isFinite(from) ? fmt.priceShort(from) : t.area.contact}</dd>
              </div>
            </dl>
          </div>

          <nav aria-label={t.area.priceNav} className="mt-8">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={areaHref(placeRoute)}
                  aria-current={!route.band ? "page" : undefined}
                  className={cn("inline-flex rounded-full border px-3 py-1.5 text-sm font-medium", !route.band ? "border-selected-line bg-selected text-on-selected" : "border-line-strong text-ink-soft hover:border-ink")}
                >
                  {t.area.allPrices}
                </Link>
              </li>
              {PRICE_BANDS.map((b) => {
                const current = route.band?.slug === b.slug;
                return (
                  <li key={b.slug}>
                    <Link
                      href={areaHref({ ...placeRoute, band: b })}
                      aria-current={current ? "page" : undefined}
                      className={cn("inline-flex rounded-full border px-3 py-1.5 text-sm font-medium", current ? "border-selected-line bg-selected text-on-selected" : "border-line-strong text-ink-soft hover:border-ink")}
                    >
                      {labelOf(t.labels.priceBand, b.slug)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {matches.length === 0 ? (
            <EmptyState
              title={t.area.emptyTitle(name)}
              description={t.area.emptyText}
              action={
                <Link href="/dat-lich" className={buttonStyles()}>
                  {t.common.askForHelp}
                </Link>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((m, i) => (
                <li key={m.project.id} className="flex">
                  <RoomListingCard
                    listing={{ room: m.rooms.reduce((a, b) => (b.price < a.price ? b : a)), project: m.project }}
                    otherRooms={m.rooms.length - 1}
                    priority={i < 3}
                    className="w-full"
                    lang={lang}
                  />
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="hoi-dap-khu-vuc" className="mt-14">
            <h2 id="hoi-dap-khu-vuc" className="text-xl font-extrabold">
              {t.area.faqTitle(name)}
            </h2>
            <div className="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
              {faqs.map((f) => (
                <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                    {f.q}
                    <span aria-hidden className="text-xl leading-none text-muted transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-ink-soft">{f.a}</p>
                </details>
              ))}
            </div>
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
              }}
            />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {matches.length > 0 ? (
            <div className="overflow-hidden rounded-card border border-line">
              <SearchMapLazy pins={toApproxMapPins(matches)} className="aspect-square" />
            </div>
          ) : null}
          <nav aria-label={t.area.wardsNav(route.city.name)} className="rounded-card border border-line bg-surface p-4">
            <h2 className="font-bold">{t.area.otherWards(route.city.name)}</h2>
            <ul className="mt-3 space-y-2">
              {wards.map((s) => (
                <li key={s.ward.slug}>
                  <Link
                    href={areaHref({ city: s.city, ward: s.ward })}
                    aria-current={s.ward.slug === route.ward?.slug ? "page" : undefined}
                    className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-wash aria-[current=page]:bg-plate-tint"
                  >
                    <Plate value={s.vacant} size="sm" className="min-w-9 justify-center" />
                    <span className="flex-1 text-sm font-semibold">{s.ward.name}</span>
                    <span className="text-sm text-muted">{fmt.fromPrice(s.minPrice)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </Container>
    </>
  );
}
