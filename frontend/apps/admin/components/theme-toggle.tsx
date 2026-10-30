"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@tthome/ui";
import { applyTheme, currentTheme, onSystemThemeChange, readStoredTheme, storeTheme } from "@/lib/theme";

/** Re-renders whenever data-theme on <html> changes, whoever changed it. */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Light/dark switch for the admin header. Pressed means dark; the choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  const dark = theme === "dark";

  // With no stored choice the admin keeps following the system setting while it is open.
  useEffect(
    () =>
      onSystemThemeChange((prefersDark) => {
        if (readStoredTheme() === null) applyTheme(prefersDark ? "dark" : "light");
      }),
    [],
  );

  function toggle() {
    const next = dark ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
  }

  const Icon = dark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Giao diện tối"
      title={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={cn("rounded-lg p-2.5 text-ink-soft hover:bg-wash hover:text-ink", className)}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
