import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type Tone = "neutral" | "shutter" | "plate" | "wall" | "danger" | "warn" | "ink" | "success";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink-soft",
  shutter: "bg-shutter-tint text-shutter-dark",
  plate: "bg-plate-tint text-plate-dark",
  wall: "bg-wall-tint text-wall-dark",
  danger: "bg-danger-tint text-danger",
  warn: "bg-warn-tint text-warn",
  ink: "bg-ink text-white",
  success: "bg-success-tint text-success",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A status with a coloured dot, used in admin tables. */
export function StatusDot({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const dot: Record<Tone, string> = {
    neutral: "bg-muted",
    shutter: "bg-shutter",
    plate: "bg-plate",
    wall: "bg-wall",
    danger: "bg-danger",
    warn: "bg-warn",
    ink: "bg-ink",
    success: "bg-success",
  };
  return (
    <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap text-ink">
      <span aria-hidden className={cn("size-2 rounded-full", dot[tone])} />
      {children}
    </span>
  );
}
