"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Headset, Heart, LayoutDashboard, Menu, MessageCircle, Phone } from "lucide-react";
import { SITE } from "@tthome/data";
import { buttonStyles, cn } from "@tthome/ui";
import { hasDemoSession } from "@/lib/demo-session";
import { useFavorites } from "@/lib/favorites";
import { useI18n } from "@/lib/i18n/client";
import { MAIN_NAV, isActive } from "@/lib/nav";
import { BrandLockup } from "./brand-logo";
import { ConsultDialog } from "./consult-dialog";
import { Drawer } from "./drawer";
import { SignInForm } from "./form-signin";
import { LangSwitch } from "./lang-switch";
import { Magnetic } from "./magnetic";
import { SignInDemoHint } from "./signin-demo-hint";

/** The admin app. Served under /admin in production; set NEXT_PUBLIC_ADMIN_URL when it runs on another port locally. */
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "/admin";

const noSubscription = () => () => {};

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  // The menu belongs to the page it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean) => setOpenOn(next ? pathname : null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // The demo session lives in a cookie: read on every render in the browser, never on the server.
  const signedIn = useSyncExternalStore(noSubscription, hasDemoSession, () => false);
  const favorites = useFavorites().length;
  const [signInOpen, setSignInOpen] = useState(false);
  // Where focus returns when the sign-in drawer closes: the button that opened it, or the menu toggle.
  const signInReturn = useRef<HTMLElement | null>(null);
  const closeMenu = useCallback(() => setOpenOn(null), []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);
  const [consultOpen, setConsultOpen] = useState(false);
  const consultReturn = useRef<HTMLElement | null>(null);
  const closeConsult = useCallback(() => setConsultOpen(false), []);
  const openConsult = () => {
    consultReturn.current = open ? toggle.current : (document.activeElement as HTMLElement | null);
    setOpenOn(null);
    setConsultOpen(true);
  };
  const openSignIn = () => {
    signInReturn.current = open ? toggle.current : (document.activeElement as HTMLElement | null);
    setOpenOn(null);
    setSignInOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    {/* Holds the header's full height in the page, so the header can shrink on scroll without moving the content. */}
    <div aria-hidden className="h-20 shrink-0" />
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ease-out-expo",
        scrolled || open
          ? "border-line/80 bg-alabaster/95 shadow-[0_8px_30px_-12px_rgb(45_35_20/0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-alabaster/75"
          : "border-transparent bg-alabaster",
      )}
    >
      <div className={cn("mx-auto flex max-w-[1280px] items-center gap-6 px-4 2xl:max-w-[1360px] transition-[height] duration-500 ease-out-expo sm:px-6", scrolled ? "h-16" : "h-20")}>
        <Link href="/" aria-label={t.brand.homeLink} className="shrink-0">
          <BrandLockup tagline={t.brand.tagline} />
        </Link>

        <nav aria-label={t.nav.main} className="hidden flex-1 justify-center xl:flex">
          <ul className="flex items-center gap-5 2xl:gap-7">
            {MAIN_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-3 text-[0.875rem] font-medium whitespace-nowrap transition-colors 2xl:text-[0.9375rem]",
                      "after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:rounded-full after:bg-gold after:transition-opacity",
                      active ? "text-gold-ink after:opacity-100" : "text-ink-soft after:opacity-0 hover:text-gold-ink",
                    )}
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-3 xl:ml-0">
          <LangSwitch className="max-2xl:hidden" />
          <Magnetic strength={0.2} className="max-sm:hidden">
            <button type="button" onClick={openConsult} aria-haspopup="dialog" className={buttonStyles({ size: "md", className: "rounded-full px-5 whitespace-nowrap shadow-[var(--shadow-soft)]" })}>
              {t.nav.consult}
            </button>
          </Magnetic>
          <Link
            href="/yeu-thich"
            aria-label={t.nav.favorites(favorites)}
            title={t.nav.favorites(0)}
            aria-current={pathname === "/yeu-thich" ? "page" : undefined}
            className="relative rounded-lg p-2 text-ink-soft transition-colors hover:bg-ivory hover:text-[#c2543f] aria-[current=page]:text-[#c2543f]"
          >
            <Heart aria-hidden className={cn("size-5", favorites > 0 && "fill-[#c2543f] text-[#c2543f]")} />
            {favorites > 0 ? (
              <span
                key={favorites}
                aria-hidden
                className="tabular absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] animate-pop place-items-center rounded-full bg-[#c2543f] px-1 text-[0.6875rem] leading-none font-bold text-white ring-2 ring-alabaster"
              >
                {favorites > 99 ? "99+" : favorites}
              </span>
            ) : null}
          </Link>
          {signedIn ? (
            <Link href="/tai-khoan/ho-so" className="px-2 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-gold-ink max-sm:hidden">
              {t.nav.account}
            </Link>
          ) : (
            <button type="button" onClick={openSignIn} aria-haspopup="dialog" className="px-2 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-ink-soft transition-colors hover:text-gold-ink max-sm:hidden">
              {t.nav.signIn}
            </button>
          )}
          <a href={ADMIN_URL} className="rounded-lg p-2 text-muted transition-colors hover:bg-ivory hover:text-gold-ink max-sm:hidden" aria-label={t.nav.admin} title={t.nav.admin}>
            <LayoutDashboard aria-hidden className="size-5" />
          </a>
          <button
            ref={toggle}
            type="button"
            className={buttonStyles({ variant: "ghost", size: "md", className: "px-2.5 xl:hidden" })}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(!open)}
          >
            <Menu aria-hidden />
            <span className="sr-only">{t.nav.openMenu}</span>
          </button>
        </div>
      </div>

      <Drawer open={open} onClose={closeMenu} title={t.nav.menuTitle} closeLabel={t.nav.closeMenu} returnFocus={toggle} className="xl:hidden">
        <nav id="menu-di-dong" aria-label={t.nav.main}>
          <ul className="flex flex-col">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex items-center border-b border-line py-4 text-lg font-semibold text-ink aria-[current=page]:text-gold-ink"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted">{t.lang.label}</span>
            <LangSwitch size="lg" />
          </div>
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={openConsult} aria-haspopup="dialog" className={buttonStyles({ size: "lg", className: "w-full rounded-full" })}>
              <Headset aria-hidden />
              {t.nav.consult}
            </button>
            {signedIn ? (
              <Link href="/tai-khoan/ho-so" onClick={closeMenu} className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full rounded-full" })}>
                {t.nav.account}
              </Link>
            ) : (
              <button type="button" onClick={openSignIn} aria-haspopup="dialog" className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full rounded-full" })}>
                {t.nav.signIn}
              </button>
            )}
            <a href={SITE.zalo} target="_blank" rel="noopener" className={buttonStyles({ variant: "ghost", size: "lg", className: "w-full" })}>
              <MessageCircle aria-hidden />
              {t.quickContact.zalo}
            </a>
            <a href={SITE.hotlineHref} className={buttonStyles({ variant: "ghost", size: "lg", className: "w-full" })}>
              <Phone aria-hidden />
              {t.quickContact.support(SITE.hotline)}
            </a>
            <a href={ADMIN_URL} className={buttonStyles({ variant: "ghost", size: "lg", className: "w-full" })}>
              <LayoutDashboard aria-hidden />
              {t.nav.admin}
            </a>
          </div>
        </nav>
      </Drawer>

      <ConsultDialog open={consultOpen} onClose={closeConsult} returnFocus={consultReturn} />

      <Drawer open={signInOpen} onClose={closeSignIn} title={t.signIn.title} closeLabel={t.common.close} returnFocus={signInReturn}>
        <p className="text-sm text-muted">{t.signIn.lead}</p>
        <SignInDemoHint className="mt-4" />
        <div className="mt-5 [&>div]:border-0 [&>div]:p-0 [&>div]:sm:p-0">
          <SignInForm onSignedIn={closeSignIn} />
        </div>
      </Drawer>
    </header>
    </>
  );
}
