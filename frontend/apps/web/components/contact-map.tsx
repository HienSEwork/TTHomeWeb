"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SITE } from "@tthome/data";
import { buttonStyles } from "@tthome/ui";

/** Google Maps loads only after the visitor asks for it, to keep the page fast. */
export function ContactMap() {
  const [show, setShow] = useState(false);
  const query = encodeURIComponent(SITE.address);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-line bg-plate-tint sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-80">
      {show ? (
        <iframe title="Bản đồ văn phòng TTHOME" src={`https://www.google.com/maps?q=${query}&output=embed`} className="absolute inset-0 size-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <MapPin aria-hidden className="size-9 text-plate" />
          <p className="max-w-xs text-sm text-plate-dark">{SITE.address}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setShow(true)} className={buttonStyles({ variant: "plate" })}>
              Hiện bản đồ
            </button>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${query}`} target="_blank" rel="noopener" className={buttonStyles({ variant: "secondary" })}>
              Chỉ đường
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
