import Image from "next/image";
import { photo } from "@tthome/data";

/**
 * Decoration behind the centered hero: the logo's nested doorway drawn as faint lines in the middle,
 * and two softened interior photos at the far edges that frame the content without pulling it sideways.
 */
export function HeroBackdrop() {
  const arches = Array.from({ length: 9 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 600 520" className="absolute top-6 left-1/2 h-[118%] -translate-x-1/2 opacity-[0.55]" fill="none">
        {arches.map((i) => {
          const x = 180 + i * 14;
          const w = 240 - i * 28;
          const top = 60 + i * 10;
          return <path key={i} d={`M${x} 520 V${top + 70} L${x + w / 2} ${top} L${x + w} ${top + 70} V520`} stroke="#d99b4b" strokeOpacity={0.35 - i * 0.025} strokeWidth="1.2" />;
        })}
      </svg>

      <div className="absolute top-16 -left-24 hidden h-[340px] w-[300px] -rotate-6 overflow-hidden rounded-[28px] opacity-60 blur-[1.5px] xl:block 2xl:left-0">
        <Image src={photo(0, 700)} alt="" fill sizes="300px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-alabaster/70" />
      </div>
      <div className="absolute top-40 -right-24 hidden h-[360px] w-[300px] rotate-6 overflow-hidden rounded-[28px] opacity-60 blur-[1.5px] xl:block 2xl:right-0">
        <Image src={photo(3, 700)} alt="" fill sizes="300px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-alabaster/70" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-alabaster" />
    </div>
  );
}
