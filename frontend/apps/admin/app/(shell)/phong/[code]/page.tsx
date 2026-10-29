import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { AMENITY_NAME, FURNITURE_LABEL, PET_LABEL, PROJECTS, ROOM_STATUS, ROOM_TYPE_LABEL, projectAddress } from "@tthome/data";
import { Badge, buttonStyles, formatPriceShort, formatVnd } from "@tthome/ui";
import { PageHeader, Panel, TableFrame, td, th } from "@/components/page-parts";
import { fmt } from "@/lib/format";
import { DisplayForm } from "./display-form";

type Props = { params: Promise<{ code: string }> };

function findProject(code: string) {
  return PROJECTS.find((p) => p.code === code.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = findProject((await params).code);
  return { title: project?.name ?? "Không tìm thấy dự án" };
}

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ code: p.code }));
}

export default async function ProjectAdminPage({ params }: Props) {
  const project = findProject((await params).code);
  if (!project) notFound();

  return (
    <>
      <Link href="/phong" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        Phòng và dự án
      </Link>
      <PageHeader
        title={project.name}
        description={
          <>
            <span className="tabular">PRJ-{project.code}</span>, {projectAddress(project)}
          </>
        }
        actions={
          <a href={`/du-an/${project.slug}`} target="_blank" rel="noopener" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <ExternalLink aria-hidden />
            Xem trên web
          </a>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <DisplayForm project={project} />

        <Panel title="Dữ liệu từ Meey CRM" className="self-start">
          <p className="border-b border-line bg-plate-tint/50 px-5 py-3 text-sm text-plate-dark">
            Các trường này chỉ đọc. Sửa trên Meey CRM, web sẽ cập nhật sau khoảng 2 phút.
          </p>
          <dl className="divide-y divide-line text-sm">
            {[
              ["Địa chỉ", projectAddress(project)],
              ["Thú cưng", PET_LABEL[project.petPolicy]],
              ["Sạc xe điện", project.evParking ? "Có" : "Không"],
              ["Tiện nghi tòa nhà", project.amenities.map((a) => AMENITY_NAME[a]).join(", ")],
              ["Điện", `${formatVnd(project.fees.electric)}/kWh`],
              ["Nước", `${formatVnd(project.fees.water)}/người`],
              ["Phí dịch vụ", `${formatVnd(project.fees.service)}/phòng`],
              ["Gửi xe", `${formatVnd(project.fees.parking)}/xe`],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-5 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Phòng trong dự án ({project.rooms.length})</h2>
      <TableFrame caption={`Phòng của ${project.name}`}>
        <thead>
          <tr>
            <th className={th}>Phòng</th>
            <th className={th}>Loại</th>
            <th className={`${th} text-right`}>Diện tích</th>
            <th className={th}>Nội thất</th>
            <th className={`${th} text-right`}>Giá thuê</th>
            <th className={th}>Trạng thái</th>
            <th className={th}>Trống từ</th>
          </tr>
        </thead>
        <tbody>
          {project.rooms.map((r) => (
            <tr key={r.id}>
              <td className={`${td} font-semibold text-ink`}>
                {r.name}
                <span className="block text-xs font-normal text-muted tabular">
                  {r.code}, tầng {r.floor}
                </span>
              </td>
              <td className={`${td} text-ink-soft`}>{ROOM_TYPE_LABEL[r.type]}</td>
              <td className={`${td} text-right tabular`}>{r.area} m²</td>
              <td className={`${td} text-ink-soft`}>{FURNITURE_LABEL[r.furniture]}</td>
              <td className={`${td} text-right font-semibold tabular`}>{formatPriceShort(r.price)}</td>
              <td className={td}>
                <Badge tone={ROOM_STATUS[r.status].tone}>{ROOM_STATUS[r.status].label}</Badge>
              </td>
              <td className={`${td} text-muted tabular`}>{fmt.date(r.availableFrom)}</td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
    </>
  );
}
