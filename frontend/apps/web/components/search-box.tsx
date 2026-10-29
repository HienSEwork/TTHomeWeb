"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Building, GraduationCap, MapPin, Search } from "lucide-react";
import { Button, cn } from "@tthome/ui";
import { suggest, type Suggestion } from "@/lib/suggest";

const KIND_ICON = { area: MapPin, landmark: GraduationCap, project: Building } as const;

/**
 * Keyword box with suggestions (ARIA combobox). Enter on a suggestion opens it;
 * Enter on free text opens the search page with that keyword.
 */
export function SearchBox({ defaultValue = "", size = "lg", className }: { defaultValue?: string; size?: "md" | "lg"; className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = useMemo(() => suggest(value), [value]);
  const showList = open && items.length > 0;

  function go(item?: Suggestion) {
    setOpen(false);
    if (item) router.push(item.href);
    else router.push(value.trim() ? `/tim-kiem?q=${encodeURIComponent(value.trim())}` : "/tim-kiem");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        go(showList && active >= 0 ? items[active] : undefined);
      }}
    >
      <div className={cn("flex items-center gap-2 rounded-2xl border border-line-strong bg-surface p-1.5 pl-4 focus-within:border-plate focus-within:ring-4 focus-within:ring-plate/15", size === "lg" && "sm:p-2 sm:pl-5")}>
        <Search aria-hidden className="size-5 shrink-0 text-muted" />
        <label htmlFor={`${listId}-input`} className="sr-only">
          Tìm theo tên đường, phường, trường học hoặc tên tòa nhà
        </label>
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Tên đường, phường, trường học, tòa nhà…"
          className={cn("min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted focus:outline-none", size === "lg" ? "h-11 text-base sm:text-[1.0625rem]" : "h-9 text-[0.9375rem]")}
        />
        <Button type="submit" size={size === "lg" ? "lg" : "md"} className="shrink-0">
          Tìm phòng
        </Button>
      </div>

      {showList ? (
        <ul id={listId} role="listbox" aria-label="Gợi ý" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-[var(--shadow-lift)]">
          {items.map((item, i) => {
            const Icon = KIND_ICON[item.kind];
            return (
              <li
                key={item.href}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(item);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5", i === active && "bg-wash")}
              >
                <Icon aria-hidden className="size-4 shrink-0 text-plate" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{item.label}</span>
                  <span className="block truncate text-sm text-muted">{item.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
