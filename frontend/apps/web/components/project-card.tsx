import Image from "next/image";
import Link from "next/link";
import { BadgePercent, PawPrint, Play, PlugZap } from "lucide-react";
import { projectAddress, projectRoomTypes, type ProjectMatch } from "@tthome/data";
import { Badge, Plate, cn } from "@tthome/ui";
import { getI18n, labelOf, type Lang } from "@/lib/i18n";
import { projectCopy } from "@/lib/i18n/content";
import { FavoriteButton } from "./favorite-button";

type Props = {
  match: ProjectMatch;
  /** Make the card narrower for horizontal shelves. */
  compact?: boolean;
  priority?: boolean;
  className?: string;
  lang?: Lang;
};

export function ProjectCard({ match, compact, priority, className, lang }: Props) {
  const { lang: l, t, fmt } = getI18n(lang);
  const { project, rooms, minPrice, distanceKm } = match;
  const types = projectRoomTypes(project);
  const { promo } = projectCopy(project, l);
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-line">
        <Image
          src={project.images[0]!}
          alt={t.card.projectPhoto(project.name)}
          fill
          priority={priority}
          sizes={compact ? "(min-width: 1024px) 300px, 80vw" : "(min-width: 1280px) 380px, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {project.exclusive ? <Badge tone="ink">{t.card.exclusive}</Badge> : <Badge tone="neutral" className="bg-white/90 text-ink">{t.card.project}</Badge>}
          {project.hasVideo ? (
            <Badge tone="neutral" className="bg-white/90 text-ink">
              <Play aria-hidden />
              {t.card.video}
            </Badge>
          ) : null}
        </div>
        <Plate value={rooms.length} unit={t.card.vacantUnit} size="sm" className="absolute bottom-3 left-3" />
        <FavoriteButton label={project.name} className="absolute top-2.5 right-2.5 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[1.0625rem] leading-snug font-bold text-ink">
          <Link href={`/du-an/${project.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-card after:focus-visible:outline-2 after:focus-visible:outline-plate">
            {project.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{projectAddress(project)}</p>
        {distanceKm != null ? <p className="mt-1 text-sm font-medium text-plate">{t.card.distance(fmt.number(distanceKm, 1))}</p> : null}

        <p className="mt-3 text-sm text-ink-soft">{types.map((type) => t.labels.roomType[type]).join(", ")}</p>

        {!compact ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t.card.highlights}>
            {project.amenities.slice(0, 4).map((code) => labelOf(t.labels.amenity, code)).map((name) => (
              <li key={name} className="rounded-md bg-wash px-2 py-0.5 text-xs text-ink-soft">
                {name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p>
            <span className="text-lg font-extrabold text-ink">{fmt.fromPrice(minPrice)}</span>
            {minPrice ? <span className="text-sm text-muted">{t.common.perMonth}</span> : null}
          </p>
          <div className="flex gap-1">
            {project.petPolicy !== "none" ? (
              <span title={t.card.pets} className="grid size-7 place-items-center rounded-full bg-wall-tint text-wall-dark">
                <PawPrint aria-hidden className="size-4" />
                <span className="sr-only">{t.card.pets}</span>
              </span>
            ) : null}
            {project.evParking ? (
              <span title={t.card.ev} className="grid size-7 place-items-center rounded-full bg-shutter-tint text-shutter">
                <PlugZap aria-hidden className="size-4" />
                <span className="sr-only">{t.card.ev}</span>
              </span>
            ) : null}
          </div>
        </div>
        {promo ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-wall-tint px-2.5 py-1.5 text-[0.8125rem] font-semibold text-wall-dark">
            <BadgePercent aria-hidden className="size-4 shrink-0" />
            {promo}
          </p>
        ) : null}
      </div>
    </article>
  );
}
