"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Notice } from "@/components/ui";
import { Tag } from "@/components/admin/parts";
import { ActionButton, Dash, Facts, PanelSection, Select, SidePanel, TextArea, TextInput } from "@/components/admin/operations/controls";
import { formatDate, formatDateTime, mutationError } from "@/components/admin/operations/format";
import type { Option, Page } from "@/components/admin/operations/types";
import {
  DIRECTIONS, KINDS, MANUAL_KINDS, SOURCES, STAGES, stageChangeText, toOptions,
  type Customer, type CustomerNote, type Interaction,
} from "./model";

type Staff = { options: Option[]; nameOf: (id?: string | null) => string };

const STAGE_OPTIONS = toOptions(STAGES);

export function CustomerPanel({ id, staff, onClose, onChanged }: { id: string; staff: Staff; onClose: () => void; onChanged: () => void }) {
  const base = `crm/customers/${id}`;
  const customer = useAdminQuery<Customer>(base);
  const interactions = useAdminQuery<Page<Interaction>>(`${base}/interactions?size=50`);
  const notes = useAdminQuery<CustomerNote[]>(`${base}/notes`);
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const c = customer.data;

  // Runs one change, then reloads whatever it touched; resolves true on success.
  const run = async (method: "PUT" | "POST", path: string, body: unknown, refresh: { reload: () => void }[]) => {
    setBusy(true);
    setError(undefined);
    try {
      await adminApi(`${base}/${path}`, { method, body });
      refresh.forEach((r) => r.reload());
      onChanged();
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const stage = c && (STAGES[c.stage] ?? { label: c.stage, tone: "neutral" as const });
  return (
    <SidePanel title={c ? c.fullName : "Khách hàng"} subtitle={stage && <Tag tone={stage.tone}>{stage.label}</Tag>} onClose={onClose}>
      {customer.error ? <div className="mt-5"><Notice>{mutationError(customer.error)}</Notice></div> : null}
      {!c && !customer.error && <p className="mt-6 text-ink-soft">Đang tải…</p>}
      {c && (
        <>
          <Facts
            rows={[
              ["Số điện thoại", c.phone || <Dash />],
              ["Email", c.email || <Dash />],
              ["Zalo", c.zalo || <Dash />],
              ["Nguồn", SOURCES[c.source] ?? c.source],
              ["Người giới thiệu", c.referrerUserId ? staff.nameOf(c.referrerUserId) : <Dash />],
              ["Ưu tiên", <span key="p" className="tabular-nums">{c.priority}</span>],
              ["Liên hệ gần nhất", formatDateTime(c.lastContactAt)],
              ["Hẹn theo dõi", formatDateTime(c.nextFollowupAt)],
              ["Ngày tạo", formatDate(c.createdAt)],
              ...(c.lostReason ? ([["Lý do mất khách", c.lostReason]] as [string, string][]) : []),
            ]}
          />
          <div className="mt-4" aria-live="polite">
            <Notice>{error ? mutationError(error) : undefined}</Notice>
          </div>

          <PanelSection title="Giai đoạn">
            <StageForm key={c.stage} current={c.stage} busy={busy} onSubmit={(body) => run("PUT", "stage", body, [customer, interactions])} />
          </PanelSection>

          <PanelSection title="Nhân viên phụ trách">
            <Select
              label="Nhân viên phụ trách"
              value={c.ownerUserId ?? ""}
              options={staff.options}
              any="Chưa phân công"
              disabled={busy}
              onChange={(v) => run("PUT", "owner", { userId: v || null }, [customer, interactions])}
            />
          </PanelSection>

          <PanelSection title="Tương tác">
            <InteractionForm busy={busy} onSubmit={(body) => run("POST", "interactions", body, [interactions, customer])} />
            {interactions.error ? <div className="mt-3"><Notice>{mutationError(interactions.error)}</Notice></div> : null}
            {interactions.data?.items.length === 0 && <p className="mt-3 text-sm text-ink-soft">Chưa có tương tác nào.</p>}
            <ol className="mt-3 grid gap-3 text-sm">
              {interactions.data?.items.map((i) => (
                <li key={i.id}>
                  <p className="font-medium">
                    {KINDS[i.kind] ?? i.kind}
                    {i.direction && <span className="font-normal text-ink-soft"> · {DIRECTIONS[i.direction]}</span>}
                  </p>
                  <p className="text-ink-soft tabular-nums">{formatDateTime(i.createdAt)} · {staff.nameOf(i.actorId)}</p>
                  <p className="mt-0.5 whitespace-pre-line">{i.kind === "stage_change" ? stageChangeText(i.summary) : i.summary}</p>
                </li>
              ))}
            </ol>
          </PanelSection>

          <PanelSection title="Ghi chú">
            <NoteForm busy={busy} onSubmit={(body) => run("POST", "notes", body, [notes])} />
            {notes.error ? <div className="mt-3"><Notice>{mutationError(notes.error)}</Notice></div> : null}
            {notes.data?.length === 0 && <p className="mt-3 text-sm text-ink-soft">Chưa có ghi chú nào.</p>}
            <ul className="mt-3 grid gap-3 text-sm">
              {notes.data?.map((n) => (
                <li key={n.id}>
                  <p className="text-ink-soft tabular-nums">
                    {formatDateTime(n.createdAt)} · {staff.nameOf(n.authorId)}
                    {n.privateNote && <> · <Tag>Riêng tư</Tag></>}
                  </p>
                  <p className="mt-0.5 whitespace-pre-line">{n.body}</p>
                </li>
              ))}
            </ul>
          </PanelSection>
        </>
      )}
    </SidePanel>
  );
}

function StageForm({ current, busy, onSubmit }: { current: string; busy: boolean; onSubmit: (body: { stage: string; lostReason?: string }) => void }) {
  const [next, setNext] = useState(current);
  const [reason, setReason] = useState("");
  const lost = next === "lost";
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Select label="Giai đoạn mới" value={next} options={STAGE_OPTIONS} onChange={setNext} />
        <ActionButton primary disabled={busy || next === current || (lost && !reason.trim())} onClick={() => onSubmit(lost ? { stage: next, lostReason: reason.trim() } : { stage: next })}>
          Cập nhật giai đoạn
        </ActionButton>
      </div>
      {lost && <TextInput label="Lý do mất khách" placeholder="Lý do mất khách (bắt buộc)" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />}
    </div>
  );
}

function InteractionForm({ busy, onSubmit }: { busy: boolean; onSubmit: (body: { kind: string; direction: string | null; summary: string }) => Promise<boolean> }) {
  const [kind, setKind] = useState("call");
  const [direction, setDirection] = useState("");
  const [summary, setSummary] = useState("");
  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await onSubmit({ kind, direction: direction || null, summary: summary.trim() })) setSummary("");
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Select label="Hình thức liên hệ" value={kind} onChange={setKind} options={MANUAL_KINDS.map((value) => ({ value, label: KINDS[value] }))} />
        <Select label="Chiều liên hệ" value={direction} onChange={setDirection} options={toOptions(DIRECTIONS)} any="Không rõ chiều" />
      </div>
      <TextArea label="Nội dung tương tác" rows={2} maxLength={2000} placeholder="Nội dung trao đổi" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <div>
        <ActionButton type="submit" disabled={busy || !summary.trim()}>Ghi tương tác</ActionButton>
      </div>
    </form>
  );
}

function NoteForm({ busy, onSubmit }: { busy: boolean; onSubmit: (body: { body: string; privateNote: boolean }) => Promise<boolean> }) {
  const [body, setBody] = useState("");
  const [isPrivate, setPrivate] = useState(false);
  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (await onSubmit({ body: body.trim(), privateNote: isPrivate })) setBody("");
      }}
    >
      <TextArea label="Nội dung ghi chú" rows={2} maxLength={5000} placeholder="Ghi chú về khách" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} className="size-4 accent-ink" />
          Chỉ mình tôi xem được
        </label>
        <ActionButton type="submit" disabled={busy || !body.trim()}>Lưu ghi chú</ActionButton>
      </div>
    </form>
  );
}
