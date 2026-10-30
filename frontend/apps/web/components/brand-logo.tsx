import Image from "next/image";
import { cn } from "@tthome/ui";

const VARIANTS = {
  /** Doorway mark and TT HOME wordmark, for the header. */
  wordmark: { src: "/brand/tthome-logo-wordmark.png", width: 380, height: 320 },
  /** Mark, wordmark and the "phong tro gen Z" line, for the footer. */
  full: { src: "/brand/tthome-logo.png", width: 385, height: 360 },
  /** Doorway mark alone, for decoration. */
  mark: { src: "/brand/tthome-mark.png", width: 247, height: 256 },
} as const;

/**
 * Header lockup: the logo's doorway mark beside the wordmark set in type, so the name stays legible
 * at header size where the stacked artwork would shrink it to a few pixels.
 */
export function BrandLockup({ className, tagline = "Phòng trọ Gen Z" }: { className?: string; tagline?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandLogo variant="mark" height={42} priority />
      <span className="flex flex-col leading-none">
        <span className="text-gold-gradient text-[1.375rem] font-extrabold tracking-[0.04em]">TTHOME</span>
        <span className="mt-1 text-[0.6875rem] font-medium tracking-[0.02em] text-muted">{tagline}</span>
      </span>
    </span>
  );
}

/** The supplied TTHOME logo, gold on transparent. Height sets the size; width follows the artwork. */
export function BrandLogo({ variant = "wordmark", height, className, priority, alt = "TTHOME, phòng trọ Gen Z" }: { variant?: keyof typeof VARIANTS; height: number; className?: string; priority?: boolean; alt?: string }) {
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
