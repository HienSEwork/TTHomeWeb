"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@tthome/ui";
import { canDoPointerMotion, magneticOffset } from "@/lib/motion";

/**
 * Pulls its child a little toward a nearby mouse pointer and lights a soft glow while it is close.
 * Touch screens and reduced-motion visitors get the child as it is.
 */
export function Magnetic({ children, strength, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canDoPointerMotion()) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { x, y, near } = magneticOffset(el.getBoundingClientRect(), { x: e.clientX, y: e.clientY }, { strength });
        el.style.translate = `${x}px ${y}px`;
        el.toggleAttribute("data-near", near);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [strength]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex transition-[translate] duration-300 ease-out-expo [&>*]:transition-[box-shadow,background-color,scale] [&>*]:active:scale-[0.97] data-[near]:[&>*]:shadow-[0_0_0_6px_rgb(217_155_75/0.16),0_14px_30px_-12px_rgb(197_134_53/0.55)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
