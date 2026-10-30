import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatFromPrice } from "@tthome/ui";
import { liveSearchEnabled, searchRooms, suggestProjects, type ApiSearch } from "@/lib/search-api";

export const metadata: Metadata = { title: "Demo tìm kiếm (API thật)", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const TYPES = ["", "studio", "duplex", "1pn", "2pn", "3pn", "shared", "dorm", "room"];
const SORTS = ["", "NEWEST", "PRICE_ASC", "PRICE_DESC", "POPULAR"];

/** Search results straight from search-service through the gateway; nothing here reads the mock data. */
export default async function DemoSearchPage({ searchParams }: Props) {
  if (!liveSearchEnabled()) notFound();
  const p = await searchParams;
  let data: ApiSearch | null = null;
  let suggestions: Awaited<ReturnType<typeof suggestProjects>> = [];
  let error: string | null = null;
  try {
    [data, suggestions] = await Promise.all([
      searchRooms({ q: p.q, price_max: p.price_max, room_type: p.room_type, sort: p.sort, pet: p.pet, page: p.page }),
      p.q ? suggestProjects(p.q) : Promise.resolve([]),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Không gọi được API";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Demo tìm kiếm (API thật)</h1>
      <form className="mt-4 flex flex-wrap items-end gap-3" role="search">
        <label className="text-sm">
          Từ khóa
          <input name="q" defaultValue={p.q} className="mt-1 block rounded-lg border border-line-strong px-3 py-2" />
        </label>
        <label className="text-sm">
          Giá tối đa
          <input name="price_max" type="number" step={100000} defaultValue={p.price_max} className="mt-1 block w-36 rounded-lg border border-line-strong px-3 py-2" />
        </label>
        <label className="text-sm">
          Loại phòng
          <select name="room_type" defaultValue={p.room_type ?? ""} className="mt-1 block rounded-lg border border-line-strong px-3 py-2">
            {TYPES.map((t) => <option key={t} value={t}>{t || "Tất cả"}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Sắp xếp
          <select name="sort" defaultValue={p.sort ?? ""} className="mt-1 block rounded-lg border border-line-strong px-3 py-2">
            {SORTS.map((s) => <option key={s} value={s}>{s || "Mặc định"}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input name="pet" type="checkbox" value="true" defaultChecked={p.pet === "true"} /> Nuôi thú cưng
        </label>
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">Tìm</button>
      </form>

      {error ? <p role="alert" className="mt-6 text-danger">{error}. Gateway và search-service đã chạy chưa?</p> : null}
      {suggestions.length > 0 ? (
        <p className="mt-4 text-sm text-muted">Gợi ý: {suggestions.map((s) => `${s.name} (${s.room_count})`).join(" · ")}</p>
      ) : null}
      {data ? (
        <>
          <p className="mt-4 text-sm text-muted" aria-live="polite">{data.total} phòng trống, trang {data.page}/{data.total_pages || 1}</p>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((r) => (
              <li key={r.room_id} className="overflow-hidden rounded-card border border-line bg-white">
                {r.cover_url ? <Image src={r.cover_url} alt={r.project_name} width={400} height={300} className="aspect-[4/3] w-full object-cover" /> : null}
                <div className="p-4">
                  <h2 className="font-semibold">{r.project_name}</h2>
                  <p className="text-xs text-muted">{r.address}</p>
                  <p className="mt-2 font-extrabold text-gold-ink">{formatFromPrice(r.price)}</p>
                  <p className="text-xs text-ink-soft">{r.room_type}{r.area_m2 ? ` · ${r.area_m2} m²` : ""}{r.is_promo ? " · Ưu đãi" : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}
