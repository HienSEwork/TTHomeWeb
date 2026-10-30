"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@tthome/ui";

export type MenuOption = { value: string; label: string; hint?: string; group?: string };

const GAP = 8;

/**
 * Keeps a floating list under (or above, when the screen runs out) the field it belongs to. The list is portalled to
 * the body because the hero clips its overflow and its blurred search bar would trap a fixed child.
 */
function useAnchoredStyle(anchor: RefObject<HTMLElement | null>, open: boolean): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = anchor.current?.closest<HTMLElement>("[data-field]") ?? anchor.current;
        if (!field) return;
        const r = field.getBoundingClientRect();
        const width = Math.min(Math.max(r.width, 300), window.innerWidth - 2 * GAP);
        const left = Math.min(Math.max(GAP, r.left), window.innerWidth - width - GAP);
        const below = window.innerHeight - r.bottom - GAP * 2;
        const above = r.top - GAP * 2;
        const up = below < 240 && above > below;
        setStyle({
          position: "fixed",
          left,
          width,
          maxHeight: Math.min(360, up ? above : below),
          ...(up ? { bottom: window.innerHeight - r.top + GAP } : { top: r.bottom + GAP }),
        });
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchor, open]);
  return open ? style : null;
}

/** Closes the list on a press anywhere outside the field and the list. */
function useOutsidePress(open: boolean, inside: RefObject<HTMLElement | null>[], close: () => void) {
  const latest = useRef({ inside, close });
  useEffect(() => {
    latest.current = { inside, close };
  });
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (latest.current.inside.some((r) => r.current?.contains(target))) return;
      latest.current.close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
}

/** Arrow keys, Home/End, Enter and Escape over a list whose focus stays on the trigger (aria-activedescendant). */
export function useListKeys({
  open,
  count,
  setOpen,
  onPick,
  initial = 0,
}: {
  open: boolean;
  count: number;
  setOpen: (open: boolean) => void;
  onPick: (index: number) => void;
  initial?: number;
}) {
  const [active, setActive] = useState(-1);
  const onKeyDown = (e: KeyboardEvent) => {
    const move = (next: number) => {
      e.preventDefault();
      if (!open) setOpen(true);
      setActive(count ? (next + count) % count : -1);
    };
    switch (e.key) {
      case "ArrowDown":
        return move(open ? active + 1 : Math.max(initial, 0));
      case "ArrowUp":
        return move(open ? active - 1 : Math.max(initial, 0));
      case "Home":
        return open ? move(0) : undefined;
      case "End":
        return open ? move(count - 1) : undefined;
      case "Enter":
        if (open && active >= 0 && active < count) {
          e.preventDefault();
          onPick(active);
        }
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      case "Tab":
        if (open) setOpen(false);
        return;
    }
  };
  return { active, setActive, onKeyDown };
}

/** The floating list itself: grouped options, the chosen one ticked, the keyboard one highlighted. */
export function ListPanel({
  id,
  open,
  anchor,
  panelRef,
  options,
  active,
  selected,
  labelledBy,
  onPick,
  onHover,
}: {
  id: string;
  open: boolean;
  anchor: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLUListElement | null>;
  options: MenuOption[];
  active: number;
  selected?: string;
  labelledBy: string;
  onPick: (index: number) => void;
  onHover: (index: number) => void;
}) {
  const style = useAnchoredStyle(anchor, open);
  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-opt-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [active, id]);
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <ul
      ref={panelRef}
      id={id}
      role="listbox"
      aria-labelledby={labelledBy}
      style={style ?? { position: "fixed", opacity: 0 }}
      className="z-[60] animate-menu-in overflow-y-auto overscroll-contain [scrollbar-color:var(--color-line-strong)_transparent] [scrollbar-width:thin] rounded-2xl border border-line bg-white p-1.5 text-left shadow-[0_1px_2px_rgb(45_35_20/0.06),0_24px_48px_-16px_rgb(45_35_20/0.3)]"
    >
      {options.map((o, i) => {
        const heading = o.group && o.group !== options[i - 1]?.group;
        const isSelected = selected !== undefined && o.value === selected;
        return (
          <li key={`${o.group ?? ""}-${o.value}`} role="none">
            {heading ? (
              <p aria-hidden className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted">
                {o.group}
              </p>
            ) : null}
            <div
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={isSelected}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onPick(i)}
              onPointerMove={() => onHover(i)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] text-ink transition-colors duration-150",
                i === active && "bg-sand",
                isSelected && "font-semibold",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{o.label}</span>
                {o.hint ? <span className="truncate text-xs font-normal text-muted">{o.hint}</span> : null}
              </span>
              <Check aria-hidden className={cn("size-4 shrink-0 text-gold-deep", !isSelected && "invisible")} />
            </div>
          </li>
        );
      })}
    </ul>,
    document.body,
  );
}

/** A select that matches the search bar: a button showing the choice and a styled list of options. */
export function SelectMenu({
  id,
  labelId,
  value,
  options,
  placeholder,
  onChange,
  className,
}: {
  id: string;
  labelId: string;
  value: string;
  options: MenuOption[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpenState] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLUListElement>(null);
  const current = options.findIndex((o) => o.value === value);
  const pick = (i: number) => {
    onChange(options[i]!.value);
    setOpen(false);
  };
  const keys = useListKeys({ open, count: options.length, setOpen: (o) => setOpen(o), onPick: pick, initial: current });
  function setOpen(next: boolean) {
    setOpenState(next);
    keys.setActive(next ? Math.max(current, 0) : -1);
  }
  useOutsidePress(open, [button, panel], () => setOpen(false));
  const chosen = value ? options[current] : undefined;

  return (
    <>
      <button
        ref={button}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${labelId} ${id}`}
        aria-activedescendant={open && keys.active >= 0 ? `${id}-list-opt-${keys.active}` : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={keys.onKeyDown}
        className={cn(className, "text-left after:absolute after:inset-0 after:rounded-[inherit]", !chosen && "text-muted")}
      >
        {chosen?.label ?? placeholder}
      </button>
      <ListPanel
        id={`${id}-list`}
        open={open}
        anchor={button}
        panelRef={panel}
        options={options}
        active={keys.active}
        selected={value}
        labelledBy={labelId}
        onPick={pick}
        onHover={keys.setActive}
      />
    </>
  );
}

export { useOutsidePress };
