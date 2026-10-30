"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@tthome/ui";
import { zoneIndex } from "@/lib/motion";

/**
 * A card photo that previews the room's other photos as the mouse moves across it, with dots showing
 * which one is in view. The extra photos load only on the first hover; touch screens keep the first photo.
 */
export function CardGallery({ images, alt, sizes, priority }: { images: string[]; alt: string; sizes: string; priority?: boolean }) {
  const shown = images.slice(0, 4);
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && shown.length > 1 && setArmed(true)}
      onPointerMove={(e) => {
        if (!armed) return;
        const r = e.currentTarget.getBoundingClientRect();
        setIndex(zoneIndex(e.clientX - r.left, r.width, shown.length));
      }}
      onPointerLeave={() => setIndex(0)}
    >
      {shown.map((src, i) =>
        i === 0 || armed ? (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? alt : ""}
            fill
            priority={i === 0 && priority}
            sizes={sizes}
            className={cn(
              "object-cover transition-[opacity,scale] duration-600 ease-glide group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null,
      )}
      {armed ? (
        <span aria-hidden className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {shown.map((src, i) => (
            <span key={src} className={cn("h-1.5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.3)] transition-all duration-300", i === index ? "w-4" : "w-1.5 opacity-60")} />
          ))}
        </span>
      ) : null}
    </div>
  );
}
