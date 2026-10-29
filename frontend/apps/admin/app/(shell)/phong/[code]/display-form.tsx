"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import type { Project } from "@tthome/data";
import { Button, TextAreaField, TextField, cn } from "@tthome/ui";
import { Toast } from "@/components/interactive";

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

export function DisplayForm({ project }: { project: Project }) {
  const [gallery, setGallery] = useState(project.images);
  const [seoTitle, setSeoTitle] = useState(`${project.name}: phòng trống, giá thuê mới nhất`);
  const [seoDesc, setSeoDesc] = useState(project.description);
  const [promo, setPromo] = useState(project.promo ?? "");
  const [exclusive, setExclusive] = useState(project.exclusive);
  const [toast, setToast] = useState<string | null>(null);

  function move(index: number, dir: -1 | 1) {
    setGallery((g) => {
      const next = [...g];
      const target = index + dir;
      if (target < 0 || target >= next.length) return g;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function makeCover(index: number) {
    setGallery((g) => [g[index]!, ...g.filter((_, i) => i !== index)]);
  }

  return (
    <form
      className="rounded-card border border-line bg-surface"
      onSubmit={(e) => {
        e.preventDefault();
        setToast("Đã lưu phần hiển thị trên web");
      }}
    >
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-[0.9375rem] font-bold text-ink">Hiển thị trên web</h2>
      </div>

      <fieldset className="px-5 pt-4">
        <legend className="text-sm font-semibold text-ink">Ảnh và thứ tự hiển thị</legend>
        <p className="mt-0.5 text-sm text-muted">Ảnh đầu tiên là ảnh bìa trên thẻ dự án.</p>
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {gallery.map((src, i) => (
            <li key={src} className="group relative">
              <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg bg-line", i === 0 && "ring-2 ring-shutter ring-offset-2")}>
                <Image src={src} alt={`Ảnh ${i + 1}`} fill sizes="160px" className="object-cover" />
                {i === 0 ? <span className="absolute top-1.5 left-1.5 rounded-md bg-shutter px-1.5 py-0.5 text-[0.6875rem] font-bold text-white">Ảnh bìa</span> : null}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="text-xs text-muted tabular">{i + 1}</span>
                <span className="flex gap-0.5">
                  {i > 0 ? (
                    <button type="button" onClick={() => makeCover(i)} className="rounded p-1 text-muted hover:bg-wash hover:text-shutter" aria-label={`Đặt ảnh ${i + 1} làm ảnh bìa`}>
                      <Star aria-hidden className="size-3.5" />
                    </button>
                  ) : null}
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-muted hover:bg-wash hover:text-ink disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} lên trước`}>
                    <ArrowUp aria-hidden className="size-3.5" />
                  </button>
                  <button type="button" disabled={i === gallery.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-muted hover:bg-wash hover:text-ink disabled:opacity-30" aria-label={`Đưa ảnh ${i + 1} ra sau`}>
                    <ArrowDown aria-hidden className="size-3.5" />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>

      <div className="grid gap-4 px-5 py-5">
        <TextField
          label="Tiêu đề SEO"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          hint={`${seoTitle.length}/${SEO_TITLE_MAX} ký tự`}
          error={seoTitle.length > SEO_TITLE_MAX ? `Dài quá ${seoTitle.length - SEO_TITLE_MAX} ký tự, Google sẽ cắt bớt` : undefined}
        />
        <TextAreaField
          label="Mô tả SEO"
          value={seoDesc}
          onChange={(e) => setSeoDesc(e.target.value)}
          hint={`${seoDesc.length}/${SEO_DESC_MAX} ký tự`}
          error={seoDesc.length > SEO_DESC_MAX ? `Dài quá ${seoDesc.length - SEO_DESC_MAX} ký tự` : undefined}
        />
        <TextField label="Nhãn ưu đãi" optional value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Ví dụ: Giảm 50% tháng đầu" hint="Hiện trên thẻ dự án và trang chi tiết." />
        <label className="flex items-start gap-3 rounded-lg border border-line p-3">
          <input type="checkbox" checked={exclusive} onChange={(e) => setExclusive(e.target.checked)} className="mt-0.5 size-4 accent-shutter" />
          <span>
            <span className="block text-sm font-semibold text-ink">Gắn nhãn Độc quyền</span>
            <span className="block text-sm text-muted">Chỉ dùng cho tòa nhà TTHome quản lý trực tiếp.</span>
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-line bg-wash/50 px-5 py-3">
        <Button
          variant="ghost"
          onClick={() => {
            setGallery(project.images);
            setPromo(project.promo ?? "");
            setExclusive(project.exclusive);
          }}
        >
          Hoàn tác
        </Button>
        <Button type="submit">Lưu thay đổi</Button>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </form>
  );
}
