import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AirVent, ArrowUpDown, CircleParking, Fingerprint, MapPin, PawPrint, Refrigerator, Ruler, Sofa, SunMedium, WashingMachine } from "lucide-react";
import { findDistrict, roomSlug, TODAY } from "@tthome/data";
import { cn } from "@tthome/ui";
import { getI18n, type Lang } from "@/lib/i18n";
import { cardBadge, roomHighlights, type Highlight, type RoomRef } from "@/lib/listing";
import { CardGallery } from "./card-gallery";
import { FavoriteButton } from "./favorite-button";

export const HIGHLIGHT_ICON: Record<Highlight, LucideIcon> = {
  fingerprint: Fingerprint,
  elevator: ArrowUpDown,
  aircon: AirVent,
  fridge: Refrigerator,
  washer: WashingMachine,
  furnished: Sofa,
  balcony: SunMedium,
  pet: PawPrint,
  parking: CircleParking,
};

const BADGE_STYLE = {
  offer: "border-white/30 bg-gold/90 text-on-primary",
  new: "border-white/60 bg-white/75 text-gold-ink",
  featured: "border-white/15 bg-ink/70 text-white",
} as const;

/** A vacant room: photo, where it is, monthly price, size and the few amenities that matter. */
export function RoomListingCard({ listing, priority, className, lang }: { listing: RoomRef; priority?: boolean; className?: string; lang?: Lang }) {
  const { t, fmt } = getI18n(lang);
  const highlights = roomHighlights(listing);
  const { room, project } = listing;
  const href = `/phong/${roomSlug(room, project)}`;
  const district = findDistrict(project.districtSlug);
  const badge = cardBadge(project, t.card.badge);
  const price = fmt.priceParts(room.price);
  const title = project.name;
  const moveIn = room.availableFrom <= TODAY ? t.common.moveInNow : t.common.vacantFrom(fmt.dayMonth(room.availableFrom));

  return (
    <article
      className={cn(
        "group glass-line relative flex flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-soft)] transition-[box-shadow,translate] duration-500 ease-glide hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory">
        <CardGallery
          images={room.images}
          alt={t.card.roomPhoto(t.labels.roomType[room.type], room.area, title)}
          priority={priority}
          sizes="(min-width: 1280px) 240px, (min-width: 640px) 300px, 78vw"
        />
        {badge ? (
          <span className={cn("absolute top-3 left-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-md", BADGE_STYLE[badge.tone])}>{badge.label}</span>
        ) : null}
        <FavoriteButton label={title} className="absolute top-2.5 right-2.5 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPin aria-hidden className="size-3.5 shrink-0 text-gold-deep" />
          <span className="truncate">
            {district?.name}, {t.common.city}
          </span>
        </p>
        <h3 className="mt-1.5 truncate text-[0.9375rem] leading-[1.3] font-semibold text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none after:focus-visible:rounded-card after:focus-visible:outline-2 after:focus-visible:outline-focus">
            {title}
          </Link>
        </h3>

        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="tabular font-display text-2xl leading-none font-extrabold tracking-[-0.03em] text-ink">{price.value}</span>
          <span className="text-xs font-medium text-muted">{price.unit}</span>
        </p>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Ruler aria-hidden className="size-3.5 text-muted" />
            {room.area} m²
          </span>
          <span aria-hidden className="text-line-strong">
            /
          </span>
          <span>{t.labels.roomType[room.type]}</span>
        </p>

        {highlights.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3" aria-label={t.card.amenities}>
            {highlights.map((h) => {
              const Icon = HIGHLIGHT_ICON[h];
              return (
                <li key={h} className="inline-flex items-center gap-1 rounded-full bg-ivory px-2 py-1 text-xs font-medium text-ink-soft">
                  <Icon aria-hidden className="size-3.5 text-gold-deep" />
                  {t.labels.highlight[h]}
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium text-success">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          {moveIn}
        </p>
      </div>
    </article>
  );
}
