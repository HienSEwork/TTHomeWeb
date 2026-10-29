"use client";

import Link from "next/link";
import { useState } from "react";
import { APPOINTMENT_STATUS, TODAY, VISIT_MODE, staffName, type Appointment } from "@tthome/data";
import { Badge, Button, EmptyState, SelectField, buttonStyles, formatDateTime } from "@tthome/ui";
import { bookingDays, TIME_SLOTS } from "@/lib/validation";

const OPEN = new Set(["pending", "confirmed", "rescheduled"]);
const dayFormat = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

function AppointmentRow({ item, onChange }: { item: Appointment; onChange: (next: Appointment) => void }) {
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(bookingDays(1)[0]!);
  const [slot, setSlot] = useState<string>(TIME_SLOTS[1]);
  const status = APPOINTMENT_STATUS[item.status];
  const staff = staffName(item.staffId);
  const open = OPEN.has(item.status);

  return (
    <li className="rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="tabular text-lg font-extrabold text-ink">{formatDateTime(item.scheduledAt)}</p>
          <p className="mt-1 font-semibold text-ink">
            {item.roomName}, {item.projectName}
          </p>
          <p className="text-sm text-muted">
            {VISIT_MODE[item.mode]}
            {staff ? `, nhân viên ${staff}` : ", đang chờ phân công nhân viên"}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {open && !editing ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Đổi lịch
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => onChange({ ...item, status: "cancelled" })}>
            Hủy lịch
          </Button>
        </div>
      ) : null}

      {editing ? (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <SelectField label="Ngày mới" value={day} onChange={(e) => setDay(e.target.value)}>
            {bookingDays(7).map((d) => (
              <option key={d} value={d}>
                {dayFormat.format(new Date(`${d}T00:00:00Z`))}
              </option>
            ))}
          </SelectField>
          <SelectField label="Giờ" value={slot} onChange={(e) => setSlot(e.target.value)}>
            {TIME_SLOTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
          <div className="flex gap-2">
            <Button
              size="md"
              onClick={() => {
                onChange({ ...item, status: "rescheduled", scheduledAt: `${day}T${slot}:00+07:00` });
                setEditing(false);
              }}
            >
              Lưu lịch mới
            </Button>
            <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
              Thôi
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function MyAppointments({ initial }: { initial: Appointment[] }) {
  const [items, setItems] = useState(initial);
  const today = `${TODAY}T00:00:00+07:00`;
  const upcoming = items.filter((a) => OPEN.has(a.status) && new Date(a.scheduledAt) >= new Date(today));
  const past = items.filter((a) => !upcoming.includes(a));
  const update = (next: Appointment) => setItems(items.map((a) => (a.code === next.code ? next : a)));

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="sap-toi">
        <h2 id="sap-toi" className="text-lg font-bold text-ink">
          Sắp tới
        </h2>
        {upcoming.length ? (
          <ul className="mt-4 flex flex-col gap-3">
            {upcoming.map((a) => (
              <AppointmentRow key={a.code} item={a} onChange={update} />
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-4"
            title="Không có lịch xem phòng sắp tới"
            action={
              <Link href="/dat-lich" className={buttonStyles({ variant: "primary" })}>
                Đặt lịch xem phòng
              </Link>
            }
          />
        )}
      </section>
      {past.length ? (
        <section aria-labelledby="da-qua">
          <h2 id="da-qua" className="text-lg font-bold text-ink">
            Đã qua hoặc đã hủy
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {past.map((a) => (
              <AppointmentRow key={a.code} item={a} onChange={update} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
