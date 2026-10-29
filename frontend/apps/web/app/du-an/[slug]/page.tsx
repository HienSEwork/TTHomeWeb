import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BadgePercent, MapPin, PawPrint, Phone, PlugZap } from "lucide-react";
import {
  distanceKm,
  findDistrict,
  findWard,
  getProjectBySlug,
  LANDMARKS,
  PET_LABEL,
  PROJECTS,
  PROVINCE,
  projectAddress,
  ROOM_STATUS,
  ROOM_TYPE_LABEL,
  roomSlug,
  searchProjects,
  SITE,
  TODAY,
  vacantRooms,
  minPrice,
} from "@tthome/data";
import { Badge, Container, Plate, buttonStyles, formatDate, formatFromPrice, formatPriceShort, formatVnd } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GalleryGrid } from "@/components/gallery-grid";
import { JsonLd } from "@/components/json-ld";
import { MapView } from "@/components/map-view";
import { AmenityList } from "@/components/project-amenities";
import { ProjectActions } from "@/components/project-actions";
import { ProjectCard } from "@/components/project-card";
import { areaHref } from "@/lib/area-route";
import { googleMapsUrl } from "@/lib/map-projection";
import { toMapPins } from "@/lib/map-pins";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug);
  if (!project) return {};
  const vacant = vacantRooms(project);
  return {
    title: `${project.name}, ${vacant.length} phòng trống ${formatFromPrice(minPrice(vacant)).toLowerCase()}`,
    description: `${project.description} ${projectAddress(project)}.`,
    alternates: { canonical: `/du-an/${project.slug}` },
    openGraph: { images: [project.images[0]!] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  if (slug !== project.slug) permanentRedirect(`/du-an/${project.slug}`);

  const district = findDistrict(project.districtSlug)!;
  const ward = findWard(project.districtSlug, project.wardSlug)!;
  const vacant = vacantRooms(project);
  const from = minPrice(vacant);
  const listed = project.rooms.filter((r) => r.status !== "hidden").sort((a, b) => Number(b.status === "available") - Number(a.status === "available") || a.price - b.price);
  const nearby = LANDMARKS.map((l) => ({ l, km: distanceKm(l, project) })).filter((x) => x.km < 4).sort((a, b) => a.km - b.km);
  const others = searchProjects({ district: project.districtSlug }).filter((m) => m.project.id !== project.id).slice(0, 3);
  const pin = toMapPins([{ project, rooms: vacant, minPrice: from, distanceKm: null }]);
  const url = `/du-an/${project.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ApartmentComplex",
          name: project.name,
          description: project.description,
          image: project.images,
          address: { "@type": "PostalAddress", streetAddress: project.street, addressLocality: `${ward.name}, ${district.name}`, addressRegion: PROVINCE.name, addressCountry: "VN" },
          geo: { "@type": "GeoCoordinates", latitude: project.lat, longitude: project.lng },
          numberOfAvailableAccommodationUnits: vacant.length,
          petsAllowed: project.petPolicy !== "none",
        }}
      />

      <Container className="pt-6">
        <Breadcrumbs
          items={[
            { href: "/tim-kiem", label: "Phòng trọ" },
            { href: areaHref({ district }), label: district.name },
            { href: areaHref({ district, ward }), label: ward.name },
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
                {project.exclusive ? <Badge tone="ink">Độc quyền TTHOME</Badge> : null}
                <Badge>Mã PRJ-{project.code}</Badge>
              </div>
              <h1 className="mt-3 text-title font-extrabold sm:text-[2.25rem]">{project.name}</h1>
              <p className="mt-2 flex items-start gap-1.5 text-ink-soft">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-plate" />
                <span>
                  {projectAddress(project)}{" "}
                  <a href={googleMapsUrl(project)} target="_blank" rel="noopener" className="font-semibold text-plate hover:underline">
                    Chỉ đường
                  </a>
                </span>
              </p>
            </div>
            <ProjectActions url={url} title={project.name} />
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-lg bg-wall-tint px-2.5 py-1.5 font-medium text-wall-dark">
              <PawPrint aria-hidden className="size-4" />
              {PET_LABEL[project.petPolicy]}
            </li>
            {project.evParking ? (
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-shutter-tint px-2.5 py-1.5 font-medium text-shutter-dark">
                <PlugZap aria-hidden className="size-4" />
                Có chỗ sạc xe điện
              </li>
            ) : null}
            {project.promo ? (
              <li className="inline-flex items-center gap-1.5 rounded-lg bg-wall px-2.5 py-1.5 font-semibold text-ink">
                <BadgePercent aria-hidden className="size-4" />
                {project.promo}
              </li>
            ) : null}
          </ul>

          <p className="mt-6 max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-soft">{project.description}</p>

          <section aria-labelledby="ds-phong" className="mt-12">
            <h2 id="ds-phong" className="text-xl font-extrabold">
              Danh sách phòng
            </h2>
            <p className="mt-1 text-sm text-muted">Giá và tình trạng cập nhật từ hệ thống quản lý phòng vài phút một lần.</p>
            <div className="mt-4 overflow-x-auto rounded-card border border-line bg-surface">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-line bg-wash text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Phòng</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Loại</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Diện tích</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Giá/tháng</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tình trạng</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Trống từ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {listed.map((room) => {
                    const status = ROOM_STATUS[room.status];
                    return (
                      <tr key={room.id} className={room.status === "rented" ? "text-muted" : undefined}>
                        <th scope="row" className="px-4 py-3 font-semibold">
                          {room.status === "rented" ? (
                            room.name
                          ) : (
                            <Link href={`/phong/${roomSlug(room, project)}`} className="text-plate hover:underline">
                              {room.name}
                            </Link>
                          )}
                        </th>
                        <td className="px-4 py-3">{ROOM_TYPE_LABEL[room.type]}</td>
                        <td className="tabular px-4 py-3 text-right">{room.area} m²</td>
                        <td className="tabular px-4 py-3 text-right font-bold">{formatPriceShort(room.price)}</td>
                        <td className="px-4 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3">{room.status === "available" && room.availableFrom <= TODAY ? "Vào ở ngay" : formatDate(room.availableFrom)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="chi-phi" className="mt-12">
            <h2 id="chi-phi" className="text-xl font-extrabold">
              Chi phí hằng tháng ngoài tiền phòng
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Điện", `${formatVnd(project.fees.electric)}/kWh`],
                ["Nước", `${formatVnd(project.fees.water)}/người`],
                ["Dịch vụ", `${formatVnd(project.fees.service)}/phòng`],
                ["Gửi xe", `${formatVnd(project.fees.parking)}/xe`],
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
              Tiện nghi tòa nhà
            </h2>
            <div className="mt-4">
              <AmenityList codes={project.amenities} />
            </div>
          </section>

          <section aria-labelledby="noi-quy" className="mt-12">
            <h2 id="noi-quy" className="text-xl font-extrabold">
              Nội quy
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-soft marker:text-line-strong">
              {project.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="vi-tri" className="mt-12">
            <h2 id="vi-tri" className="text-xl font-extrabold">
              Vị trí
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
              <MapView
                pins={pin}
                landmarks={nearby.map(({ l }) => ({ slug: l.slug, name: l.shortName, lat: l.lat, lng: l.lng }))}
                fit
                className="aspect-[4/3] rounded-card border border-line"
              />
              <ul className="space-y-2 text-sm">
                {nearby.length === 0 ? <li className="text-muted">Không có trường học hay trung tâm thương mại lớn trong bán kính 4 km.</li> : null}
                {nearby.map(({ l, km }) => (
                  <li key={l.slug} className="flex justify-between gap-3 border-b border-line pb-2">
                    <span>{l.name}</span>
                    <span className="tabular shrink-0 font-semibold">{km.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km</span>
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
                <span className="block text-sm text-muted">Giá thuê</span>
                <span className="text-2xl font-extrabold">{formatFromPrice(from)}</span>
                {from ? <span className="text-muted">/tháng</span> : null}
              </p>
              <Plate value={vacant.length} unit="phòng trống" size="md" />
            </div>
            <Link href={`/dat-lich?project=${project.code}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
              Đặt lịch xem phòng
            </Link>
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-2 w-full" })}>
              <Phone aria-hidden />
              Gọi {SITE.hotline}
            </a>
            <p className="mt-4 text-center text-sm text-muted">Xem phòng miễn phí, có thể xem online qua Zalo.</p>
          </div>
        </aside>
      </Container>

      {others.length > 0 ? (
        <Container className="mt-16">
          <h2 className="text-xl font-extrabold">Tòa nhà khác ở {district.name}</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((m) => (
              <li key={m.project.id} className="flex">
                <ProjectCard match={m} className="w-full" />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </>
  );
}
