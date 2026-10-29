"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonStyles } from "@tthome/ui";

/** A horizontal row of cards with "see all" and scroll buttons. */
export function Shelf({ title, description, href, children }: { title: string; description?: string; href: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section aria-label={title} className="py-8">
      <div className="mx-auto flex max-w-[1240px] items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link href={href} className={buttonStyles({ variant: "ghost", size: "sm", className: "text-shutter hover:text-shutter-dark" })}>
            Xem tất cả
          </Link>
          <button type="button" onClick={() => scroll(-1)} className={buttonStyles({ variant: "secondary", size: "sm", className: "w-8 px-0 max-md:hidden" })} aria-label={`Cuộn ${title} sang trái`}>
            <ChevronLeft aria-hidden />
          </button>
          <button type="button" onClick={() => scroll(1)} className={buttonStyles({ variant: "secondary", size: "sm", className: "w-8 px-0 max-md:hidden" })} aria-label={`Cuộn ${title} sang phải`}>
            <ChevronRight aria-hidden />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="scrollbar-none mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 xl:scroll-px-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))] xl:px-[max(1.5rem,calc((100vw-1240px)/2+1.5rem))]"
      >
        {children}
      </div>
    </section>
  );
}
