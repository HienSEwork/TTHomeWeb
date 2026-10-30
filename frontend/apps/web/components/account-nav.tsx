"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { ACCOUNT_NAV, isActive } from "@/lib/nav";

export function AccountNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label={t.account.nav}>
      <ul className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {ACCOUNT_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                  active ? "bg-gold-soft font-semibold text-gold-ink" : "text-ink-soft hover:bg-ink/5 hover:text-ink",
                )}
              >
                {t.nav[item.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
