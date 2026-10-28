"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";
import { BTN, Check } from "./controls";
import { FIXED_ROLE, PERMISSION_LABELS, PermissionRow, RoleRow, roleLabel, sameSet } from "./model";
import { useAction } from "./use-action";

type RolesQuery = { data?: RoleRow[]; error?: unknown; loading: boolean; reload: () => void };

export function RolesView({ rolesQuery }: { rolesQuery: RolesQuery }) {
  const { data: roles, error, loading, reload } = rolesQuery;
  const perms = useAdminQuery<PermissionRow[]>("permissions");
  // Unsaved permission sets by role code; a role absent here shows what the server holds.
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const save = useAction();

  const current = (r: RoleRow) => draft[r.code] ?? r.permissions;
  const dirty = (roles ?? []).filter((r) => r.code !== FIXED_ROLE && draft[r.code] && !sameSet(draft[r.code], r.permissions));

  const toggle = (r: RoleRow, code: string, on: boolean) =>
    setDraft((d) => ({ ...d, [r.code]: on ? [...current(r), code] : current(r).filter((c) => c !== code) }));

  const submit = () => save.run(async () => {
    const results = await Promise.allSettled(
      dirty.map((r) => adminApi(`roles/${r.code}/permissions`, { method: "PUT", body: { permissions: current(r) } })),
    );
    const failed = dirty.filter((_, i) => results[i].status === "rejected");
    setDraft(Object.fromEntries(failed.map((r) => [r.code, current(r)])));
    reload();
    const first = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (first) throw first.reason;
  });

  const failure = error ?? perms.error;
  if (failure) return <Notice>{errorMessage(failure)}</Notice>;
  if (!roles || !perms.data) return <p className="px-3 py-6 text-ink-soft">Đang tải…</p>;
  if (perms.data.length === 0) return <p className="px-3 py-6 text-ink-soft">Chưa có quyền nào được khai báo.</p>;

  return (
    <div aria-busy={loading || perms.loading}>
      <p className="rise mb-4 text-ink-soft">
        Tài khoản nhận quyền từ các vai trò của mình. Quyền của {roleLabel(FIXED_ROLE)} là cố định và không chỉnh sửa được.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="h-10 px-3 text-sm font-normal text-ink-soft">Quyền</th>
              {roles.map((r) => (
                <th key={r.code} scope="col" className="h-10 px-3 text-center text-sm font-normal text-ink-soft">
                  {roleLabel(r.code, r.name)}
                  {r.code === FIXED_ROLE && <span className="block text-xs">Cố định</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perms.data.map((p, i) => (
              <tr key={p.code} className="rise border-b border-line/60" style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  <span className="block">{PERMISSION_LABELS[p.code] ?? p.description}</span>
                  <span className="block font-mono text-xs text-ink-soft">{p.code}</span>
                </th>
                {roles.map((r) => {
                  const on = current(r).includes(p.code);
                  const changed = on !== r.permissions.includes(p.code);
                  return (
                    <td key={r.code} className={`h-12 px-3 text-center transition-colors duration-200 ${changed ? "bg-gold-pale/50" : ""}`}>
                      <Check
                        aria-label={`${roleLabel(r.code, r.name)}: ${PERMISSION_LABELS[p.code] ?? p.description}`}
                        checked={on}
                        disabled={r.code === FIXED_ROLE || save.busy}
                        changed={changed}
                        onChange={(e) => toggle(r, p.code, e.target.checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4"><Notice>{save.error}</Notice></div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto text-sm text-ink-soft" role="status">
          {dirty.length > 0 ? `${dirty.length} vai trò có thay đổi chưa lưu` : "Chưa có thay đổi"}
        </p>
        <button type="button" className={BTN.secondary} disabled={dirty.length === 0 || save.busy} onClick={() => setDraft({})}>
          Hoàn tác
        </button>
        <button type="button" className={BTN.primary} disabled={dirty.length === 0 || save.busy} onClick={submit}>
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
