"use client";

import Link from "next/link";
import { useState } from "react";
import { APPOINTMENT_STATUS, TODAY, staffName, type Appointment } from "@tthome/data";
import { Badge, Button, EmptyState, SelectField, buttonStyles } from "@tthome/ui";
import { localRoomName } from "@/lib/i18n/content";
import { useI18n } from "@/lib/i18n/client";
import { bookingDays, TIME_SLOTS } from "@/lib/validation";

const OPEN = new Set(["pending", "confirmed", "rescheduled"]);

function AppointmentRow({ item, onChange }: { item: Appointment; onChange: (next: Appointment) => void }) {
  const { lang, t, fmt } = useI18n();
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
          <p className="tabular text-lg font-extrabold text-ink">{fmt.dateTime(item.scheduledAt)}</p>
          <p className="mt-1 font-semibold text-ink">
            {localRoomName(item.roomName, lang)}, {item.projectName}
          </p>
          <p className="text-sm text-muted">
            {t.labels.visitMode[item.mode]}
            {staff ? t.account.withStaff(staff) : t.account.noStaff}
          </p>
        </div>
        <Badge tone={status.tone}>{t.labels.appointmentStatus[item.status]}</Badge>
      </div>

      {open && !editing ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            {t.account.reschedule}
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => onChange({ ...item, status: "cancelled" })}>
            {t.account.cancel}
          </Button>
        </div>
      ) : null}

      {editing ? (
        <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <SelectField label={t.account.newDay} value={day} onChange={(e) => setDay(e.target.value)}>
            {bookingDays(7).map((d) => (
              <option key={d} value={d}>
                {fmt.longDay(d)}
              </option>
            ))}
          </SelectField>
          <SelectField label={t.account.time} value={slot} onChange={(e) => setSlot(e.target.value)}>
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
              {t.account.saveNewTime}
            </Button>
            <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
              {t.account.never}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function MyAppointments({ initial }: { initial: Appointment[] }) {
  const { t } = useI18n();
  const [items, setItems] = useState(initial);
  const today = `${TODAY}T00:00:00+07:00`;
  const upcoming = items.filter((a) => OPEN.has(a.status) && new Date(a.scheduledAt) >= new Date(today));
  const past = items.filter((a) => !upcoming.includes(a));
  const update = (next: Appointment) => setItems(items.map((a) => (a.code === next.code ? next : a)));

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="sap-toi">
        <h2 id="sap-toi" className="text-lg font-bold text-ink">
          {t.account.upcoming}
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
            title={t.account.noUpcoming}
            action={
              <Link href="/dat-lich" className={buttonStyles({ variant: "primary" })}>
                {t.common.bookViewing}
              </Link>
            }
          />
        )}
      </section>
      {past.length ? (
        <section aria-labelledby="da-qua">
          <h2 id="da-qua" className="text-lg font-bold text-ink">
            {t.account.past}
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
