"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Notice } from "@/components/ui";
import { Tag } from "@/components/admin/parts";
import { ActionButton, Dash, Facts, PanelSection, Select, SidePanel } from "@/components/admin/operations/controls";
import { formatDate, formatDateTime, money, mutationError } from "@/components/admin/operations/format";
import type { Option } from "@/components/admin/operations/types";
import { CONSULT_MOVE_LABEL, CONSULT_MOVES, CONSULT_STATUS, type ConsultRequest } from "./model";

export function ConsultPanel({ id, staff, onClose, onChanged, onOpenCustomer }: {
  id: string;
  staff: { options: Option[]; nameOf: (id?: string | null) => string };
  onClose: () => void;
  onChanged: () => void;
  onOpenCustomer: (customerId: string) => void;
}) {
  const detail = useAdminQuery<ConsultRequest>(`crm/consult-requests/${id}`);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const r = detail.data;

  const run = async (action: string, body: unknown) => {
    setBusy(true);
    setError(undefined);
    try {
      await adminApi(`crm/consult-requests/${id}/${action}`, { method: "PUT", body });
      detail.reload();
      onChanged();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const status = r && (CONSULT_STATUS[r.status] ?? { label: r.status, tone: "neutral" as const });
  const moves = r ? (CONSULT_MOVES[r.status] ?? []) : [];
  const closed = r !== undefined && moves.length === 0;
  return (
    <SidePanel title={r ? r.fullName : "Yêu cầu tư vấn"} subtitle={status && <Tag tone={status.tone}>{status.label}</Tag>} onClose={onClose}>
      {detail.error ? <div className="mt-5"><Notice>{mutationError(detail.error)}</Notice></div> : null}
      {!r && !detail.error && <p className="mt-6 text-ink-soft">Đang tải…</p>}
      {r && (
        <>
          <Facts
            rows={[
              ["Số điện thoại", <span key="p" className="tabular-nums">{r.phone}</span>],
              ["Khu vực", r.areaText || <Dash />],
              ["Ngân sách tối đa", money(r.budgetMax)],
              ["Dự định dọn vào", formatDate(r.moveInDate)],
              ["Kênh", r.channel || <Dash />],
              ["Gửi lúc", formatDateTime(r.createdAt)],
              ["Lời nhắn", r.message ? <span key="m" className="whitespace-pre-line">{r.message}</span> : <Dash />],
            ]}
          />
          {r.customerId && (
            <div className="mt-4">
              <ActionButton onClick={() => onOpenCustomer(r.customerId!)}>Mở hồ sơ khách</ActionButton>
            </div>
          )}
          <div className="mt-4" aria-live="polite">
            <Notice>{error ? mutationError(error) : undefined}</Notice>
          </div>

          <PanelSection title="Nhân viên phụ trách">
            <Select
              label="Nhân viên phụ trách"
              value={r.assignedTo ?? ""}
              options={staff.options}
              any="Chưa giao"
              disabled={busy || r.status === "done" || r.status === "spam"}
              onChange={(v) => run("assignee", { userId: v || null })}
            />
          </PanelSection>

          <PanelSection title="Chuyển trạng thái">
            {closed ? (
              <p className="text-sm text-ink-soft">Yêu cầu đã đóng, không đổi trạng thái được nữa.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {moves.map((to) => (
                  <ActionButton key={to} primary={to === "done"} disabled={busy} onClick={() => run("status", { status: to })}>
                    {CONSULT_MOVE_LABEL[to]}
                  </ActionButton>
                ))}
                {r.status === "new" && <p className="w-full text-sm text-ink-soft">Giao cho nhân viên trước khi đánh dấu đã liên hệ.</p>}
              </div>
            )}
          </PanelSection>
        </>
      )}
    </SidePanel>
  );
}
