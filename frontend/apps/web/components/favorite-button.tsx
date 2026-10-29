"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@tthome/ui";

/** Heart toggle on a card. Kept on this device until saved rooms are tied to the account. */
export function FavoriteButton({ label, className }: { label: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Bỏ lưu ${label}` : `Lưu ${label}`}
      onClick={() => setSaved((v) => !v)}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-soft)] backdrop-blur transition-[transform,color] active:scale-90",
        saved ? "text-[#c2543f]" : "text-ink-soft hover:text-ink",
        className,
      )}
    >
      <Heart aria-hidden className={cn("size-[18px] transition-transform", saved && "scale-110 fill-current")} />
    </button>
  );
}
