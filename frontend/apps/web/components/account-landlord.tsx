"use client";

import Link from "next/link";
import { useState } from "react";
import { SUBMISSION_STATUS, type Submission } from "@tthome/data";
import { Badge, Button, Card, buttonStyles, cn, formatDate, formatPriceShort } from "@tthome/ui";
import type { LandlordRoom } from "@/lib/account";

export function LandlordSubmissions({ items }: { items: Submission[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((s) => {
        const status = SUBMISSION_STATUS[s.status];
        const lastNote = s.log.at(-1);
        return (
          <li key={s.code}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{s.address}</p>
                  <p className="text-sm text-muted">
                    {s.district}, {s.roomCount} phòng, từ {formatPriceShort(s.priceFrom)}. Gửi ngày {formatDate(s.submittedAt)}, mã {s.code}.
                  </p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              {s.status === "need_info" && lastNote ? (
                <div className="mt-4 flex flex-col gap-3 rounded-lg bg-warn-tint p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-warn">
                    <strong>{lastNote.by}:</strong> {lastNote.text}
                  </p>
                  <Link href="/ky-gui" className={buttonStyles({ variant: "secondary", size: "sm", className: "shrink-0" })}>
                    Bổ sung thông tin
                  </Link>
                </div>
              ) : null}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function RoomRow({ room, onChange }: { room: LandlordRoom; onChange: (r: LandlordRoom) => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(room.price));
  const parsed = Number(price.replace(/\D/g, ""));
  const valid = parsed >= 500_000;

  return (
    <tr className="align-middle">
      <th scope="row" className="px-4 py-3 text-left">
        <span className="block font-semibold text-ink">{room.name}</span>
        <span className="block text-xs font-normal text-muted">{room.building}</span>
      </th>
      <td className="px-4 py-3">
        {editing ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valid) return;
              onChange({ ...room, price: parsed });
              setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`gia-${room.code}`}>
              Giá mới của {room.name}
            </label>
            <input
              id={`gia-${room.code}`}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={!valid}
              className="tabular h-9 w-32 rounded-lg border border-line-strong px-2 text-sm focus:border-plate focus:outline-none aria-[invalid=true]:border-danger"
            />
            <Button type="submit" size="sm" disabled={!valid}>
              Lưu
            </Button>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="tabular font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            {formatPriceShort(room.price)}
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" role="switch" checked={room.vacant} onChange={(e) => onChange({ ...room, vacant: e.target.checked })} className="peer sr-only" />
          <span
            aria-hidden
            className={cn(
              "relative h-6 w-10 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-plate",
              room.vacant ? "bg-shutter" : "bg-line-strong",
            )}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", room.vacant ? "left-[18px]" : "left-0.5")} />
          </span>
          <span className={room.vacant ? "font-semibold text-shutter" : "text-muted"}>{room.vacant ? "Còn trống" : "Đã thuê"}</span>
        </label>
      </td>
      <td className="tabular px-4 py-3 text-right text-sm text-muted">{room.views}</td>
    </tr>
  );
}

export function LandlordRooms({ initial }: { initial: LandlordRoom[] }) {
  const [rooms, setRooms] = useState(initial);
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-line bg-wash text-left text-ink-soft">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Phòng</th>
            <th scope="col" className="px-4 py-3 font-semibold">Giá mỗi tháng</th>
            <th scope="col" className="px-4 py-3 font-semibold">Tình trạng</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Lượt xem 30 ngày</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rooms.map((r) => (
            <RoomRow key={r.code} room={r} onChange={(next) => setRooms(rooms.map((x) => (x.code === next.code ? next : x)))} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
