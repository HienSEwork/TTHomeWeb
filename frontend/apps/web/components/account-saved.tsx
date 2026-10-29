"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyState, buttonStyles, formatPriceShort } from "@tthome/ui";
import type { SavedRoom } from "@/lib/account";
import { RoomCard } from "./room-card";

function PriceChange({ saved, now }: { saved: number; now: number }) {
  if (saved === now) return <p className="text-sm text-muted">Giá chưa đổi từ khi bạn lưu</p>;
  const down = now < saved;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <p className={`flex items-center gap-1.5 text-sm font-semibold ${down ? "text-shutter" : "text-warn"}`}>
      <Icon aria-hidden className="size-4" />
      {down ? "Giảm" : "Tăng"} {formatPriceShort(Math.abs(now - saved))} so với lúc bạn lưu
    </p>
  );
}

export function SavedRooms({ initial }: { initial: SavedRoom[] }) {
  const [items, setItems] = useState(initial);
  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có phòng nào được lưu"
        description="Bấm biểu tượng trái tim trên trang phòng để lưu lại. TTHOME sẽ báo bạn khi giá thay đổi."
        action={
          <Link href="/tim-kiem" className={buttonStyles({ variant: "primary" })}>
            Tìm phòng
          </Link>
        }
      />
    );
  }
  return (
    <ul className="grid gap-4 xl:grid-cols-2">
      {items.map(({ room, project, savedPrice }) => (
        <li key={room.id} className="flex flex-col gap-2">
          <RoomCard room={room} project={project} showProject />
          <div className="flex items-center justify-between gap-3 px-1">
            <PriceChange saved={savedPrice} now={room.price} />
            <button
              type="button"
              onClick={() => setItems(items.filter((i) => i.room.id !== room.id))}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger"
            >
              <Heart aria-hidden className="size-4 fill-current" />
              Bỏ lưu
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
