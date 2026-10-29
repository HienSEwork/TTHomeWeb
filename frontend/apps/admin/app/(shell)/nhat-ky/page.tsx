import type { Metadata } from "next";
import { AUDIT_LOG } from "@tthome/data";
import { PageHeader, TableFrame, td, th } from "@/components/page-parts";
import { fmt } from "@/lib/format";

export const metadata: Metadata = { title: "Nhật ký hoạt động" };

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Nhật ký hoạt động" description="Mọi thay đổi của nhân viên và quản trị viên, giữ trong 12 tháng. Không ai sửa hoặc xóa được nhật ký." />
      <TableFrame caption="Nhật ký hoạt động">
        <thead>
          <tr>
            <th className={th}>Thời gian</th>
            <th className={th}>Người thực hiện</th>
            <th className={th}>Thao tác</th>
            <th className={th}>Đối tượng</th>
            <th className={th}>Địa chỉ IP</th>
          </tr>
        </thead>
        <tbody>
          {AUDIT_LOG.map((a) => (
            <tr key={a.id} className="hover:bg-wash/60">
              <td className={`${td} text-muted tabular whitespace-nowrap`}>{fmt.dateTime(a.at)}</td>
              <td className={`${td} font-semibold text-ink`}>{a.actor}</td>
              <td className={`${td} text-ink`}>{a.action}</td>
              <td className={`${td} text-ink-soft`}>{a.entity}</td>
              <td className={`${td} text-muted tabular`}>{a.ip}</td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
    </>
  );
}
