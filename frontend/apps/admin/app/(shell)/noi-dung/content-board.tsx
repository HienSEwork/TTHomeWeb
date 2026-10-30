"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { BANNERS, FAQS, MENU_ITEMS, POSTS, STATIC_PAGES } from "@tthome/data";
import { Badge, Button, formatCount } from "@tthome/ui";
import { Tabs, Toast } from "@/components/interactive";
import { TableFrame, td, th } from "@/components/page-parts";
import { fmt } from "@/lib/format";

type Tab = "posts" | "banners" | "pages" | "faq" | "menu";

const POST_STATUS = {
  draft: { label: "Bản nháp", tone: "neutral" },
  scheduled: { label: "Hẹn giờ đăng", tone: "plate" },
  published: { label: "Đã đăng", tone: "shutter" },
  archived: { label: "Lưu trữ", tone: "neutral" },
} as const;

const AUDIENCE = { tenant: "Người thuê", landlord: "Chủ nhà", all: "Mọi người" } as const;
const MENU_LOCATION: Record<string, string> = { header: "Menu đầu trang", footer_company: "Chân trang: Công ty", footer_connect: "Chân trang: Kết nối" };

export function ContentBoard() {
  const [tab, setTab] = useState<Tab>("posts");
  const [banners, setBanners] = useState(BANNERS);
  const [menu, setMenu] = useState(MENU_ITEMS);
  const [toast, setToast] = useState<string | null>(null);

  function moveMenu(id: string, dir: -1 | 1) {
    setMenu((list) => {
      const i = list.findIndex((m) => m.id === id);
      const j = i + dir;
      if (j < 0 || j >= list.length || list[j]!.location !== list[i]!.location) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <Tabs
        label="Loại nội dung"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "posts", label: "Bài viết", count: POSTS.length },
          { value: "banners", label: "Banner", count: banners.length },
          { value: "pages", label: "Trang tĩnh", count: STATIC_PAGES.length },
          { value: "faq", label: "Câu hỏi thường gặp", count: FAQS.length },
          { value: "menu", label: "Menu", count: menu.length },
        ]}
      />

      {tab === "posts" ? (
        <TableFrame caption="Bài viết">
          <thead>
            <tr>
              <th className={th}>Bài viết</th>
              <th className={th}>Chuyên mục</th>
              <th className={th}>Tác giả</th>
              <th className={th}>Trạng thái</th>
              <th className={`${th} text-right`}>Lượt xem</th>
              <th className={th}>Ngày đăng</th>
            </tr>
          </thead>
          <tbody>
            {POSTS.map((p) => (
              <tr key={p.slug} className="hover:bg-wash/60">
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-line">
                      <Image src={p.cover} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="line-clamp-2 max-w-md font-semibold text-ink">{p.title}</span>
                  </div>
                </td>
                <td className={`${td} text-ink-soft`}>{p.category.name}</td>
                <td className={`${td} text-ink-soft`}>{p.author}</td>
                <td className={td}>
                  <Badge tone={POST_STATUS[p.status].tone}>{POST_STATUS[p.status].label}</Badge>
                </td>
                <td className={`${td} text-right tabular`}>{p.views ? formatCount(p.views) : "Chưa có"}</td>
                <td className={`${td} text-muted tabular`}>{p.status === "published" ? fmt.date(p.publishedAt) : "Chưa đăng"}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : null}

      {tab === "banners" ? (
        <TableFrame caption="Banner">
          <thead>
            <tr>
              <th className={th}>Banner</th>
              <th className={th}>Vị trí</th>
              <th className={th}>Hết hạn</th>
              <th className={`${th} text-right`}>Lượt bấm</th>
              <th className={th}>Đang hiện</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td className={`${td} font-semibold text-ink`}>{b.title}</td>
                <td className={`${td} text-ink-soft`}>{b.placement}</td>
                <td className={`${td} text-muted tabular`}>{fmt.date(b.until)}</td>
                <td className={`${td} text-right tabular`}>{formatCount(b.clicks)}</td>
                <td className={td}>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={b.active}
                      onChange={(e) => {
                        setBanners((list) => list.map((x) => (x.id === b.id ? { ...x, active: e.target.checked } : x)));
                        setToast(e.target.checked ? "Đã bật banner" : "Đã tắt banner");
                      }}
                      className="peer sr-only"
                    />
                    <span aria-hidden className="relative h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-focus after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
                    <span className="text-sm text-ink-soft">{b.active ? "Bật" : "Tắt"}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : null}

      {tab === "pages" ? (
        <TableFrame caption="Trang tĩnh">
          <thead>
            <tr>
              <th className={th}>Trang</th>
              <th className={th}>Đường dẫn</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Sửa lần cuối</th>
            </tr>
          </thead>
          <tbody>
            {STATIC_PAGES.map((p) => (
              <tr key={p.slug}>
                <td className={`${td} font-semibold text-ink`}>{p.title}</td>
                <td className={`${td} text-muted tabular`}>/{p.slug}</td>
                <td className={td}>
                  <Badge tone={p.status === "published" ? "shutter" : "neutral"}>{p.status === "published" ? "Đã đăng" : "Bản nháp"}</Badge>
                </td>
                <td className={`${td} text-muted tabular`}>{fmt.date(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : null}

      {tab === "faq" ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {FAQS.map((f) => (
            <li key={f.id}>
              <details className="group px-5 py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span>
                    <span className="block font-semibold text-ink">{f.question}</span>
                    <span className="text-xs text-muted">
                      {f.group}, {AUDIENCE[f.audience]}
                    </span>
                  </span>
                  <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 max-w-3xl text-sm text-ink-soft">{f.answer}</p>
              </details>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "menu" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(MENU_LOCATION).map(([loc, label]) => {
            const items = menu.filter((m) => m.location === loc);
            if (!items.length) return null;
            return (
              <section key={loc} className="rounded-card border border-line bg-surface">
                <h2 className="border-b border-line px-5 py-3.5 text-[0.9375rem] font-bold text-ink">{label}</h2>
                <ol className="divide-y divide-line">
                  {items.map((m, i) => (
                    <li key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="w-5 text-sm text-muted tabular">{i + 1}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink">{m.label}</span>
                        <span className="text-xs text-muted">{m.href}</span>
                      </span>
                      <Button variant="ghost" size="sm" className="w-8 px-0" disabled={i === 0} onClick={() => moveMenu(m.id, -1)} aria-label={`Đưa ${m.label} lên`}>
                        <ArrowUp aria-hidden />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 px-0" disabled={i === items.length - 1} onClick={() => moveMenu(m.id, 1)} aria-label={`Đưa ${m.label} xuống`}>
                        <ArrowDown aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      ) : null}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
