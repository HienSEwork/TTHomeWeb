"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@tthome/ui";

const EXIT_MS = 300;

/**
 * A panel that slides in from the right over a dimmed page. Rendered into <body> so no ancestor (a header
 * with backdrop-filter, a transformed card) can clip it. Escape, the backdrop and the close button close it;
 * focus moves into the panel and back to `returnFocus` afterwards, and the page behind does not scroll.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  returnFocus,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  returnFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Stays mounted for the slide-out, then unmounts.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  // Becomes true a frame after opening so the panel slides in instead of appearing.
  const [entered, setEntered] = useState(false);
  const shown = open && entered;

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => {
      setEntered(false);
      setMounted(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const back = returnFocus?.current;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the panel.
      const items = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [open, onClose, returnFocus]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div aria-hidden onClick={onClose} className={cn("absolute inset-0 bg-[#1C1A17]/45 backdrop-blur-[2px] transition-opacity duration-300", shown ? "opacity-100" : "opacity-0")} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(24rem,88vw)] flex-col bg-white shadow-[-24px_0_60px_-20px_rgb(28_26_23/0.35)] outline-none transition-transform duration-300 ease-out-expo motion-reduce:transition-none",
          shown ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ivory hover:text-ink">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
