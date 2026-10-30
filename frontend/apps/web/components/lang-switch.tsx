"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@tthome/ui";
import { LANGS } from "@/lib/i18n";
import { saveLang, useI18n } from "@/lib/i18n/client";

/** "VI | EN" toggle. Saves the cookie and re-renders the current URL on the server in the chosen language. */
export function LangSwitch({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t.lang.label} aria-busy={pending || undefined} className={cn("inline-flex items-center rounded-full border border-line bg-white/70 p-0.5", size === "lg" ? "text-sm" : "text-xs", className)}>
      {LANGS.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            title={t.lang[code]}
            disabled={pending}
            onClick={() => {
              if (active) return;
              saveLang(code);
              startTransition(() => router.refresh());
            }}
            className={cn(
              "rounded-full font-bold tracking-[0.04em] uppercase transition-colors",
              size === "lg" ? "px-4 py-2" : "px-2.5 py-1",
              active ? "bg-ink text-white" : "text-ink-soft hover:text-gold-ink",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
