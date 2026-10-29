"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Globe, LogOut, Menu, Search, X } from "lucide-react";
import { Logo, cn } from "@tthome/ui";
import { NAV, isActive } from "@/lib/nav";

/** The public site. Same domain in production; set NEXT_PUBLIC_SITE_URL when it runs on another port locally. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "/";

function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Menu quản trị" className="flex-1 overflow-y-auto px-3 pb-6">
      {NAV.map((group) => (
        <div key={group.label} className="mt-6 first:mt-2">
          <p className="px-3 pb-1.5 text-xs font-semibold text-white/45">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon aria-hidden className={cn("size-[18px] shrink-0", active ? "text-wall" : "text-white/50")} />
                    <span className="flex-1">{item.label}</span>
                    {item.count ? (
                      <span className="tabular rounded-md bg-wall px-1.5 text-xs font-bold text-ink" aria-label={`${item.count} việc chờ`}>
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-shutter text-sm font-bold text-white">
        QT
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">Quản trị TTHome</p>
        <p className="truncate text-xs text-white/50">admin@tthome.vn</p>
      </div>
      <Link href="/dang-nhap" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Đăng xuất">
        <LogOut aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/" aria-label="Bảng điều khiển">
            <Logo tone="light" />
          </Link>
        </div>
        <SidebarNav pathname={pathname} />
        <SidebarFooter />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu quản trị">
          <button type="button" className="absolute inset-0 bg-ink/50" aria-label="Đóng menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-ink">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo tone="light" />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Đóng menu">
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setOpen(true)} className="-ml-1 rounded-lg p-2 text-ink-soft hover:bg-wash lg:hidden" aria-label="Mở menu">
          <Menu aria-hidden className="size-5" />
        </button>
        <form role="search" className="relative max-w-md flex-1" onSubmit={(e) => e.preventDefault()}>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <label htmlFor="admin-search" className="sr-only">
            Tìm khách, mã phòng, mã lịch hẹn
          </label>
          <input
            id="admin-search"
            placeholder="Tìm khách, mã phòng, mã lịch hẹn"
            className="h-10 w-full rounded-[10px] border border-line bg-wash pr-3 pl-9 text-sm placeholder:text-muted focus:border-plate focus:bg-surface focus:outline-none"
          />
        </form>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={SITE_URL}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-ink-soft hover:bg-wash hover:text-ink"
            aria-label="Xem trang web"
          >
            <Globe aria-hidden className="size-5" />
            <span className="max-sm:hidden">Xem trang web</span>
          </a>
          <button type="button" className="relative rounded-lg p-2.5 text-ink-soft hover:bg-wash" aria-label="Thông báo, 3 chưa đọc">
            <Bell aria-hidden className="size-5" />
            <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-surface" />
          </button>
          <span aria-hidden className="ml-1 hidden size-9 place-items-center rounded-full bg-shutter text-sm font-bold text-white sm:grid">
            QT
          </span>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
