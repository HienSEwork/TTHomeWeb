import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import {
  findDistrict,
  findWard,
  FURNITURE_LABEL,
  getRoomBySlug,
  PET_LABEL,
  PROJECTS,
  projectAddress,
  ROOM_STATUS,
  ROOM_TYPE_LABEL,
  roomSlug,
  similarRooms,
  SITE,
  TODAY,
} from "@tthome/data";
import { Badge, Container, buttonStyles, formatDate, formatPriceShort, formatVnd } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { GalleryGrid } from "@/components/gallery-grid";
import { JsonLd } from "@/components/json-ld";
import { AmenityList } from "@/components/project-amenities";
import { ProjectActions } from "@/components/project-actions";
import { RoomCard } from "@/components/room-card";
import { areaHref } from "@/lib/area-route";
import { googleMapsUrl } from "@/lib/map-projection";
import { monthlyCost } from "@/lib/room-cost";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECTS.flatMap((p) => p.rooms.filter((r) => r.status !== "hidden").map((r) => ({ slug: roomSlug(r, p) })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = getRoomBySlug((await params).slug);
  if (!found) return {};
  const { room, project } = found;
  return {
    title: `${ROOM_TYPE_LABEL[room.type]} ${room.area} m², ${formatPriceShort(room.price)}/tháng tại ${project.name}`,
    description: `${room.name}, ${FURNITURE_LABEL[room.furniture].toLowerCase()}, tầng ${room.floor}. ${projectAddress(project)}.`,
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

  const district = findDistrict(project.districtSlug)!;
  const ward = findWard(project.districtSlug, project.wardSlug)!;
  const status = ROOM_STATUS[room.status];
  const cost = monthlyCost(room, project.fees, Math.min(room.maxPeople, room.type === "2pn" ? 2 : 1));
  const similar = similarRooms(room, project, 4);
  const bookable = room.status === "available" || room.status === "reserved";
  const facts: [string, string][] = [
    ["Loại phòng", ROOM_TYPE_LABEL[room.type]],
    ["Diện tích", `${room.area} m²`],
    ["Tầng", String(room.floor)],
    ["Nội thất", FURNITURE_LABEL[room.furniture]],
    ["Cửa sổ", room.hasWindow ? "Có" : "Không"],
    ["Ban công", room.hasBalcony ? "Có" : "Không"],
    ["Ở tối đa", `${room.maxPeople} người`],
    ["Tiền cọc", formatVnd(room.deposit)],
    ["Thú cưng", PET_LABEL[project.petPolicy]],
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Accommodation",
          name: `${room.name}, ${project.name}`,
          image: room.images,
          floorSize: { "@type": "QuantitativeValue", value: room.area, unitCode: "MTK" },
          address: { "@type": "PostalAddress", streetAddress: project.street, addressLocality: `${ward.name}, ${district.name}`, addressCountry: "VN" },
          offers: { "@type": "Offer", price: room.price, priceCurrency: "VND", availability: room.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
        }}
      />

      <Container className="pt-6">
        <Breadcrumbs
          items={[
            { href: areaHref({ district }), label: district.name },
            { href: areaHref({ district, ward }), label: ward.name },
            { href: `/du-an/${project.slug}`, label: project.name },
            { label: room.name },
          ]}
        />
        <div className="mt-5">
          <GalleryGrid images={[...room.images, ...project.images.slice(1, 3)]} alt={`${room.name}, ${project.name}`} />
        </div>
      </Container>

      <Container className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={status.tone}>{status.label}</Badge>
              <h1 className="mt-3 text-title font-extrabold sm:text-[2.25rem]">
                {room.name}, {ROOM_TYPE_LABEL[room.type].toLowerCase()} {room.area} m²
              </h1>
              <p className="mt-2 text-ink-soft">
                Tại{" "}
                <Link href={`/du-an/${project.slug}`} className="font-semibold text-plate hover:underline">
                  {project.name}
                </Link>
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  {projectAddress(project)}{" "}
                  <a href={googleMapsUrl(project)} target="_blank" rel="noopener" className="font-semibold text-plate hover:underline">
                    Chỉ đường
                  </a>
                </span>
              </p>
            </div>
            <ProjectActions url={`/phong/${canonical}`} title={`${room.name}, ${project.name}`} />
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
              Tổng chi phí mỗi tháng
            </h2>
            <p className="mt-1 text-sm text-muted">Ước tính cho {cost.lines[2]?.note}, dựa trên đơn giá của tòa nhà. Tiền điện tùy cách dùng máy lạnh.</p>
            <table className="mt-4 w-full max-w-lg text-[0.9375rem]">
              <tbody>
                {cost.lines.map((l) => (
                  <tr key={l.label} className="border-b border-line">
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-ink-soft">
                      {l.label}
                      {l.note ? <span className="block text-xs text-muted">{l.note}</span> : null}
                    </th>
                    <td className="tabular py-2.5 text-right font-semibold">{formatVnd(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="pt-3 text-left font-bold">
                    Tổng cộng
                  </th>
                  <td className="tabular pt-3 text-right text-xl font-extrabold text-shutter">{formatVnd(cost.total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <section aria-labelledby="tien-nghi-phong" className="mt-12">
            <h2 id="tien-nghi-phong" className="text-xl font-extrabold">
              Tiện nghi
            </h2>
            <div className="mt-4">
              <AmenityList codes={[...room.amenities, ...project.amenities]} />
            </div>
          </section>

          <section aria-labelledby="noi-quy-phong" className="mt-12">
            <h2 id="noi-quy-phong" className="text-xl font-extrabold">
              Nội quy
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-ink-soft marker:text-line-strong">
              {project.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="text-sm text-muted">Giá thuê</p>
            <p>
              <span className="text-3xl font-extrabold">{formatPriceShort(room.price)}</span>
              <span className="text-muted">/tháng</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-shutter">
              {room.status === "available" && room.availableFrom <= TODAY ? "Vào ở ngay" : `Trống từ ${formatDate(room.availableFrom)}`}
            </p>
            {bookable ? (
              <Link href={`/dat-lich?project=${project.code}&room=${room.code}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
                Đặt lịch xem phòng này
              </Link>
            ) : (
              <Link href={`/du-an/${project.slug}`} className={buttonStyles({ size: "lg", className: "mt-5 w-full" })}>
                Xem phòng khác cùng tòa
              </Link>
            )}
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-2 w-full" })}>
              <Phone aria-hidden />
              Gọi {SITE.hotline}
            </a>
            {room.status === "reserved" ? <p className="mt-4 rounded-lg bg-wall-tint p-3 text-sm text-wall-dark">Phòng đang có người giữ chỗ. Đặt lịch để được báo ngay nếu phòng trống lại.</p> : null}
          </div>
        </aside>
      </Container>

      {similar.length > 0 ? (
        <Container className="mt-16">
          <h2 className="text-xl font-extrabold">Phòng tương tự</h2>
          <p className="mt-1 text-sm text-muted">Cùng khu vực, giá chênh không quá một phần tư.</p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {similar.map((s) => (
              <li key={s.room.id}>
                <RoomCard room={s.room} project={s.project} showProject />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </>
  );
}
