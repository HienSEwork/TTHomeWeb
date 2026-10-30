"use client";

import { useCallback, useRef, useState } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { buttonStyles } from "@tthome/ui";
import { emitMapFocus, useMapFocus, type MapFocusEvent } from "@/lib/map-focus";
import type { MapLandmark, MapPin } from "./map-view";
import { SearchMapLazy } from "./search-map-lazy";

/** On small screens the map opens full screen from a floating button. The map renders only while open. */
export function MapSheet({ pins, landmarks }: { pins: MapPin[]; landmarks?: MapLandmark[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // "Xem vùng" on a card opens the sheet on small screens; the map inside then flies to the area.
  useMapFocus(
    useCallback((e: MapFocusEvent) => {
      if (e.kind !== "select" || !e.id || dialog.current?.open || window.matchMedia("(min-width: 1024px)").matches) return;
      setOpen(true);
      dialog.current?.showModal();
      // The map mounts with the sheet, so repeat the request once it has had time to load.
      setTimeout(() => emitMapFocus(e), 900);
    }, []),
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
        className={buttonStyles({ variant: "primary", size: "md", className: "fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-ink px-5 shadow-[var(--shadow-lift)] hover:bg-ink-soft lg:hidden" })}
      >
        <MapIcon aria-hidden />
        Xem bản đồ
      </button>
      <dialog ref={dialog} onClose={() => setOpen(false)} aria-label="Bản đồ" className="m-0 h-dvh max-h-none w-screen max-w-none bg-surface p-0 backdrop:bg-ink/40 open:flex open:flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-bold text-ink">{pins.length} tòa nhà trên bản đồ</p>
          <button type="button" onClick={() => dialog.current?.close()} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <X aria-hidden />
            Xem danh sách
          </button>
        </div>
        {open ? <SearchMapLazy pins={pins} landmarks={landmarks} className="min-h-0 flex-1" /> : null}
      </dialog>
    </>
  );
}
