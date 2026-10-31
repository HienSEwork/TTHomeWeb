import Image from "next/image";
import { cn } from "@tthome/ui";

const VARIANTS = {
  /** Tower mark and TT HOME wordmark. */
  wordmark: { src: "/brand/tthome-logo-wordmark.png", width: 380, height: 320 },
  /** Tower mark, base line and TT HOME wordmark, for the footer. */
  full: { src: "/brand/tthome-logo.png", width: 475, height: 400 },
  /** Tower mark on its base line, without the wordmark. */
  mark: { src: "/brand/tthome-mark.png", width: 296, height: 304 },
} as const;

/**
 * Header lockup: the tower mark beside the name set in type, so the name stays legible at header size
 * where the stacked artwork would shrink it to a few pixels. The text block sits on the mark's bottom edge.
 */
export function BrandLockup({ className, tagline = "phong tro gen Z.com" }: { className?: string; tagline?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-2.5", className)}>
      <BrandLogo variant="mark" height={50} priority className="shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-gold-gradient text-[1.5rem] font-extrabold tracking-[0.06em] whitespace-nowrap">TT HOME</span>
        <span className="mt-1.5 text-[0.875rem] font-bold whitespace-nowrap text-ink">{tagline}</span>
      </span>
    </span>
  );
}

/** The supplied TT HOME logo, gold on transparent. Height sets the size; width follows the artwork. */
export function BrandLogo({ variant = "wordmark", height, className, priority, alt = "TT HOME, phòng trọ Gen Z" }: { variant?: keyof typeof VARIANTS; height: number; className?: string; priority?: boolean; alt?: string }) {
  const v = VARIANTS[variant];
  return (
    <Image
      src={v.src}
      alt={variant === "mark" ? "" : alt}
      width={Math.round((v.width * height) / v.height)}
      height={height}
      priority={priority}
      className={cn("h-auto select-none", className)}
    />
  );
}
