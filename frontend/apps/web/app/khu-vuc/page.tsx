import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { areaStats, CITIES, cityStats, PROJECTS } from "@tthome/data";
import { Container } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { areaHref } from "@/lib/area-route";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.areas.title, description: t.areas.metaDescription, alternates: { canonical: "/khu-vuc" } };
}

export default async function AreasPage() {
  const { lang, t, fmt } = await getServerI18n();
  const wards = areaStats();
  const cities = CITIES.map((city) => {
    const stats = cityStats(city.slug);
    const showcase = PROJECTS.filter((p) => p.citySlug === city.slug).sort((a, b) => b.views - a.views)[0];
    return { city, stats, photo: showcase?.images[0], wards: wards.filter((w) => w.city.slug === city.slug) };
  });
  const wardTotal = CITIES.reduce((n, c) => n + c.wards.length, 0);

  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--color-ivory),#fff)]">
        <Container className="py-10 sm:py-14">
          <Breadcrumbs items={[{ label: t.areas.crumb }]} lang={lang} />
          <h1 className="mt-5 text-[2rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.75rem]">{t.areas.title}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t.areas.lead(wardTotal)}</p>
        </Container>
      </section>

      <Container className="py-12">
        <ul className="grid gap-6 lg:grid-cols-2">
          {cities.map(({ city, stats, photo, wards: list }) => (
            <li key={city.slug} className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
              <Link href={areaHref({ city })} className="group relative block aspect-[16/9] overflow-hidden bg-ivory">
                {photo ? (
                  <Image src={photo} alt={t.areas.photoAlt(city.name)} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100" />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1d1a15]/70 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <span>
                    <span className="block text-2xl font-bold">{city.name}</span>
                    <span className="text-sm text-white/85">{t.areas.summary(stats.vacant, stats.projects, fmt.fromPriceInline(stats.minPrice))}</span>
                  </span>
                  <span aria-hidden className="grid size-9 place-items-center rounded-full bg-white/90 text-ink">
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
              <ul className="divide-y divide-line px-5 py-2">
                {list.map((w) => (
                  <li key={w.ward.slug}>
                    <Link href={areaHref({ city, ward: w.ward })} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-gold-ink">
                      <span className="min-w-0">
                        <span className="block font-medium">{w.ward.name}</span>
                        {w.ward.formerArea ? <span className="block text-xs text-muted">{t.areas.formerly(w.ward.formerArea)}</span> : null}
                      </span>
                      <span className="text-muted">
                        <span className="font-semibold text-success">{t.areas.wardVacant(w.vacant)}</span>, {fmt.fromPriceInline(w.minPrice)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <details className="group mt-auto border-t border-line px-5 py-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gold-ink">
                  {t.areas.allWards(city.wards.length)}
                  <span aria-hidden className="text-lg leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <ul className="mt-3 columns-2 gap-4 text-sm sm:columns-3">
                  {[...city.wards]
                    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
                    .map((w) => (
                      <li key={w.slug} className="break-inside-avoid py-1">
                        <Link href={areaHref({ city, ward: w })} className="text-ink-soft hover:text-gold-ink">
                          {w.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
