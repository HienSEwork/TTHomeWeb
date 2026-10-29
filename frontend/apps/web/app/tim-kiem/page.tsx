import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { DISTRICTS, findLandmark, searchProjects } from "@tthome/data";
import { EmptyState, buttonStyles } from "@tthome/ui";
import { MapSheet } from "@/components/map-sheet";
import { MapView } from "@/components/map-view";
import { ProjectCard } from "@/components/project-card";
import { SearchBox } from "@/components/search-box";
import { SearchToolbar } from "@/components/search-filters";
import { toMapLandmarks, toMapPins } from "@/lib/map-pins";
import { activeFilterCount, parseSearchParams, toSearchQuery } from "@/lib/search-params";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function headline(f: ReturnType<typeof parseSearchParams>): string {
  const landmark = f.landmark ? findLandmark(f.landmark) : undefined;
  const district = f.district ? DISTRICTS.find((d) => d.slug === f.district) : undefined;
  const ward = district?.wards.find((w) => w.slug === f.ward);
  if (landmark) return `Phòng trọ gần ${landmark.name}`;
  if (ward && district) return `Phòng trọ ${ward.name}, ${district.name}`;
  if (district) return `Phòng trọ ${district.name}`;
  if (f.q) return `Kết quả cho “${f.q}”`;
  return "Phòng trống ở TP. Hồ Chí Minh";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseSearchParams(await searchParams);
  const title = headline(filters);
  return {
    title,
    description: `${title}: giá đã gồm điện nước, xem phòng miễn phí cùng TTHOME.`,
    alternates: { canonical: `/tim-kiem${toSearchQuery({ landmark: filters.landmark, district: filters.district, ward: filters.ward })}` },
    robots: activeFilterCount(filters) > 2 || filters.q ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseSearchParams(await searchParams);
  const results = searchProjects(filters);
  const roomCount = results.reduce((n, r) => n + r.rooms.length, 0);
  const pins = toMapPins(results);
  const landmarks = toMapLandmarks(filters.landmark ? [filters.landmark] : undefined);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(400px,40%)]">
      <div className="min-w-0 px-4 pt-6 pb-24 sm:px-6 lg:pb-12 xl:pl-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))]">
        <SearchBox defaultValue={filters.q ?? ""} size="md" className="max-w-2xl" />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">{headline(filters)}</h1>
            <p className="mt-1 text-sm text-muted" aria-live="polite">
              {roomCount} phòng trống trong {results.length} tòa nhà
            </p>
          </div>
          <Link href={`/dang-nhap?next=${encodeURIComponent(`/tim-kiem${toSearchQuery(filters)}`)}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <Bookmark aria-hidden />
            Lưu tìm kiếm
          </Link>
        </div>

        <div className="sticky top-[72px] z-20 -mx-4 mt-4 border-b border-line bg-wash/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <SearchToolbar filters={filters} />
        </div>

        {results.length === 0 ? (
          <EmptyState
            className="mt-8"
            title="Chưa có phòng trống khớp bộ lọc này"
            description="Thử nới khoảng giá, bỏ bớt tiện nghi hoặc để lại nhu cầu, nhân viên sẽ gọi khi có phòng phù hợp."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/tim-kiem" className={buttonStyles({ variant: "secondary" })}>
                  Xóa bộ lọc
                </Link>
                <Link href="/dat-lich" className={buttonStyles()}>
                  Nhờ tư vấn tìm phòng
                </Link>
              </div>
            }
          />
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {results.map((m, i) => (
              <li key={m.project.id} className="flex">
                <ProjectCard match={m} priority={i < 2} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside aria-label="Bản đồ" className="hidden lg:block">
        <div className="sticky top-[72px] h-[calc(100dvh-72px)] border-l border-line">
          <MapView pins={pins} landmarks={landmarks} fit className="size-full" />
        </div>
      </aside>
      <MapSheet pins={pins} landmarks={landmarks} fit />
    </div>
  );
}
