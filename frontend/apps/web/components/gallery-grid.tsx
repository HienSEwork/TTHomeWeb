"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Images, Play, X } from "lucide-react";
import { buttonStyles, cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";

/** Photo mosaic that opens a full-screen viewer. Arrow keys move between photos. */
export function GalleryGrid({ images, alt, hasVideo }: { images: string[]; alt: string; hasVideo?: boolean }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setIndex((i) => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [step]);

  const [first, ...rest] = images;
  return (
    <>
      <div className="relative grid h-[280px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[18px] sm:h-[420px]">
        <button type="button" onClick={() => open(0)} className="relative col-span-4 row-span-2 bg-line md:col-span-2" aria-label={t.gallery.open(1, images.length)}>
          {first ? <Image src={first} alt={alt} fill priority sizes="(min-width: 768px) 620px, 100vw" className="object-cover" /> : null}
        </button>
        {rest.slice(0, 4).map((src, i) => (
          <button key={src} type="button" onClick={() => open(i + 1)} className="relative hidden bg-line md:block" aria-label={t.gallery.open(i + 2, images.length)}>
            <Image src={src} alt="" fill sizes="310px" className="object-cover" />
          </button>
        ))}
        <div className="absolute right-3 bottom-3 flex gap-2">
          {hasVideo ? (
            <span className={buttonStyles({ variant: "secondary", size: "sm", className: "pointer-events-none" })}>
              <Play aria-hidden />
              {t.gallery.hasVideo}
            </span>
          ) : null}
          <button type="button" onClick={() => open(0)} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <Images aria-hidden />
            {t.gallery.viewAll(images.length)}
          </button>
        </div>
      </div>

      <dialog ref={dialog} aria-label={t.gallery.dialog} className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-white backdrop:bg-ink">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="tabular text-sm text-white/70">
              {index + 1} / {images.length}
            </p>
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-lg p-2 hover:bg-white/10" aria-label={t.gallery.close}>
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="relative flex-1">
            {images[index] ? <Image src={images[index]} alt={t.gallery.photo(alt, index + 1)} fill sizes="100vw" className="object-contain" /> : null}
            <button type="button" onClick={() => step(-1)} className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label={t.gallery.prev}>
              <ChevronLeft aria-hidden className="size-6" />
            </button>
            <button type="button" onClick={() => step(1)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/10 p-3 hover:bg-white/20" aria-label={t.gallery.next}>
              <ChevronRight aria-hidden className="size-6" />
            </button>
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 py-3">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t.gallery.thumb(i + 1)}
                aria-current={i === index}
                className={cn("relative h-14 w-20 shrink-0 overflow-hidden rounded-md opacity-60 hover:opacity-100", i === index && "opacity-100 ring-2 ring-wall")}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}
