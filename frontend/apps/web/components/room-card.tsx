import Image from "next/image";
import Link from "next/link";
import { ROOM_STATUS, roomSlug, TODAY, type Project, type Room } from "@tthome/data";
import { Badge } from "@tthome/ui";
import { getI18n, type Lang } from "@/lib/i18n";
import { localRoomName } from "@/lib/i18n/content";

/** A room inside a project or among similar rooms. */
export function RoomCard({ room, project, showProject, lang }: { room: Room; project: Project; showProject?: boolean; lang?: Lang }) {
  const { lang: l, t, fmt } = getI18n(lang);
  const status = ROOM_STATUS[room.status];
  const name = localRoomName(room.name, l);
  const href = `/phong/${roomSlug(room, project)}`;
  return (
    <article className="group relative flex gap-4 rounded-card border border-line bg-surface p-3">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[10px] bg-line sm:w-32">
        <Image src={room.images[0]!} alt={`${name}, ${project.name}`} fill sizes="128px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-bold text-ink">
            <Link href={href} className="after:absolute after:inset-0">
              {name}
            </Link>
          </h3>
          <Badge tone={status.tone}>{t.labels.roomStatus[room.status]}</Badge>
        </div>
        {showProject ? <p className="truncate text-sm text-muted">{project.name}</p> : null}
        <p className="mt-1 text-sm text-ink-soft">
          {t.labels.roomType[room.type]}, {room.area} m², {t.card.floor(room.floor)}
        </p>
        <p className="text-sm text-muted">{t.labels.furniture[room.furniture]}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 pt-2">
          <p className="text-lg font-extrabold text-ink">
            {fmt.priceShort(room.price)}
            <span className="text-sm font-normal text-muted">{t.common.perMonth}</span>
          </p>
          <p className="text-[0.8125rem] text-muted">
            {room.status === "available" && room.availableFrom <= TODAY ? t.common.moveInNow : t.common.vacantFrom(fmt.date(room.availableFrom))}
          </p>
        </div>
      </div>
    </article>
  );
}
