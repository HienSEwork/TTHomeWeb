"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyState, buttonStyles } from "@tthome/ui";
import type { SavedRoom } from "@/lib/account";
import { useI18n } from "@/lib/i18n/client";
import { RoomCard } from "./room-card";

function PriceChange({ saved, now }: { saved: number; now: number }) {
  const { t, fmt } = useI18n();
  if (saved === now) return <p className="text-sm text-muted">{t.account.priceSame}</p>;
  const down = now < saved;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <p className={`flex items-center gap-1.5 text-sm font-semibold ${down ? "text-shutter" : "text-warn"}`}>
      <Icon aria-hidden className="size-4" />
      {(down ? t.account.priceDown : t.account.priceUp)(fmt.priceShort(Math.abs(now - saved)))}
    </p>
  );
}

export function SavedRooms({ initial }: { initial: SavedRoom[] }) {
  const { lang, t } = useI18n();
  const [items, setItems] = useState(initial);
  if (items.length === 0) {
    return (
      <EmptyState
        title={t.account.savedEmpty}
        description={t.account.savedEmptyText}
        action={
          <Link href="/tim-kiem" className={buttonStyles({ variant: "primary" })}>
            {t.common.findRoom}
          </Link>
        }
      />
    );
  }
  return (
    <ul className="grid gap-4 xl:grid-cols-2">
      {items.map(({ room, project, savedPrice }) => (
        <li key={room.id} className="flex flex-col gap-2">
          <RoomCard room={room} project={project} showProject lang={lang} />
          <div className="flex items-center justify-between gap-3 px-1">
            <PriceChange saved={savedPrice} now={room.price} />
            <button
              type="button"
              onClick={() => setItems(items.filter((i) => i.room.id !== room.id))}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger"
            >
              <Heart aria-hidden className="size-4 fill-current" />
              {t.account.unsave}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
