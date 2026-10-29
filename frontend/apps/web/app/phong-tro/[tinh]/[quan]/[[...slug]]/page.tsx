import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { areaStats, distanceKm, LANDMARKS, PRICE_BANDS, PROVINCE, searchProjects, type ProjectMatch } from "@tthome/data";
import { Container, EmptyState, Plate, buttonStyles, cn, formatFromPrice, formatPriceShort } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { MapView } from "@/components/map-view";
import { ProjectCard } from "@/components/project-card";
import { allAreaRoutes, areaHref, areaName, resolveAreaRoute, type AreaRoute } from "@/lib/area-route";
import { toMapLandmarks, toMapPins } from "@/lib/map-pins";

export const revalidate = 600;

type Props = { params: Promise<{ tinh: string; quan: string; slug?: string[] }> };

export function generateStaticParams() {
  return allAreaRoutes().map((r) => {
    const [, , tinh, quan, ...slug] = areaHref(r).split("/");
    return { tinh: tinh!, quan: quan!, slug };
  });
}

function matchesFor(route: AreaRoute): ProjectMatch[] {
  const max = route.band && route.band.max !== Number.MAX_SAFE_INTEGER ? route.band.max : undefined;
  return searchProjects({ district: route.district.slug, ward: route.ward?.slug, priceMin: route.band?.min || undefined, priceMax: max, sort: "price_asc" });
}

function title(route: AreaRoute): string {
  const base = `Phòng trọ ${areaName(route)}`;
  return route.band ? `${base} giá ${route.band.label.toLowerCase()}` : base;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tinh, quan, slug } = await params;
  const route = resolveAreaRoute(tinh, quan, slug);
  if (!route) return {};
  const matches = matchesFor(route);
  const rooms = matches.reduce((n, m) => n + m.rooms.length, 0);
  const from = Math.min(...matches.map((m) => m.minPrice ?? Infinity));
  return {
    title: title(route),
    description: `${rooms} phòng trống ở ${areaName(route)}${Number.isFinite(from) ? `, giá từ ${formatPriceShort(from)}` : ""}. Giá đã ghi rõ điện nước, xem phòng miễn phí cùng TTHOME.`,
    alternates: { canonical: areaHref(route) },
  };
}

export default async function AreaPage({ params }: Props) {
  const { tinh, quan, slug } = await params;
  const route = resolveAreaRoute(tinh, quan, slug);
  if (!route) notFound();

  const matches = matchesFor(route);
  const rooms = matches.reduce((n, m) => n + m.rooms.length, 0);
  const from = matches.length ? Math.min(...matches.map((m) => m.minPrice ?? Infinity)) : null;
  const wards = areaStats().filter((s) => s.district.slug === route.district.slug);
  const name = areaName(route);
  const placeRoute = { district: route.district, ward: route.ward };

  const faqs = [
    {
      q: `Giá thuê phòng trọ ở ${name} bao nhiêu?`,
      a: from ? `Phòng trống ở ${name} hiện có giá từ ${formatPriceShort(from)} mỗi tháng. Giá trên TTHOME là tiền phòng; điện, nước và phí dịch vụ được ghi riêng ở từng phòng.` : `Hiện chưa có phòng trống ở ${name} trong khoảng giá này. Để lại nhu cầu, nhân viên sẽ báo khi có phòng.`,
    },
    {
      q: `${name} còn bao nhiêu phòng trống?`,
      a: `TTHOME đang có ${rooms} phòng trống trong ${matches.length} tòa nhà ở ${name}. Số liệu cập nhật vài phút một lần từ hệ thống quản lý phòng.`,
    },
    {
      q: "Xem phòng có mất phí không?",
      a: "Không. Đặt lịch trên web hoặc gọi hotline, nhân viên TTHOME dẫn bạn đi xem miễn phí, có thể xem nhiều tòa trong một buổi.",
    },
  ];

  const crumbs = [
    { href: "/tim-kiem", label: "Phòng trọ" },
    { href: areaHref({ district: route.district }), label: route.district.name },
    ...(route.ward ? [{ href: areaHref(placeRoute), label: route.ward.name }] : []),
    ...(route.band ? [{ label: route.band.label }] : []),
  ];

  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-8 sm:py-10">
          <Breadcrumbs items={crumbs} />
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-title font-extrabold text-ink sm:text-[2.5rem] sm:leading-[1.1]">{title(route)}</h1>
              <p className="mt-3 max-w-2xl text-ink-soft">
                Danh sách phòng trọ, studio và căn hộ dịch vụ còn trống ở {name}, {PROVINCE.name}. Giá sắp từ thấp đến cao, đã ghi rõ điện nước và phí dịch vụ.
              </p>
            </div>
            <dl className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <dt className="sr-only">Phòng trống</dt>
                <dd>
                  <Plate value={rooms} unit="phòng trống" size="lg" />
                </dd>
              </div>
              <div className="flex flex-col justify-center rounded-plate border border-line px-4">
                <dt className="text-xs text-muted">Tòa nhà</dt>
                <dd className="tabular text-2xl font-extrabold">{matches.length}</dd>
              </div>
              <div className="flex flex-col justify-center rounded-plate border border-line px-4">
                <dt className="text-xs text-muted">Giá từ</dt>
                <dd className="text-2xl font-extrabold">{from && Number.isFinite(from) ? formatPriceShort(from) : "Liên hệ"}</dd>
              </div>
            </dl>
          </div>

          <nav aria-label="Lọc theo giá" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href={areaHref(placeRoute)}
                  aria-current={!route.band ? "page" : undefined}
                  className={cn("inline-flex rounded-full border px-3 py-1.5 text-sm font-medium", !route.band ? "border-selected-line bg-selected text-on-selected" : "border-line-strong text-ink-soft hover:border-ink")}
                >
                  Mọi mức giá
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
                      {b.label}
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
              title={`Chưa có phòng trống ở ${name} trong khoảng giá này`}
              description="Xem mọi mức giá, hoặc để lại nhu cầu để nhân viên gọi khi có phòng."
              action={
                <Link href="/dat-lich" className={buttonStyles()}>
                  Nhờ tư vấn tìm phòng
                </Link>
              }
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {matches.map((m) => (
                <li key={m.project.id} className="flex">
                  <ProjectCard match={m} className="w-full" />
                </li>
              ))}
            </ul>
          )}

          <section aria-labelledby="hoi-dap-khu-vuc" className="mt-14">
            <h2 id="hoi-dap-khu-vuc" className="text-xl font-extrabold">
              Hỏi đáp về thuê phòng ở {name}
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
              <MapView
                pins={toMapPins(matches)}
                landmarks={toMapLandmarks(LANDMARKS.filter((l) => matches.some((m) => distanceKm(l, m.project) < 4)).map((l) => l.slug))}
                fit
                className="aspect-square"
              />
            </div>
          ) : null}
          <nav aria-label={`Các phường ở ${route.district.name}`} className="rounded-card border border-line bg-surface p-4">
            <h2 className="font-bold">Phường khác ở {route.district.name}</h2>
            <ul className="mt-3 space-y-2">
              {wards.map((s) => (
                <li key={s.ward.slug}>
                  <Link
                    href={areaHref({ district: s.district, ward: s.ward })}
                    aria-current={s.ward.slug === route.ward?.slug ? "page" : undefined}
                    className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-wash aria-[current=page]:bg-plate-tint"
                  >
                    <Plate value={s.vacant} size="sm" className="min-w-9 justify-center" />
                    <span className="flex-1 text-sm font-semibold">{s.ward.name}</span>
                    <span className="text-sm text-muted">{formatFromPrice(s.minPrice)}</span>
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
