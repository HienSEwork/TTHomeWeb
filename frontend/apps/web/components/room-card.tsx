import Image from "next/image";
import Link from "next/link";
import { FURNITURE_LABEL, ROOM_STATUS, ROOM_TYPE_LABEL, roomSlug, TODAY, type Project, type Room } from "@tthome/data";
import { Badge, formatDate, formatPriceShort } from "@tthome/ui";

/** A room inside a project or among similar rooms. */
export function RoomCard({ room, project, showProject }: { room: Room; project: Project; showProject?: boolean }) {
  const status = ROOM_STATUS[room.status];
  const href = `/phong/${roomSlug(room, project)}`;
  return (
    <article className="group relative flex gap-4 rounded-card border border-line bg-surface p-3">
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[10px] bg-line sm:w-32">
        <Image src={room.images[0]!} alt={`${room.name}, ${project.name}`} fill sizes="128px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-ink">
            <Link href={href} className="after:absolute after:inset-0">
              {room.name}
            </Link>
          </h3>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        {showProject ? <p className="truncate text-sm text-muted">{project.name}</p> : null}
        <p className="mt-1 text-sm text-ink-soft">
          {ROOM_TYPE_LABEL[room.type]}, {room.area} m², tầng {room.floor}
        </p>
        <p className="text-sm text-muted">{FURNITURE_LABEL[room.furniture]}</p>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 pt-2">
          <p className="text-lg font-extrabold text-ink">
            {formatPriceShort(room.price)}
            <span className="text-sm font-normal text-muted">/tháng</span>
          </p>
          <p className="text-[0.8125rem] text-muted">
            {room.status === "available" && room.availableFrom <= TODAY ? "Vào ở ngay" : `Trống từ ${formatDate(room.availableFrom)}`}
          </p>
        </div>
      </div>
    </article>
  );
}
