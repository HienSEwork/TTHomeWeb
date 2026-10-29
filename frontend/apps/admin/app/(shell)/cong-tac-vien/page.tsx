import type { Metadata } from "next";
import { APPLICATION_STATUS, PARTNER_APPLICATIONS } from "@tthome/data";
import { Badge } from "@tthome/ui";
import { PageHeader, TableFrame, td, th } from "@/components/page-parts";
import { fmt } from "@/lib/format";

export const metadata: Metadata = { title: "Cộng tác viên" };

const KIND = { ctv: "Cộng tác viên", job: "Ứng tuyển" } as const;

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="Cộng tác viên và ứng tuyển" description="Đơn gửi từ trang Tuyển cộng tác viên và Tuyển dụng. Gọi lại trong 2 ngày làm việc." />
      <TableFrame caption="Đơn đăng ký">
        <thead>
          <tr>
            <th className={th}>Người đăng ký</th>
            <th className={th}>Loại</th>
            <th className={th}>Giới thiệu</th>
            <th className={th}>Trạng thái</th>
            <th className={th}>Gửi lúc</th>
          </tr>
        </thead>
        <tbody>
          {PARTNER_APPLICATIONS.map((a) => (
            <tr key={a.id} className="hover:bg-wash/60">
              <td className={td}>
                <p className="font-semibold text-ink">{a.name}</p>
                <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="text-xs text-shutter tabular hover:underline">
                  {a.phone}
                </a>
              </td>
              <td className={td}>
                <Badge tone={a.kind === "ctv" ? "wall" : "plate"}>{KIND[a.kind]}</Badge>
              </td>
              <td className={`${td} max-w-md text-ink-soft`}>{a.detail}</td>
              <td className={td}>
                <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
              </td>
              <td className={`${td} text-muted tabular`}>{fmt.dateTime(a.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
    </>
  );
}
