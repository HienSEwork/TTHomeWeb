import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AirVent, AppWindow, ArrowUpDown, Bath, CircleParking, KeyRound, MapPin, PawPrint, Ruler, Sofa } from "lucide-react";
import { findDistrict, ROOM_TYPE_LABEL, roomSlug, TODAY } from "@tthome/data";
import { cn, formatDate } from "@tthome/ui";
import { cardBadge, HIGHLIGHT_LABEL, roomHighlights, type Highlight, type RoomRef } from "@/lib/listing";
import { FavoriteButton } from "./favorite-button";

export const HIGHLIGHT_ICON: Record<Highlight, LucideIcon> = {
  aircon: AirVent,
  private_wc: Bath,
  balcony: AppWindow,
  window: AppWindow,
  furnished: Sofa,
  elevator: ArrowUpDown,
  parking: CircleParking,
  fingerprint: KeyRound,
  pet: PawPrint,
};

const BADGE_STYLE = {
  offer: "bg-gold text-on-primary",
  new: "bg-white text-gold-ink",
  featured: "bg-ink text-white",
} as const;

function priceParts(vnd: number): { value: string; unit: string } {
  const millions = Math.round((vnd / 1_000_000) * 10) / 10;
  return { value: millions.toLocaleString("vi-VN"), unit: "triệu/tháng" };
}

/** A vacant room: photo, where it is, monthly price, size and the few amenities that matter. */
export function RoomListingCard({ listing, priority, className }: { listing: RoomRef; priority?: boolean; className?: string }) {
  const { room, project } = listing;
  const href = `/phong/${roomSlug(room, project)}`;
  const district = findDistrict(project.districtSlug);
  const badge = cardBadge(project);
  const price = priceParts(room.price);
  const title = project.name;
  const moveIn = room.availableFrom <= TODAY ? "Vào ở ngay" : `Trống từ ${formatDate(room.availableFrom).slice(0, 5)}`;

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-card border border-line bg-white transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-ivory">
        <Image
          src={room.images[0]!}
          alt={`${ROOM_TYPE_LABEL[room.type]} ${room.area} m² tại ${title}`}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 240px, (min-width: 640px) 300px, 78vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
        />
        {badge ? <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[var(--shadow-soft)]", BADGE_STYLE[badge.tone])}>{badge.label}</span> : null}
        <FavoriteButton label={title} className="absolute top-2.5 right-2.5 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPin aria-hidden className="size-3.5 shrink-0 text-gold-deep" />
          <span className="truncate">{district?.name}, TP.HCM</span>
        </p>
        <h3 className="mt-1.5 truncate text-[0.9375rem] leading-[1.3] font-semibold text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:z-0 focus-visible:outline-none after:focus-visible:rounded-card after:focus-visible:outline-2 after:focus-visible:outline-focus">
            {title}
          </Link>
        </h3>

        <p className="mt-2 flex items-baseline gap-1">
          <span className="tabular text-xl font-extrabold tracking-tight text-gold-ink">{price.value}</span>
          <span className="text-xs text-muted">{price.unit}</span>
        </p>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <Ruler aria-hidden className="size-3.5 text-muted" />
            {room.area} m²
          </span>
          <span aria-hidden className="text-line-strong">
            /
          </span>
          <span>{ROOM_TYPE_LABEL[room.type]}</span>
        </p>

        <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3" aria-label="Tiện nghi">
          {roomHighlights(listing).map((h) => {
            const Icon = HIGHLIGHT_ICON[h];
            return (
              <li key={h} className="inline-flex items-center gap-1 rounded-md bg-ivory px-1.5 py-1 text-[0.6875rem] font-medium text-ink-soft">
                <Icon aria-hidden className="size-3.5 text-gold-deep" />
                {HIGHLIGHT_LABEL[h]}
              </li>
            );
          })}
        </ul>

        <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium text-success">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          {moveIn}
        </p>
      </div>
    </article>
  );
}
