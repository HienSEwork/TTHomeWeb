"use client";

import { useId, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { ApiError, errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";
import { Modal } from "@/components/admin/parts";
import type { Decision, Submission } from "./model";

const COPY: Record<Decision, { title: string; label: string; hint: string; submit: string; required: boolean }> = {
  approve: { title: "Duyệt hồ sơ", label: "Ghi chú (không bắt buộc)", hint: "Ghi chú lưu vào lịch sử duyệt.", submit: "Duyệt hồ sơ", required: false },
  need_info: { title: "Yêu cầu bổ sung", label: "Thông tin còn thiếu", hint: "Nêu rõ chủ nhà cần bổ sung gì.", submit: "Gửi yêu cầu", required: true },
  reject: { title: "Từ chối hồ sơ", label: "Lý do từ chối", hint: "Chủ nhà sẽ thấy lý do này.", submit: "Từ chối hồ sơ", required: true },
};

export const buttonBase =
  "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60";

export function ReviewModal({
  submission,
  decision,
  onClose,
  onDone,
}: {
  submission: Submission;
  decision: Decision;
  onClose: () => void;
  onDone: () => void;
}) {
  const copy = COPY[decision];
  const fieldId = useId();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await adminApi(`consignment/submissions/${submission.id}/review`, {
        method: "PUT",
        body: { decision, note: note.trim() || undefined },
      });
      onDone();
    } catch (err) {
      // The service answers 409 when someone else already decided this submission.
      setError(err instanceof ApiError && err.status === 409 ? "Hồ sơ này đã được xử lý trước đó. Hãy tải lại danh sách." : errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={`${copy.title} ${submission.code}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink-soft">{copy.label}</label>
          <textarea
            id={fieldId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required={copy.required}
            maxLength={2000}
            rows={4}
            aria-describedby={`${fieldId}-hint`}
            className="w-full rounded-xl border border-gold/60 bg-white px-4 py-3 text-base transition-colors duration-200 focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40"
          />
          <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-ink-soft">{copy.hint}</p>
        </div>
        <Notice>{error}</Notice>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${buttonBase} text-ink-soft hover:bg-sunken`}>Hủy</button>
          <button
            type="submit"
            disabled={busy || (copy.required && !note.trim())}
            className={`${buttonBase} ${decision === "reject" ? "border border-danger text-danger hover:bg-danger/10" : "bg-ink text-paper hover:bg-ink/85"}`}
          >
            {copy.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
