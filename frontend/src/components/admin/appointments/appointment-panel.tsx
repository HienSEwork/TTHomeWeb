"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Notice } from "@/components/ui";
import { Tag } from "@/components/admin/parts";
import { ActionButton, Dash, Facts, PanelSection, Select, SidePanel, TextArea, TextInput } from "@/components/admin/operations/controls";
import { formatDateTime, mutationError, toInstant, toLocalInput } from "@/components/admin/operations/format";
import type { Option } from "@/components/admin/operations/types";
import { HISTORY_NOTE, isOpen, MOVE_LABEL, MOVES, STATUS, type Appointment } from "./model";

type Lookup = { options: Option[]; nameOf: (id?: string | null) => string };
type Run = (action: string, body: unknown) => Promise<boolean>;

export function AppointmentPanel({ id, staff, projects, onClose, onChanged }: {
  id: string;
  staff: Lookup;
  projects: Lookup;
  onClose: () => void;
  onChanged: () => void;
}) {
  const detail = useAdminQuery<Appointment>(`booking/appointments/${id}`);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const a = detail.data;

  const run: Run = async (action, body) => {
    setBusy(true);
    setError(undefined);
    try {
      await adminApi(`booking/appointments/${id}/${action}`, { method: "PUT", body });
      detail.reload();
      onChanged();
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const status = a && (STATUS[a.status] ?? { label: a.status, tone: "neutral" as const });
  return (
    <SidePanel
      title={a ? a.contactName || "Khách chưa để lại tên" : "Lịch hẹn"}
      subtitle={a && <><span className="font-mono">{a.code}</span>{status && <Tag tone={status.tone}>{status.label}</Tag>}</>}
      onClose={onClose}
    >
      {detail.error ? <div className="mt-5"><Notice>{mutationError(detail.error)}</Notice></div> : null}
      {!a && !detail.error && <p className="mt-6 text-ink-soft">Đang tải…</p>}
      {a && (
        <>
          <Facts
            rows={[
              ["Giờ hẹn", `${formatDateTime(a.scheduledAt)} · ${a.durationMin} phút`],
              ["Dự án", projects.nameOf(a.projectId)],
              ["Số điện thoại", a.contactPhone || <Dash />],
              ["Ngày tạo", formatDateTime(a.createdAt)],
              ...(a.cancelReason ? ([["Lý do hủy", a.cancelReason]] as [string, string][]) : []),
            ]}
          />
          <div className="mt-4" aria-live="polite">
            <Notice>{error ? mutationError(error) : undefined}</Notice>
          </div>

          <PanelSection title="Nhân viên phụ trách">
            <Select
              label="Nhân viên phụ trách"
              value={a.staffId ?? ""}
              options={staff.options}
              any="Chưa phân công"
              disabled={busy || !isOpen(a.status)}
              onChange={(v) => run("staff", { staffId: v || null })}
            />
          </PanelSection>

          {isOpen(a.status) && (
            <>
              <PanelSection title="Chuyển trạng thái">
                <StatusActions a={a} busy={busy} run={run} />
              </PanelSection>
              <PanelSection title="Đổi lịch">
                <RescheduleForm key={a.scheduledAt + a.durationMin} a={a} busy={busy} run={run} />
              </PanelSection>
            </>
          )}

          <PanelSection title="Ghi chú nội bộ">
            <NoteForm key={a.note ?? ""} initial={a.note ?? ""} busy={busy} run={run} />
          </PanelSection>

          <PanelSection title="Lịch sử">
            {a.history?.length ? (
              <ol className="grid gap-3 text-sm">
                {a.history.map((h, i) => (
                  <li key={i}>
                    <p className="font-medium">
                      {h.fromStatus === h.toStatus
                        ? (h.note && HISTORY_NOTE[h.note]) || h.note || STATUS[h.toStatus]?.label
                        : `${STATUS[h.fromStatus]?.label ?? h.fromStatus} → ${STATUS[h.toStatus]?.label ?? h.toStatus}`}
                    </p>
                    <p className="text-ink-soft tabular-nums">
                      {formatDateTime(h.createdAt)} · {staff.nameOf(h.changedBy)}
                    </p>
                    {h.fromStatus !== h.toStatus && h.note && <p className="mt-0.5">{h.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-soft">Chưa có thay đổi nào được ghi lại.</p>
            )}
          </PanelSection>
        </>
      )}
    </SidePanel>
  );
}

function StatusActions({ a, busy, run }: { a: Appointment; busy: boolean; run: Run }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [now] = useState(() => Date.now()); // fixed while the panel is open; the server re-checks anyway
  const past = new Date(a.scheduledAt).getTime() <= now;

  if (cancelling) {
    return (
      <div className="grid gap-2">
        <TextInput label="Lý do hủy lịch" placeholder="Lý do hủy lịch (bắt buộc)" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <ActionButton primary disabled={busy || !reason.trim()} onClick={() => run("status", { status: "cancelled", reason: reason.trim() })}>
            Xác nhận hủy
          </ActionButton>
          <ActionButton onClick={() => setCancelling(false)}>Quay lại</ActionButton>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {MOVES[a.status].map((to) => {
        // The visit has to be over before it can be completed or marked as a no show.
        const early = !past && (to === "completed" || to === "no_show");
        return (
          <ActionButton
            key={to}
            primary={to === "confirmed"}
            disabled={busy || early}
            title={early ? "Chưa đến giờ hẹn" : undefined}
            onClick={() => (to === "cancelled" ? setCancelling(true) : run("status", { status: to }))}
          >
            {MOVE_LABEL[to]}
          </ActionButton>
        );
      })}
    </div>
  );
}

function RescheduleForm({ a, busy, run }: { a: Appointment; busy: boolean; run: Run }) {
  const [when, setWhen] = useState(toLocalInput(a.scheduledAt));
  const [minutes, setMinutes] = useState(String(a.durationMin));
  const [note, setNote] = useState("");
  const valid = Boolean(when) && Number(minutes) >= 5 && Number(minutes) <= 480;
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run("reschedule", { scheduledAt: toInstant(when), durationMin: Number(minutes), note: note.trim() || null });
      }}
    >
      <div className="flex flex-wrap gap-2">
        <TextInput label="Giờ hẹn mới" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} />
        <TextInput label="Thời lượng (phút)" type="number" min={5} max={480} required value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-24 tabular-nums" />
      </div>
      <TextInput label="Lý do đổi lịch" placeholder="Lý do đổi lịch (không bắt buộc)" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <div>
        <ActionButton type="submit" disabled={busy || !valid}>Đổi lịch</ActionButton>
      </div>
    </form>
  );
}

function NoteForm({ initial, busy, run }: { initial: string; busy: boolean; run: Run }) {
  const [text, setText] = useState(initial);
  return (
    <div className="grid gap-2">
      <TextArea label="Ghi chú nội bộ" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
      <div>
        <ActionButton disabled={busy || text === initial} onClick={() => run("note", { note: text })}>Lưu ghi chú</ActionButton>
      </div>
    </div>
  );
}
