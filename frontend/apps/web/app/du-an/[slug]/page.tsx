import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BadgePercent, MapPin, PawPrint, Phone, PlugZap } from "lucide-react";
import {
  distanceKm,
  findCity,
  findWard,
  getProjectBySlug,
  LANDMARKS,
  projectAddress,
  ROOM_STATUS,
  roomSlug,
  searchProjects,
  SITE,
  TODAY,
  vacantRooms,
  minPrice,
} from "@tthome/data";
import { Badge, Container, Plate, buttonStyles } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GalleryGrid } from "@/components/gallery-grid";
import { JsonLd } from "@/components/json-ld";
import { SearchMapLazy } from "@/components/search-map-lazy";
import { AmenityList } from "@/components/project-amenities";
import { ProjectActions } from "@/components/project-actions";
import { ProjectCard } from "@/components/project-card";
import { areaHref } from "@/lib/area-route";
import { localRoomName, projectCopy } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";
import { googleMapsUrl } from "@/lib/map-projection";
import { toApproxMapPins } from "@/lib/map-pins";

type Props = { params: Promise<{ slug: string }> };


/** The building's page opens on about 10 km of city with its approximate area, 1.5 km round, shaded. */
const AREA_FOCUS = { viewKm: 10, areaKm: 1.5 };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug);
  if (!project) return {};
  const vacant = vacantRooms(project);
  const { lang, t, fmt } = await getServerI18n();
  return {
    title: t.project.metaTitle(project.name, vacant.length, fmt.fromPriceInline(minPrice(vacant))),
    description: `${projectCopy(project, lang).description} ${projectAddress(project)}.`,
    alternates: { canonical: `/du-an/${project.slug}` },
    openGraph: { images: [project.images[0]!] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  if (slug !== project.slug) permanentRedirect(`/du-an/${project.slug}`);
  const { lang, t, fmt } = await getServerI18n();
  const copy = projectCopy(project, lang);

  const city = findCity(project.citySlug)!;
  const ward = findWard(project.citySlug, project.wardSlug)!;
  const vacant = vacantRooms(project);
  const from = minPrice(vacant);
  const listed = project.rooms.filter((r) => r.status !== "hidden").sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.price - b.price);
  const nearby = LANDMARKS.map((l) => ({ l, km: distanceKm(l, project) })).filter((x) => x.km < 4).sort((a, b) => a.km - b.km);
  // The nearest buildings in the same city: wards are small since the merger, so the same ward is often empty.
  const others = searchProjects({ city: project.citySlug })
    .filter((m) => m.project.id !== project.id)
    .sort((a, b) => distanceKm(a.project, project) - distanceKm(b.project, project))
    .slice(0, 3);
  const pin = toApproxMapPins([{ project, rooms: vacant, minPrice: from, distanceKm: null }]);
  const url = `/du-an/${project.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ApartmentComplex",
          name: project.name,
          description: copy.description,
          image: project.images,
          address: { "@type": "PostalAddress", streetAddress: project.street, addressLocality: ward.name, addressRegion: city.name, addressCountry: "VN" },
          geo: { "@type": "GeoCoordinates", latitude: project.lat, longitude: project.lng },
          numberOfAvailableAccommodationUnits: vacant.length,
          petsAllowed: project.petPolicy !== "none",
        }}
      />

      <Container className="pt-6">
        <Breadcrumbs
          lang={lang}
          items={[
            { href: "/tim-kiem", label: t.project.crumb },
            { href: areaHref({ city }), label: city.name },
            { href: areaHref({ city, ward }), label: ward.name },
            { label: project.name },
          ]}
        />
        <div className="mt-5">
          <GalleryGrid images={project.images} alt={project.name} hasVideo={project.hasVideo} />
        </div>
      </Container>

      <Container className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-1.5">
                {project.exclusive ? <Badge tone="ink">{t.project.exclusive}</Badge> : null}
                <Badge>{t.project.code(project.code)}</Badge>
              </div>
              <h1 className="mt-3 text-title font-extrabold sm:text-[2.25rem]">{project.name}</h1>
              <p className="mt-2 flex items-start gap-1.5 text-ink-soft">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-plate" />
                <span>
                  {projectAddress(project)}{" "}
                  <a href={googleMapsUrl(project)} target="_blank" rel="noopener" className="font-semibold text-plate hover:underline">
                    {t.common.directions}
                  </a>
                </span>
              </p>
            </div>
            <ProjectActions url={url} title={project.name} />
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-wall-tint px-2.5 py-1.5 font-medium text-wall-dark">
              <PawPrint aria-hidden className="size-4" />
              {t.labels.pet[project.petPolicy]}
            </li>
            {project.evParking ? (
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-shutter-tint px-2.5 py-1.5 font-medium text-shutter-dark">
                <PlugZap aria-hidden className="size-4" />
                {t.project.ev}
              </li>
            ) : null}
            {copy.promo ? (
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-wall px-2.5 py-1.5 font-semibold text-ink">
                <BadgePercent aria-hidden className="size-4" />
                {copy.promo}
              </li>
            ) : null}
          </ul>

          <p className="mt-6 max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-soft">{copy.description}</p>

          <section aria-labelledby="ds-phong" className="mt-12">
            <h2 id="ds-phong" className="text-xl font-extrabold">
              {t.project.roomsTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{t.project.roomsNote}</p>
            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line bg-wash text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">{t.project.col.room}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t.project.col.type}</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">{t.project.col.area}</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">{t.project.col.price}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t.project.col.status}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{t.project.col.from}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {listed.map((room) => {
                    const status = ROOM_STATUS[room.status];
                    const name = localRoomName(room.name, lang);
                    return (
                      <tr key={room.id} className={room.status === "rented" ? "text-muted" : undefined}>
                        <th scope="row" className="px-4 py-3 font-semibold">
                          {room.status === "rented" ? (
                            name
                          ) : (
                            <Link href={`/phong/${roomSlug(room, project)}`} className="text-plate hover:underline">
                              {name}
                            </Link>
                          )}
                        </th>
                        <td className="px-4 py-3">{t.labels.roomType[room.type]}</td>
                        <td className="tabular px-4 py-3 text-right">{room.area} m²</td>
                        <td className="tabular px-4 py-3 text-right font-bold">{fmt.priceShort(room.price)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{t.labels.roomStatus[room.status]}</Badge>
                        </td>
                        <td className="px-4 py-3">{room.status === "available" && room.availableFrom <= TODAY ? t.common.moveInNow : fmt.date(room.availableFrom)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="chi-phi" className="mt-12">
            <h2 id="chi-phi" className="text-xl font-extrabold">
              {t.project.feesTitle}
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [t.project.fees.electric, `${fmt.vnd(project.fees.electric)}${t.project.perKwh}`],
                [t.project.fees.water, `${fmt.vnd(project.fees.water)}${t.project.perPerson}`],
                [t.project.fees.service, `${fmt.vnd(project.fees.service)}${t.project.perRoom}`],
                [t.project.fees.parking, `${fmt.vnd(project.fees.parking)}${t.project.perBike}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-card border border-line bg-surface p-4">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="tabular mt-1 font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="tien-nghi" className="mt-12">
            <h2 id="tien-nghi" className="text-xl font-extrabold">
              {t.project.amenitiesTitle}
            </h2>
            <div className="mt-4">
              <AmenityList codes={project.amenities} lang={lang} />
            </div>
          </section>

          <section aria-labelledby="noi-quy" className="mt-12">
            <h2 id="noi-quy" className="text-xl font-extrabold">
              {t.project.rules}
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-soft marker:text-line-strong">
              {copy.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="vi-tri" className="mt-12">
            <h2 id="vi-tri" className="text-xl font-extrabold">
              {t.project.location}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
              <SearchMapLazy pins={pin} focus={AREA_FOCUS} className="aspect-[4/3] min-w-0 overflow-hidden rounded-card border border-line" />
              <ul className="space-y-2 text-sm">
                {nearby.length === 0 ? <li className="text-muted">{t.project.noNearby}</li> : null}
                {nearby.map(({ l, km }) => (
                  <li key={l.slug} className="flex justify-between gap-3 border-b border-line pb-2">
                    <span>{l.name}</span>
                    <span className="tabular shrink-0 font-semibold">{t.common.km(fmt.number(km, 1))}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <p>
                <span className="block text-sm text-muted">{t.project.price}</span>
                <span className="text-2xl font-extrabold">{fmt.fromPrice(from)}</span>
                {from ? <span className="text-muted">{t.common.perMonth}</span> : null}
              </p>
              <Plate value={vacant.length} unit={t.card.vacantUnit} size="md" />
            </div>
            <Link href={`/dat-lich?project=${project.code}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
              {t.project.book}
            </Link>
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-2 w-full" })}>
              <Phone aria-hidden />
              {t.common.call(SITE.hotline)}
            </a>
            <p className="mt-4 text-center text-sm text-muted">{t.project.freeNote}</p>
          </div>
        </aside>
      </Container>

      {others.length > 0 ? (
        <Container className="mt-16">
          <h2 className="text-xl font-extrabold">{t.project.others(city.name)}</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((m) => (
              <li key={m.project.id} className="flex">
                <ProjectCard match={m} className="w-full" lang={lang} />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </>
  );
}
