"use client";

import { useReducer, useState } from "react";
import { Camera, Phone } from "lucide-react";
import { SUBMISSION_STATUS, SUBMISSIONS, TODAY, type SubmissionStatus } from "@tthome/data";
import { Badge, Button, EmptyState, TextAreaField, cn, formatPriceShort } from "@tthome/ui";
import { Dialog, Tabs, Toast } from "@/components/interactive";
import { dangerButton } from "@/components/page-parts";
import { countBy } from "@/lib/filters";
import { fmt } from "@/lib/format";
import { SUBMISSION_TRANSITIONS, reviewReducer } from "@/lib/workflow";

type Tab = "waiting" | "need_info" | "approved" | "done";
const TAB_STATUSES: Record<Tab, SubmissionStatus[]> = {
  waiting: ["submitted"],
  need_info: ["need_info"],
  approved: ["approved"],
  done: ["published", "rejected", "withdrawn"],
};

const ACTION_LABEL: Partial<Record<SubmissionStatus, string>> = {
  approved: "Duyệt",
  need_info: "Yêu cầu bổ sung",
  rejected: "Từ chối",
  published: "Đánh dấu đã đăng",
};

const DONE_MESSAGE: Partial<Record<SubmissionStatus, string>> = {
  approved: "Đã duyệt. Chủ nhà nhận tin nhắn hẹn chụp ảnh.",
  need_info: "Đã gửi yêu cầu bổ sung cho chủ nhà.",
  rejected: "Đã từ chối và báo cho chủ nhà.",
  published: "Đã đánh dấu đã đăng.",
};

const NEEDS_REASON: SubmissionStatus[] = ["need_info", "rejected"];

export function ReviewBoard() {
  const [items, dispatch] = useReducer(reviewReducer<(typeof SUBMISSIONS)[number]>, SUBMISSIONS);
  const [tab, setTab] = useState<Tab>("waiting");
  const [selected, setSelected] = useState<string | null>(SUBMISSIONS[0]?.code ?? null);
  const [pending, setPending] = useState<SubmissionStatus | null>(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const counts = countBy(items, ["submitted", "need_info", "approved", "rejected", "published", "withdrawn"] as const, (s) => s.status);
  const visible = items.filter((s) => TAB_STATUSES[tab].includes(s.status));
  const current = items.find((s) => s.code === selected) ?? null;

  function decide(to: SubmissionStatus) {
    if (!current) return;
    if (NEEDS_REASON.includes(to) && !reason.trim()) return;
    dispatch({ type: "decide", code: current.code, to, by: "Quản trị TTHome", at: `${TODAY}T09:00:00+07:00`, reason: reason.trim() });
    setToast(DONE_MESSAGE[to] ?? "Đã cập nhật");
    setPending(null);
    setReason("");
  }

  return (
    <div className="space-y-4">
      <Tabs
        label="Trạng thái ký gửi"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setSelected(items.find((s) => TAB_STATUSES[next].includes(s.status))?.code ?? null);
        }}
        tabs={[
          { value: "waiting", label: "Chờ duyệt", count: counts.submitted },
          { value: "need_info", label: "Cần bổ sung", count: counts.need_info },
          { value: "approved", label: "Đã duyệt, chờ đăng", count: counts.approved },
          { value: "done", label: "Đã xong", count: counts.published + counts.rejected + counts.withdrawn },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {visible.length ? (
          <ul className="space-y-2 self-start">
            {visible.map((s) => {
              const meta = SUBMISSION_STATUS[s.status];
              const active = s.code === current?.code;
              return (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setSelected(s.code)}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-card border bg-surface p-4 text-left transition-colors",
                      active ? "border-selected-line ring-1 ring-selected-line" : "border-line hover:border-ink/25",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-ink">{s.address}</p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {s.district}, {s.roomCount} phòng, từ {formatPriceShort(s.priceFrom)}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      <span className="tabular">{s.code}</span>, {s.landlord}, gửi {fmt.dateTime(s.submittedAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="Không còn hồ sơ nào ở đây" description="Hồ sơ mới từ chủ nhà sẽ xuất hiện ở tab Chờ duyệt." />
        )}

        {current ? (
          <section aria-label={`Hồ sơ ${current.code}`} className="self-start rounded-card border border-line bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <p className="text-xs text-muted tabular">{current.code}</p>
                <h2 className="text-lg font-bold text-ink">{current.address}</h2>
                <p className="text-sm text-muted">{current.district}</p>
              </div>
              <Badge tone={SUBMISSION_STATUS[current.status].tone}>{SUBMISSION_STATUS[current.status].label}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-3">
              <Field label="Chủ nhà" value={current.landlord} />
              <Field
                label="Điện thoại"
                value={
                  <a href={`tel:${current.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-semibold text-link hover:underline">
                    <Phone aria-hidden className="size-3.5" />
                    <span className="tabular">{current.phone}</span>
                  </a>
                }
              />
              <Field label="Số phòng" value={String(current.roomCount)} />
              <Field label="Loại phòng" value={current.roomTypes} />
              <Field label="Giá từ" value={formatPriceShort(current.priceFrom)} />
              <Field
                label="Ảnh đã gửi"
                value={
                  <span className={cn("inline-flex items-center gap-1", current.photos < 5 && "font-semibold text-warn")}>
                    <Camera aria-hidden className="size-3.5" />
                    {current.photos} ảnh{current.photos < 5 ? ", ít" : ""}
                  </span>
                }
              />
            </dl>
            {current.note ? (
              <p className="mx-5 mb-4 rounded-lg bg-wash px-3 py-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Ghi chú: </span>
                {current.note}
              </p>
            ) : null}

            {SUBMISSION_TRANSITIONS[current.status].length ? (
              <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
                {SUBMISSION_TRANSITIONS[current.status].map((to) => (
                  <Button
                    key={to}
                    size="sm"
                    variant={to === "approved" || to === "published" ? "primary" : "secondary"}
                    className={to === "rejected" ? "text-danger" : undefined}
                    onClick={() => (NEEDS_REASON.includes(to) ? setPending(to) : decide(to))}
                  >
                    {ACTION_LABEL[to]}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="border-t border-line px-5 py-4">
              <h3 className="text-sm font-bold text-ink">Lịch sử xử lý</h3>
              <ol className="mt-3 space-y-3 border-l border-line pl-4">
                {current.log.map((entry, i) => (
                  <li key={`${entry.at}-${i}`} className="relative text-sm">
                    <span aria-hidden className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface bg-line-strong" />
                    <p className="text-ink">{entry.text}</p>
                    <p className="text-xs text-muted">
                      {entry.by}, {fmt.dateTime(entry.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}
      </div>

      <Dialog
        open={pending != null}
        onClose={() => setPending(null)}
        title={pending === "rejected" ? "Từ chối hồ sơ ký gửi" : "Yêu cầu chủ nhà bổ sung"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Hủy
            </Button>
            <Button variant={pending === "rejected" ? "danger" : "primary"} className={pending === "rejected" ? dangerButton : undefined} disabled={!reason.trim()} onClick={() => pending && decide(pending)}>
              {pending === "rejected" ? "Từ chối hồ sơ" : "Gửi yêu cầu"}
            </Button>
          </>
        }
      >
        <TextAreaField
          label={pending === "rejected" ? "Lý do từ chối" : "Cần bổ sung gì"}
          hint="Nội dung này được gửi cho chủ nhà qua SMS và Zalo."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={pending === "rejected" ? "Ví dụ: Phòng không có cửa sổ và lối thoát hiểm" : "Ví dụ: Ảnh WC và giấy chứng nhận PCCC"}
        />
      </Dialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  );
}
