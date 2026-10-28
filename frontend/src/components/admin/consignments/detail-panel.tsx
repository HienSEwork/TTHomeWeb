"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";
import { Tag } from "@/components/admin/parts";
import { ReviewModal, buttonBase } from "./review-modal";
import {
  STATUS,
  formatDate,
  formatDateTime,
  isOpenForReview,
  parseRooms,
  priceRange,
  statusLabel,
  type Decision,
  type Submission,
} from "./model";

const DASH = <span className="text-ink-soft">—</span>;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-line/60 py-2.5 text-[0.9375rem]">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="min-w-0 break-words">{children || DASH}</dd>
    </div>
  );
}

function Rooms({ json }: { json: string | null }) {
  const rooms = parseRooms(json);
  if (rooms === null) return <pre className="whitespace-pre-wrap break-words text-sm text-ink-soft">{json}</pre>;
  if (rooms.length === 0) return DASH;
  return (
    <ol className="space-y-1">
      {rooms.map((room, i) => (
        <li key={i} className="text-sm">
          <span className="tabular-nums text-ink-soft">{i + 1}. </span>
          {Object.entries(room).map(([k, v]) => `${k}: ${v}`).join(" · ")}
        </li>
      ))}
    </ol>
  );
}

export function DetailPanel({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { data, error, loading, reload } = useAdminQuery<Submission>(`consignment/submissions/${id}`);
  const [decision, setDecision] = useState<Decision>();

  return (
    <aside
      aria-label="Chi tiết hồ sơ ký gửi"
      className="step-in fixed inset-y-0 right-0 z-30 flex w-[min(30rem,100vw)] flex-col overflow-y-auto border-l border-line bg-paper shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="min-w-0 truncate font-mono text-lg font-semibold">{data?.code ?? "Hồ sơ ký gửi"}</h2>
        <button type="button" onClick={onClose} className={`${buttonBase} h-9 px-4 text-ink-soft hover:bg-sunken`}>Đóng</button>
      </div>

      <div className="flex-1 px-6 py-5" aria-busy={loading}>
        {error ? <Notice>{errorMessage(error)}</Notice> : null}
        {loading && !data && <p className="text-ink-soft">Đang tải…</p>}
        {data && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Tag tone={STATUS[data.status]?.tone}>{statusLabel(data.status)}</Tag>
              <span className="text-sm text-ink-soft">Gửi ngày {formatDate(data.createdAt)}</span>
            </div>
            <dl className="border-t border-line/60">
              <Row label="Chủ nhà">{data.landlordName}</Row>
              <Row label="Điện thoại">{<span className="tabular-nums">{data.landlordPhone}</span>}</Row>
              <Row label="Dự án">{data.projectName}</Row>
              <Row label="Địa chỉ">{data.addressText}</Row>
              <Row label="Số phòng"><span className="tabular-nums">{data.roomCount}</span></Row>
              <Row label="Giá mong muốn"><span className="tabular-nums">{priceRange(data.expectedPriceMin, data.expectedPriceMax)}</span></Row>
              <Row label="Ghi chú của chủ nhà">{data.note}</Row>
              {data.rejectReason && <Row label="Lý do từ chối">{data.rejectReason}</Row>}
              <Row label="Danh sách phòng"><Rooms json={data.roomsJson} /></Row>
            </dl>

            <h3 className="mt-6 text-base font-semibold">Lịch sử duyệt</h3>
            {data.reviewLog && data.reviewLog.length > 0 ? (
              <ol className="mt-2 space-y-3">
                {data.reviewLog.map((entry, i) => (
                  <li key={i} className="border-b border-line/60 pb-3 text-[0.9375rem]">
                    <p>
                      {entry.fromStatus ? `${statusLabel(entry.fromStatus)} → ` : ""}
                      <span className="font-medium">{statusLabel(entry.toStatus)}</span>
                      <span className="ml-2 text-sm tabular-nums text-ink-soft">{formatDateTime(entry.createdAt)}</span>
                    </p>
                    {entry.note && <p className="mt-1 text-ink-soft">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink-soft">Chưa có lượt duyệt nào.</p>
            )}
          </>
        )}
      </div>

      {data && isOpenForReview(data.status) && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" onClick={() => setDecision("reject")} className={`${buttonBase} border border-danger text-danger hover:bg-danger/10`}>Từ chối</button>
          <button type="button" onClick={() => setDecision("need_info")} className={`${buttonBase} border border-line text-ink hover:bg-sunken`}>Yêu cầu bổ sung</button>
          <button type="button" onClick={() => setDecision("approve")} className={`${buttonBase} bg-ink text-paper hover:bg-ink/85`}>Duyệt</button>
        </div>
      )}

      {data && decision && (
        <ReviewModal
          submission={data}
          decision={decision}
          onClose={() => setDecision(undefined)}
          onDone={() => {
            setDecision(undefined);
            reload();
            onChanged();
          }}
        />
      )}
    </aside>
  );
}
