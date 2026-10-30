import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { areaStats, DISTRICTS, districtStats, PROJECTS, PROVINCE } from "@tthome/data";
import { Container, formatFromPrice } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { areaHref } from "@/lib/area-route";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Phòng trọ theo khu vực",
  description: "Số phòng trống và giá thuê từ thấp nhất ở từng quận, phường TP. Cần Thơ. Chọn khu vực để xem phòng còn trống.",
  alternates: { canonical: "/khu-vuc" },
};

export default function AreasPage() {
  const wards = areaStats();
  const districts = DISTRICTS.map((district) => {
    const stats = districtStats(district.slug);
    const showcase = PROJECTS.filter((p) => p.districtSlug === district.slug).sort((a, b) => b.views - a.views)[0];
    return { district, stats, photo: showcase?.images[0], wards: wards.filter((w) => w.district.slug === district.slug) };
  })
    .filter((d) => d.stats.projects > 0)
    .sort((a, b) => b.stats.vacant - a.stats.vacant);

  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--color-ivory),#fff)]">
        <Container className="py-10 sm:py-14">
          <Breadcrumbs items={[{ label: "Khu vực" }]} />
          <h1 className="mt-5 text-[2rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.75rem]">Phòng trọ theo khu vực</h1>
          <p className="mt-3 max-w-2xl text-muted">
            {DISTRICTS.length} quận ở {PROVINCE.name}. Số phòng trống và giá từ thấp nhất cập nhật vài phút một lần từ hệ thống quản lý phòng.
          </p>
        </Container>
      </section>

      <Container className="py-12">
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {districts.map(({ district, stats, photo, wards: list }) => (
            <li key={district.slug} className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
              <Link href={areaHref({ district })} className="group relative block aspect-[16/9] overflow-hidden bg-ivory">
                {photo ? (
                  <Image src={photo} alt={`Phòng trọ ${district.name}`} fill sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100" />
                ) : null}
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1d1a15]/70 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-white">
                  <span>
                    <span className="block text-xl font-bold">{district.name}</span>
                    <span className="text-sm text-white/85">
                      {stats.vacant} phòng trống trong {stats.projects} tòa, {formatFromPrice(stats.minPrice).toLowerCase()}
                    </span>
                  </span>
                  <span aria-hidden className="grid size-9 place-items-center rounded-full bg-white/90 text-ink">
                    <ArrowRight className="size-4" />
                  </span>
                </span>
              </Link>
              <ul className="divide-y divide-line px-5 py-2">
                {list.map((w) => (
                  <li key={w.ward.slug}>
                    <Link href={areaHref({ district, ward: w.ward })} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-gold-ink">
                      <span className="font-medium">{w.ward.name}</span>
                      <span className="text-muted">
                        <span className="font-semibold text-success">{w.vacant} trống</span>, {formatFromPrice(w.minPrice).toLowerCase()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
