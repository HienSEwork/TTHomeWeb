import type { Metadata } from "next";
import { AMENITIES, DISTRICTS, LANDMARKS, PROJECTS, ROOM_TYPE_LABEL } from "@tthome/data";
import { Badge } from "@tthome/ui";
import { PageHeader, Panel } from "@/components/page-parts";

export const metadata: Metadata = { title: "Khu vực và tiện nghi" };

const SCOPE = { room: "Phòng", project: "Tòa nhà", both: "Cả hai" } as const;
const LANDMARK_KIND = { university: "Trường học", mall: "Trung tâm thương mại", industrial: "Khu công nghiệp", hospital: "Bệnh viện", other: "Khác" } as const;

export default function CatalogPage() {
  const projectsIn = (district: string, ward?: string) => PROJECTS.filter((p) => p.districtSlug === district && (!ward || p.wardSlug === ward)).length;
  const amenityUse = (code: string) => PROJECTS.filter((p) => p.amenities.includes(code) || p.rooms.some((r) => r.amenities.includes(code))).length;

  return (
    <>
      <PageHeader title="Khu vực và tiện nghi" description="Danh mục dùng cho bộ lọc trên web và đường dẫn trang khu vực. Đổi tên ở đây không làm đổi đường dẫn đã có." />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={`Khu vực (${DISTRICTS.length} quận, ${DISTRICTS.reduce((n, d) => n + d.wards.length, 0)} phường)`}>
          <ul className="divide-y divide-line">
            {DISTRICTS.map((d) => (
              <li key={d.slug} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold text-ink">{d.name}</p>
                  <p className="text-sm text-muted tabular">{projectsIn(d.slug)} dự án</p>
                </div>
                <p className="text-xs text-muted">/phong-tro/ho-chi-minh/{d.slug}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {d.wards.map((w) => (
                    <li key={w.slug}>
                      <Badge tone="plate">
                        {w.name.replace("Phường ", "P. ")}
                        <span className="font-normal opacity-75">{projectsIn(d.slug, w.slug)}</span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-4">
          <Panel title={`Tiện nghi (${AMENITIES.length})`}>
            <table className="w-full text-sm">
              <caption className="sr-only">Tiện nghi</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-2 font-semibold">Tên hiển thị</th>
                  <th className="px-3 py-2 font-semibold">Áp dụng cho</th>
                  <th className="px-5 py-2 text-right font-semibold">Dự án dùng</th>
                </tr>
              </thead>
              <tbody>
                {AMENITIES.map((a) => (
                  <tr key={a.code} className="border-t border-line">
                    <td className="px-5 py-2 text-ink">
                      {a.name}
                      <span className="block text-xs text-muted">{a.code}</span>
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{SCOPE[a.scope]}</td>
                    <td className="px-5 py-2 text-right tabular">{amenityUse(a.code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={`Địa danh cho mục Tìm gần (${LANDMARKS.length})`}>
            <ul className="divide-y divide-line">
              {LANDMARKS.map((l) => (
                <li key={l.slug} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <span>
                    <span className="block font-semibold text-ink">{l.name}</span>
                    <span className="text-xs text-muted tabular">
                      {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                    </span>
                  </span>
                  <Badge>{LANDMARK_KIND[l.kind]}</Badge>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Loại phòng">
            <ul className="flex flex-wrap gap-1.5 px-5 py-4">
              {Object.entries(ROOM_TYPE_LABEL).map(([code, label]) => (
                <li key={code}>
                  <Badge>{label}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
