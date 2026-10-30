"use client";

import { useState, type CSSProperties } from "react";
import { Heart } from "lucide-react";
import { cn } from "@tthome/ui";
import { toggleFavorite, useIsFavorite } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/client";

const PARTICLES = [0, 60, 120, 180, 240, 300];

/** Heart toggle on a card. Saved in this browser, so it works without signing in; the header heart lists them. */
export function FavoriteButton({ favKey, label, className }: { favKey: string; label: string; className?: string }) {
  const { t } = useI18n();
  const saved = useIsFavorite(favKey);
  // Bumped on every save so the pop and the burst replay.
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t.card.unsave(label) : t.card.save(label)}
      onClick={() => {
        if (!saved) setBurst((n) => n + 1);
        toggleFavorite(favKey);
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-white/60 bg-white/80 shadow-[var(--shadow-soft)] backdrop-blur-md transition-[scale,color] active:scale-90",
        saved ? "text-[#c2543f]" : "text-ink-soft hover:text-ink",
        className,
      )}
    >
      <span className="relative grid place-items-center">
        <Heart key={burst} aria-hidden className={cn("size-[18px]", saved && "animate-pop fill-current")} />
        {burst > 0 && saved ? (
          <span key={`b${burst}`} aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
            {PARTICLES.map((a) => (
              <span
                key={a}
                style={{ "--a": `${a}deg` } as CSSProperties}
                className="absolute top-1/2 left-1/2 -mt-[3px] -ml-[3px] size-1.5 animate-[burst_0.6s_var(--ease-out-expo)_forwards] rounded-full bg-gold odd:bg-[#c2543f]"
              />
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}
