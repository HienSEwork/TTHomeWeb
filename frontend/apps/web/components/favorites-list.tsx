"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { minPrice, PROJECTS, vacantRooms, type ProjectMatch } from "@tthome/data";
import { EmptyState, buttonStyles, cn } from "@tthome/ui";
import { removeFavorite, useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/client";
import type { RoomRef } from "@/lib/listing";
import { ProjectCard } from "./project-card";
import { RoomListingCard } from "./room-listing-card";

const noSubscription = () => () => {};

/** Turns the saved keys back into rooms and buildings, dropping any that are no longer listed. */
function resolve(keys: string[]) {
  const rooms: RoomRef[] = [];
  const projects: ProjectMatch[] = [];
  for (const key of keys) {
    const [kind, id] = key.split(":");
    if (kind === "room") {
      for (const project of PROJECTS) {
        const room = project.rooms.find((r) => r.id === id && r.status !== "hidden");
        if (room) rooms.push({ room, project });
      }
    } else if (kind === "project") {
      const project = PROJECTS.find((p) => p.id === id);
      if (project) {
        const vacant = vacantRooms(project);
        projects.push({ project, rooms: vacant, minPrice: minPrice(vacant), distanceKm: null });
      }
    }
  }
  return { rooms, projects };
}

/** The visitor's hearted rooms and buildings, read from this browser. */
export function FavoritesList({ className }: { className?: string }) {
  const { lang, t } = useI18n();
  const keys = useFavorites();
  // The list lives in the browser; render nothing on the server rather than flash the empty state.
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  if (!ready) return <div className={cn("min-h-60", className)} />;

  const { rooms, projects } = resolve(keys);
  if (rooms.length + projects.length === 0) {
    return (
      <EmptyState
        className={className}
        title={t.favorites.emptyTitle}
        description={t.favorites.emptyText}
        action={
          <Link href="/tim-kiem" className={buttonStyles({ variant: "primary" })}>
            {t.common.findRoom}
          </Link>
        }
      />
    );
  }

  return (
    <div className={cn("space-y-10", className)}>
      {rooms.length ? (
        <section aria-labelledby="yt-phong">
          <h2 id="yt-phong" className="text-lg font-extrabold text-ink">
            {t.favorites.rooms} <span className="text-muted">({rooms.length})</span>
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((r) => (
              <li key={r.room.id} className="flex">
                <RoomListingCard listing={r} className="w-full" lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {projects.length ? (
        <section aria-labelledby="yt-toa-nha">
          <h2 id="yt-toa-nha" className="text-lg font-extrabold text-ink">
            {t.favorites.projects} <span className="text-muted">({projects.length})</span>
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((m) => (
              <li key={m.project.id} className="flex">
                <ProjectCard match={m} className="w-full" lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <button type="button" onClick={() => keys.forEach(removeFavorite)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-danger">
        <Heart aria-hidden className="size-4" />
        {t.favorites.clear}
      </button>
    </div>
  );
}
