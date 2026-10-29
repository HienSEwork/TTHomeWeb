import type { Metadata } from "next";
import { SYNC_RUNS, SYNC_STATUS } from "@tthome/data";
import { Badge, StatusDot, formatCount } from "@tthome/ui";
import { PageHeader, Panel, TableFrame, td, th } from "@/components/page-parts";
import { fmt } from "@/lib/format";
import { RunSyncButton } from "./run-sync-button";

export const metadata: Metadata = { title: "Đồng bộ Meey CRM" };

const KIND = { incremental: "Kéo thay đổi", reconcile: "Đối soát ban đêm", import_file: "Nhập file" } as const;

export default function SyncPage() {
  const last = SYNC_RUNS[0]!;
  const errors = SYNC_RUNS.reduce((n, r) => n + r.errors, 0);
  return (
    <>
      <PageHeader
        title="Đồng bộ Meey CRM"
        description="Dự án, phòng, giá và trạng thái được kéo từ Meey CRM mỗi 2 phút; đối soát toàn bộ lúc 2 giờ sáng."
        actions={<RunSyncButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel title="Lần chạy gần nhất">
          <div className="px-5 py-4">
            <StatusDot tone={SYNC_STATUS[last.status].tone}>{SYNC_STATUS[last.status].label}</StatusDot>
            <p className="mt-1 text-sm text-muted tabular">{fmt.dateTime(last.startedAt)}</p>
          </div>
        </Panel>
        <Panel title="Độ trễ dữ liệu">
          <p className="px-5 py-4 text-2xl font-extrabold text-ink">
            Khoảng 1 phút<span className="block text-sm font-normal text-muted">Cảnh báo khi vượt 10 phút</span>
          </p>
        </Panel>
        <Panel title="Lỗi ánh xạ gần đây">
          <p className="px-5 py-4 text-2xl font-extrabold text-ink tabular">
            {errors}
            <span className="block text-sm font-normal text-muted">Thường do địa chỉ chưa khớp phường sau sáp nhập</span>
          </p>
        </Panel>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">Các lần chạy</h2>
      <TableFrame caption="Các lần đồng bộ">
        <thead>
          <tr>
            <th className={th}>Bắt đầu</th>
            <th className={th}>Loại</th>
            <th className={`${th} text-right`}>Thời gian chạy</th>
            <th className={`${th} text-right`}>Bản ghi</th>
            <th className={`${th} text-right`}>Lỗi</th>
            <th className={th}>Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {SYNC_RUNS.map((r) => (
            <tr key={r.id}>
              <td className={`${td} text-ink tabular`}>{fmt.dateTime(r.startedAt)}</td>
              <td className={`${td} text-ink-soft`}>{KIND[r.kind]}</td>
              <td className={`${td} text-right tabular`}>{r.durationSec < 60 ? `${r.durationSec} giây` : `${Math.round(r.durationSec / 60)} phút`}</td>
              <td className={`${td} text-right tabular`}>{formatCount(r.records)}</td>
              <td className={`${td} text-right tabular ${r.errors ? "font-semibold text-warn" : "text-muted"}`}>{r.errors}</td>
              <td className={td}>
                <Badge tone={SYNC_STATUS[r.status].tone}>{SYNC_STATUS[r.status].label}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </TableFrame>
    </>
  );
}
