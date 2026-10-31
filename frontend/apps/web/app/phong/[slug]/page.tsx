import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { findCity, findWard, getRoomBySlug, projectAddress, ROOM_STATUS, roomSlug, similarRooms, SITE, TODAY } from "@tthome/data";
import { Badge, Container, buttonStyles } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GalleryGrid } from "@/components/gallery-grid";
import { JsonLd } from "@/components/json-ld";
import { AmenityList } from "@/components/project-amenities";
import { ProjectActions } from "@/components/project-actions";
import { RoomListingCard } from "@/components/room-listing-card";
import { areaHref } from "@/lib/area-route";
import { localRoomName, projectCopy } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";
import { googleMapsUrl } from "@/lib/map-projection";
import { monthlyCost } from "@/lib/room-cost";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getRoomBySlug((await params).slug);
  if (!found) return {};
  const { room, project } = found;
  const { lang, t, fmt } = await getServerI18n();
  return {
    title: t.room.metaTitle(t.labels.roomType[room.type], room.area, fmt.priceShort(room.price), project.name),
    description: t.room.metaDescription(localRoomName(room.name, lang), t.labels.furniture[room.furniture], room.floor, projectAddress(project)),
    alternates: { canonical: `/phong/${roomSlug(room, project)}` },
    robots: room.status === "hidden" ? { index: false } : undefined,
  };
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const found = getRoomBySlug(slug);
  if (!found || found.room.status === "hidden") notFound();
  const { room, project } = found;
  const canonical = roomSlug(room, project);
  if (slug !== canonical) permanentRedirect(`/phong/${canonical}`);
  const { lang, t, fmt } = await getServerI18n();
  const name = localRoomName(room.name, lang);
  const copy = projectCopy(project, lang);

  const city = findCity(project.citySlug)!;
  const ward = findWard(project.citySlug, project.wardSlug)!;
  const status = ROOM_STATUS[room.status];
  const cost = monthlyCost(room, project.fees, Math.min(room.maxPeople, room.type === "2pn" ? 2 : 1), 1, t.cost);
  const similar = similarRooms(room, project, 4);
  const bookable = room.status === "available" || room.status === "reserved";
  const facts: [string, string][] = [
    [t.room.facts.type, t.labels.roomType[room.type]],
    [t.room.facts.area, `${room.area} m²`],
    [t.room.facts.floor, String(room.floor)],
    [t.room.facts.furniture, t.labels.furniture[room.furniture]],
    [t.room.facts.window, room.hasWindow ? t.common.yes : t.common.no],
    [t.room.facts.balcony, room.hasBalcony ? t.common.yes : t.common.no],
    [t.room.facts.maxPeople, t.room.people(room.maxPeople)],
    [t.room.facts.deposit, fmt.vnd(room.deposit)],
    [t.room.facts.pets, t.labels.pet[project.petPolicy]],
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Accommodation",
          name: `${name}, ${project.name}`,
          image: room.images,
          floorSize: { "@type": "QuantitativeValue", value: room.area, unitCode: "MTK" },
          address: { "@type": "PostalAddress", streetAddress: project.street, addressLocality: ward.name, addressRegion: city.name, addressCountry: "VN" },
          offers: { "@type": "Offer", price: room.price, priceCurrency: "VND", availability: room.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
        }}
      />

      <Container className="pt-6">
        <Breadcrumbs
          lang={lang}
          items={[
            { href: areaHref({ city }), label: city.name },
            { href: areaHref({ city, ward }), label: ward.name },
            { href: `/du-an/${project.slug}`, label: project.name },
            { label: name },
          ]}
        />
        <div className="mt-5">
          <GalleryGrid images={[...room.images, ...project.images.slice(1, 3)]} alt={`${name}, ${project.name}`} />
        </div>
      </Container>

      <Container className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={status.tone}>{t.labels.roomStatus[room.status]}</Badge>
              <h1 className="mt-3 text-title font-extrabold sm:text-[2.25rem]">{t.room.heading(name, t.labels.roomType[room.type], room.area)}</h1>
              <p className="mt-2 text-ink-soft">
                {t.room.at}{" "}
                <Link href={`/du-an/${project.slug}`} className="font-semibold text-plate hover:underline">
                  {project.name}
                </Link>
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  {projectAddress(project)}{" "}
                  <a href={googleMapsUrl(project)} target="_blank" rel="noopener" className="font-semibold text-plate hover:underline">
                    {t.common.directions}
                  </a>
                </span>
              </p>
            </div>
            <ProjectActions url={`/phong/${canonical}`} title={`${name}, ${project.name}`} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-surface px-4 py-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-0.5 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="tong-chi-phi" className="mt-12">
            <h2 id="tong-chi-phi" className="text-xl font-extrabold">
              {t.room.costTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{t.room.costNote(cost.lines[2]?.note ?? "")}</p>
            <table className="mt-4 w-full max-w-lg text-[0.9375rem]">
              <tbody>
                {cost.lines.map((l) => (
                  <tr key={l.label} className="border-b border-line">
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink-soft">
                      {l.label}
                      {l.note ? <span className="block text-xs text-muted">{l.note}</span> : null}
                    </th>
                    <td className="tabular py-2.5 text-right font-semibold">{fmt.vnd(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="pt-3 text-left font-bold">
                    {t.room.total}
                  </th>
                  <td className="tabular pt-3 text-right text-xl font-extrabold text-shutter">{fmt.vnd(cost.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section aria-labelledby="tien-nghi-phong" className="mt-12">
            <h2 id="tien-nghi-phong" className="text-xl font-extrabold">
              {t.room.amenities}
            </h2>
            <div className="mt-4">
              <AmenityList codes={[...room.amenities, ...project.amenities]} lang={lang} />
            </div>
          </section>

          <section aria-labelledby="noi-quy-phong" className="mt-12">
            <h2 id="noi-quy-phong" className="text-xl font-extrabold">
              {t.room.rules}
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-soft marker:text-line-strong">
              {copy.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">{t.room.price}</p>
            <p>
              <span className="text-3xl font-extrabold">{fmt.priceShort(room.price)}</span>
              <span className="text-muted">{t.common.perMonth}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-shutter">
              {room.status === "available" && room.availableFrom <= TODAY ? t.common.moveInNow : t.common.vacantFrom(fmt.date(room.availableFrom))}
            </p>
            {bookable ? (
              <Link href={`/dat-lich?project=${project.code}&room=${room.code}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
                {t.room.bookThis}
              </Link>
            ) : (
              <Link href={`/du-an/${project.slug}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
                {t.room.otherRooms}
              </Link>
            )}
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-2 w-full" })}>
              <Phone aria-hidden />
              {t.common.call(SITE.hotline)}
            </a>
            {room.status === "reserved" ? <p className="mt-4 rounded-lg bg-wall-tint p-3 text-sm text-wall-dark">{t.room.reserved}</p> : null}
          </div>
        </aside>
      </Container>

      {similar.length > 0 ? (
        <Container className="mt-16">
          <h2 className="text-xl font-extrabold">{t.room.similarTitle}</h2>
          <p className="mt-1 text-sm text-muted">{t.room.similarText}</p>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <li key={s.room.id} className="flex">
                <RoomListingCard listing={s} className="w-full" lang={lang} />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </>
  );
}
