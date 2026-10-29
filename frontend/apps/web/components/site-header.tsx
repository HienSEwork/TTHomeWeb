"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, Phone, X } from "lucide-react";
import { SITE } from "@tthome/data";
import { buttonStyles, cn } from "@tthome/ui";
import { MAIN_NAV, isActive } from "@/lib/nav";
import { BrandLockup } from "./brand-logo";

/** The admin app. Served under /admin in production; set NEXT_PUBLIC_ADMIN_URL when it runs on another port locally. */
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "/admin";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/90 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="TTHOME, về trang chủ" className="shrink-0">
          <BrandLockup />
        </Link>

        <nav aria-label="Menu chính" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-8">
            {MAIN_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-3 text-[0.9375rem] font-medium transition-colors",
                      "after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:rounded-full after:bg-gold after:transition-opacity",
                      active ? "text-gold-ink after:opacity-100" : "text-ink-soft after:opacity-0 hover:text-gold-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-3 lg:ml-0">
          <a href={ADMIN_URL} className="rounded-lg p-2 text-muted transition-colors hover:bg-ivory hover:text-gold-ink max-sm:hidden" aria-label="Trang quản trị" title="Trang quản trị">
            <LayoutDashboard aria-hidden className="size-5" />
          </a>
          <Link href="/dang-nhap" className="px-2 py-2 text-[0.9375rem] font-semibold text-ink-soft transition-colors hover:text-gold-ink max-sm:hidden">
            Đăng nhập
          </Link>
          <Link href="/ky-gui" className={buttonStyles({ size: "md", className: "rounded-[10px] px-5 shadow-[var(--shadow-soft)] max-sm:hidden" })}>
            Ký gửi phòng
          </Link>
          <button
            type="button"
            className={buttonStyles({ variant: "ghost", size: "md", className: "px-2.5 lg:hidden" })}
            aria-expanded={open}
            aria-controls="menu-di-dong"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? "Đóng menu" : "Mở menu"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="menu-di-dong" aria-label="Menu chính" className="fixed inset-x-0 top-[72px] bottom-0 overflow-y-auto border-t border-line bg-white px-4 pt-2 pb-10 lg:hidden">
          <ul className="flex flex-col">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex items-center border-b border-line py-4 text-lg font-semibold text-ink aria-[current=page]:text-gold-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2">
            <Link href="/ky-gui" onClick={() => setOpen(false)} className={buttonStyles({ size: "lg", className: "w-full" })}>
              Ký gửi phòng
            </Link>
            <Link href="/dang-nhap" onClick={() => setOpen(false)} className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full" })}>
              Đăng nhập
            </Link>
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "ghost", size: "lg", className: "w-full" })}>
              <Phone aria-hidden />
              Gọi {SITE.hotline}
            </a>
            <a href={ADMIN_URL} className={buttonStyles({ variant: "ghost", size: "lg", className: "w-full" })}>
              <LayoutDashboard aria-hidden />
              Trang quản trị
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
