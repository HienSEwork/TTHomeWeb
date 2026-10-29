"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { APPOINTMENT_STATUS, APPOINTMENTS, STAFF, TODAY, VISIT_MODE, type Appointment, type AppointmentStatus } from "@tthome/data";
import { Badge, EmptyState, cn } from "@tthome/ui";
import { Tabs, Toast } from "@/components/interactive";
import { toolbarControl } from "@/components/page-parts";
import { groupByDay, matchesQuery } from "@/lib/filters";
import { fmt } from "@/lib/format";
import { APPOINTMENT_TRANSITIONS, canMove } from "@/lib/workflow";

type Range = "upcoming" | "past" | "all";

const MOVE_LABEL: Record<AppointmentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Xác nhận",
  rescheduled: "Đổi lịch",
  completed: "Đã xem xong",
  cancelled: "Hủy lịch",
  no_show: "Khách không đến",
};

const upcomingStart = `${TODAY}T00:00:00+07:00`;

export function AppointmentBoard() {
  const [items, setItems] = useState<Appointment[]>(APPOINTMENTS);
  const [range, setRange] = useState<Range>("upcoming");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [staff, setStaff] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const start = new Date(upcomingStart).getTime();
  const inRange = (a: Appointment) => {
    const t = new Date(a.scheduledAt).getTime();
    return range === "all" || (range === "upcoming" ? t >= start : t < start);
  };
  const visible = items
    .filter(inRange)
    .filter((a) => (!status || a.status === status) && (!staff || (staff === "none" ? !a.staffId : a.staffId === staff)) && matchesQuery(query, a.customer, a.phone, a.code, a.projectName, a.roomCode))
    .sort((a, b) => (range === "past" ? b.scheduledAt.localeCompare(a.scheduledAt) : a.scheduledAt.localeCompare(b.scheduledAt)));
  const groups = groupByDay(visible, (a) => a.scheduledAt);
  if (range === "past") groups.reverse();

  function update(code: string, patch: Partial<Appointment>, message: string) {
    setItems((list) => list.map((a) => (a.code === code ? { ...a, ...patch } : a)));
    setToast(message);
  }

  return (
    <div className="space-y-4">
      <Tabs
        label="Khoảng thời gian"
        value={range}
        onChange={setRange}
        tabs={[
          { value: "upcoming", label: "Sắp tới", count: items.filter((a) => new Date(a.scheduledAt).getTime() >= start).length },
          { value: "past", label: "Đã qua" },
          { value: "all", label: "Tất cả" },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="appt-q">
          Tìm lịch hẹn
        </label>
        <input id="appt-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên khách, số điện thoại, mã lịch" className={`${toolbarControl} w-full sm:w-72`} />
        <label className="sr-only" htmlFor="appt-status">
          Trạng thái
        </label>
        <select id="appt-status" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")} className={toolbarControl}>
          <option value="">Mọi trạng thái</option>
          {(Object.keys(APPOINTMENT_STATUS) as AppointmentStatus[]).map((s) => (
            <option key={s} value={s}>
              {APPOINTMENT_STATUS[s].label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="appt-staff">
          Nhân viên
        </label>
        <select id="appt-staff" value={staff} onChange={(e) => setStaff(e.target.value)} className={toolbarControl}>
          <option value="">Mọi nhân viên</option>
          <option value="none">Chưa phân công</option>
          {STAFF.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="Không có lịch hẹn khớp bộ lọc" description="Đổi khoảng thời gian hoặc bỏ bớt điều kiện lọc." />
      ) : (
        groups.map((g) => (
          <section key={g.day} aria-label={fmt.day(g.day)}>
            <h2 className="mb-2 text-sm font-bold text-ink">
              {g.day === TODAY ? "Hôm nay, " : ""}
              {fmt.day(g.day)}
              <span className="ml-2 font-normal text-muted">{g.items.length} lịch</span>
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {g.items.map((a) => {
                const meta = APPOINTMENT_STATUS[a.status];
                const moves = APPOINTMENT_TRANSITIONS[a.status];
                return (
                  <li key={a.code} className="grid gap-3 px-4 py-3.5 md:grid-cols-[4rem_minmax(0,1.3fr)_minmax(0,1fr)_11rem_auto] md:items-center md:gap-4">
                    <p className="text-lg font-bold text-ink tabular">{fmt.time(a.scheduledAt)}</p>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">
                        {a.customer} <span className="font-normal text-muted tabular">{a.phone}</span>
                      </p>
                      <p className="truncate text-sm text-ink-soft">
                        {a.roomName}, {a.projectName}
                      </p>
                      {a.note ? <p className="mt-0.5 truncate text-xs text-muted">{a.note}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className={cn("inline-flex items-center gap-1 text-muted", a.mode === "online" && "text-plate")}>
                        {a.mode === "online" ? <Video aria-hidden className="size-3.5" /> : null}
                        {VISIT_MODE[a.mode]}
                      </span>
                      <span className="text-xs text-muted tabular">{a.code}</span>
                    </div>
                    <div>
                      <label className="sr-only" htmlFor={`staff-${a.code}`}>
                        Nhân viên dẫn xem cho {a.code}
                      </label>
                      <select
                        id={`staff-${a.code}`}
                        value={a.staffId ?? ""}
                        onChange={(e) => update(a.code, { staffId: e.target.value || null }, `Đã phân công ${a.code}`)}
                        className={cn(toolbarControl, "w-full", !a.staffId && "border-warn text-warn")}
                      >
                        <option value="">Chưa phân công</option>
                        {STAFF.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {moves.length ? (
                        <>
                          <label className="sr-only" htmlFor={`move-${a.code}`}>
                            Đổi trạng thái {a.code}
                          </label>
                          <select
                            id={`move-${a.code}`}
                            value=""
                            onChange={(e) => {
                              const to = e.target.value as AppointmentStatus;
                              if (canMove(APPOINTMENT_TRANSITIONS, a.status, to)) update(a.code, { status: to }, `${a.code}: ${APPOINTMENT_STATUS[to].label.toLowerCase()}`);
                            }}
                            className={cn(toolbarControl, "w-full md:w-40")}
                          >
                            <option value="" disabled>
                              Đổi trạng thái
                            </option>
                            {moves.map((to) => (
                              <option key={to} value={to}>
                                {MOVE_LABEL[to]}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <span className="text-sm text-muted">Đã kết thúc</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
