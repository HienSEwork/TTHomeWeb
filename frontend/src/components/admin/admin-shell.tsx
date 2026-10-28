"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/building";
import { api, ApiError, Me } from "@/lib/api";
import { NAV, STAFF_ROLES } from "./nav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api<Me>("me").then(setMe).catch((e) => {
      if (e instanceof ApiError && e.status === 401) router.replace("/dang-nhap?next=/admin");
    });
  }, [router]);

  const allowed = me?.roles.some((r) => STAFF_ROLES.includes(r));
  const leave = async () => {
    await api("logout").catch(() => undefined);
    router.replace("/dang-nhap");
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <header className="flex items-center justify-between px-6 py-4 lg:hidden">
        <Wordmark />
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-nav"
          onClick={() => setOpen((o) => !o)}
          className="h-10 rounded-full bg-cream px-5 text-sm font-semibold active:scale-95"
        >
          {open ? "Đóng" : "Menu"}
        </button>
      </header>

      <aside
        id="admin-nav"
        className={`${open ? "grid" : "hidden"} gap-6 px-4 pb-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-0 lg:overflow-y-auto lg:px-4 lg:py-6`}
      >
        <div className="mb-6 hidden px-3 lg:block">
          <Wordmark />
          <p className="mt-0.5 text-sm text-ink-soft">Trang quản trị</p>
        </div>
        <nav aria-label="Quản trị" className="flex flex-col gap-6">
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-sm text-ink-soft">{group.label}</p>
              <ul>
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-[0.9375rem] transition-colors duration-150 ${active ? "bg-sunken font-semibold" : "hover:bg-sunken/60"}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto px-3 pt-8 text-sm">
          <p className="truncate font-semibold">{me?.fullName || me?.email || me?.phone || " "}</p>
          <button type="button" onClick={leave} className="mt-1 text-gold-deep underline-offset-4 hover:underline">
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-6 pb-16 pt-6 lg:px-10 lg:pt-9">
        {me && !allowed ? (
          <p role="alert" className="max-w-md rounded-xl bg-danger/10 px-4 py-3 font-medium text-danger">
            Tài khoản này không có quyền vào trang quản trị.
          </p>
        ) : (
          me && children
        )}
      </main>
    </div>
  );
}
