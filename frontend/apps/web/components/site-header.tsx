"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, Menu, Phone, X } from "lucide-react";
import { SITE } from "@tthome/data";
import { buttonStyles, cn } from "@tthome/ui";
import { MAIN_NAV, isActive } from "@/lib/nav";
import { BrandLockup } from "./brand-logo";
import { Magnetic } from "./magnetic";

/** The admin app. Served under /admin in production; set NEXT_PUBLIC_ADMIN_URL when it runs on another port locally. */
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "/admin";

export function SiteHeader() {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpenOn(null);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ease-out-expo",
        scrolled || open
          ? "border-line/80 bg-alabaster/95 shadow-[0_8px_30px_-12px_rgb(45_35_20/0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-alabaster/75"
          : "border-transparent bg-alabaster",
      )}
    >
      <div className={cn("mx-auto flex max-w-[1280px] items-center gap-6 px-4 transition-[height] duration-500 ease-out-expo sm:px-6", scrolled ? "h-16" : "h-20")}>
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
          <Magnetic strength={0.2} className="max-sm:hidden">
            <Link href="/ky-gui" className={buttonStyles({ size: "md", className: "rounded-full px-5 shadow-[var(--shadow-soft)]" })}>
              Ký gửi phòng
            </Link>
          </Magnetic>
          <button
            ref={toggle}
            type="button"
            className={buttonStyles({ variant: "ghost", size: "md", className: "px-2.5 lg:hidden" })}
            aria-expanded={open}
            aria-controls="menu-di-dong"
            onClick={() => setOpen(!open)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? "Đóng menu" : "Mở menu"}</span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="menu-di-dong" aria-label="Menu chính" className={cn("fixed inset-x-0 bottom-0 overflow-y-auto border-t border-line bg-alabaster px-4 pt-2 pb-10 lg:hidden", scrolled ? "top-16" : "top-20")}>
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
