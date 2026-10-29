"use client";

import { useState } from "react";
import { Check, Copy, Heart, Share2 } from "lucide-react";
import { buttonStyles, cn } from "@tthome/ui";

/** Save and share buttons. Saving asks the visitor to sign in until accounts are wired. */
export function ProjectActions({ url, title }: { url: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const fullUrl = `https://tthome.vn${url}`;

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {
        // The visitor closed the share sheet; fall back to the menu.
      }
    }
    setShareOpen((v) => !v);
  }

  async function copy() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex gap-2">
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => setSaved((v) => !v)}
        className={buttonStyles({ variant: "secondary", size: "sm", className: cn(saved && "text-danger") })}
      >
        <Heart aria-hidden className={cn(saved && "fill-current")} />
        {saved ? "Đã lưu" : "Lưu"}
      </button>
      <button type="button" onClick={share} aria-expanded={shareOpen} className={buttonStyles({ variant: "secondary", size: "sm" })}>
        <Share2 aria-hidden />
        Chia sẻ
      </button>
      {shareOpen ? (
        <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-lift)]">
          <button type="button" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-wash">
            {copied ? <Check aria-hidden className="size-4 text-shutter" /> : <Copy aria-hidden className="size-4" />}
            {copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
          </button>
          <a href={`https://zalo.me/share?url=${encodeURIComponent(fullUrl)}`} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-wash">
            <span aria-hidden className="grid size-4 place-items-center rounded bg-[#0068ff] text-[0.5rem] font-bold text-white">Z</span>
            Chia sẻ qua Zalo
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-wash">
            <span aria-hidden className="grid size-4 place-items-center rounded bg-[#1877f2] text-[0.625rem] font-bold text-white">f</span>
            Chia sẻ qua Facebook
          </a>
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {copied ? "Đã sao chép liên kết" : ""}
      </span>
    </div>
  );
}
