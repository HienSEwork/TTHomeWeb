"use client";

import { useState } from "react";
import { Button } from "@tthome/ui";
import { Toast } from "@/components/interactive";

const KINDS = [
  { value: "call", label: "Gọi điện" },
  { value: "zalo", label: "Zalo" },
  { value: "meeting", label: "Gặp mặt" },
  { value: "note", label: "Ghi chú" },
];

export function NoteForm() {
  const [kind, setKind] = useState("call");
  const [text, setText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  return (
    <form
      className="border-b border-line px-5 py-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setText("");
        setToast("Đã ghi lại lần chăm sóc");
      }}
    >
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Hình thức</legend>
        {KINDS.map((k) => (
          <label key={k.value} className="cursor-pointer rounded-full border border-line-strong px-3 py-1 text-sm font-medium text-ink-soft has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-plate">
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
            {k.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor="note-text" className="sr-only">
        Nội dung
      </label>
      <textarea
        id="note-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Khách nói gì, hẹn bước tiếp theo khi nào"
        className="mt-3 min-h-20 w-full rounded-[10px] border border-line-strong px-3 py-2 text-sm focus:border-plate focus:ring-2 focus:ring-plate/20 focus:outline-none"
      />
      <div className="mt-2 flex justify-end">
        <Button type="submit" size="sm" disabled={!text.trim()}>
          Lưu ghi chú
        </Button>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </form>
  );
}
