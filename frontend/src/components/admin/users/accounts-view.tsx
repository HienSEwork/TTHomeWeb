"use client";

import { useEffect, useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Notice } from "@/components/ui";
import { Column, DataTable, Modal, Tag } from "@/components/admin/parts";
import { BTN, Check, INPUT, TextAction } from "./controls";
import {
  AdminUser, PageOf, PAGE_SIZE, FIXED_ROLE, RoleRow, STATUSES, displayName, formatDate, roleLabel, sameSet,
} from "./model";
import { useAction } from "./use-action";

const Dash = () => <span className="text-ink-soft">—</span>;

function LockDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const { busy, error, run } = useAction();
  const confirm = async () => {
    if (await run(() => adminApi(`users/${user.id}/lock`, { method: "POST" }))) onDone();
  };
  return (
    <Modal title="Khóa tài khoản" onClose={onClose}>
      <p>
        Khóa <strong>{displayName(user)}</strong>? Người này bị đăng xuất khỏi mọi thiết bị và không đăng nhập lại được
        cho đến khi bạn mở khóa.
      </p>
      <div className="mt-4"><Notice>{error}</Notice></div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={BTN.secondary} onClick={onClose}>Hủy</button>
        <button type="button" className={BTN.danger} disabled={busy} onClick={confirm}>Khóa tài khoản</button>
      </div>
    </Modal>
  );
}

function RolesDialog({
  user, roles, isSelf, onClose, onDone,
}: { user: AdminUser; roles: RoleRow[]; isSelf: boolean; onClose: () => void; onDone: () => void }) {
  const [picked, setPicked] = useState(user.roles);
  const { busy, error, run } = useAction();
  const toggle = (code: string, on: boolean) => setPicked((p) => (on ? [...p, code] : p.filter((c) => c !== code)));
  // Send in the server's role order so the body does not depend on click order.
  const next = roles.map((r) => r.code).filter((c) => picked.includes(c));
  const save = async () => {
    if (await run(() => adminApi(`users/${user.id}/roles`, { method: "PUT", body: { roles: next } }))) onDone();
  };
  return (
    <Modal title="Vai trò của tài khoản" onClose={onClose}>
      <p className="text-ink-soft">{displayName(user)}</p>
      <fieldset className="mt-4 grid gap-1">
        <legend className="sr-only">Chọn vai trò</legend>
        {roles.map((r) => {
          const locked = isSelf && r.code === FIXED_ROLE;
          return (
            <label key={r.code} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 transition-colors hover:bg-sunken/60">
              <Check
                checked={picked.includes(r.code)}
                disabled={locked}
                onChange={(e) => toggle(r.code, e.target.checked)}
              />
              <span>
                {roleLabel(r.code, r.name)}
                {locked && <span className="block text-sm text-ink-soft">Bạn không thể tự gỡ vai trò này của mình.</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <p className="mt-3 text-sm text-ink-soft">
        {isSelf ? "Các phiên đăng nhập khác của bạn sẽ bị đăng xuất." : "Người này sẽ bị đăng xuất khỏi mọi thiết bị để nhận quyền mới."}
      </p>
      <div className="mt-4"><Notice>{error}</Notice></div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={BTN.secondary} onClick={onClose}>Hủy</button>
        <button
          type="button"
          className={BTN.primary}
          disabled={busy || next.length === 0 || sameSet(next, user.roles)}
          onClick={save}
        >
          Lưu vai trò
        </button>
      </div>
      {next.length === 0 && <p className="mt-2 text-right text-sm text-ink-soft">Cần giữ ít nhất một vai trò.</p>}
    </Modal>
  );
}

export function AccountsView({ roles, selfId }: { roles?: RoleRow[]; selfId?: string }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [lockTarget, setLockTarget] = useState<AdminUser>();
  const [roleTarget, setRoleTarget] = useState<AdminUser>();
  const row = useAction();

  // Search waits for a pause in typing, then goes back to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(text.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [text]);

  const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  const { data, error, loading, reload } = useAdminQuery<PageOf<AdminUser>>(`users?${params}`);

  const filtered = Boolean(q || role || status);
  const unlock = (u: AdminUser) => row.run(async () => {
    await adminApi(`users/${u.id}/unlock`, { method: "POST" });
    reload();
  });
  const done = () => {
    setLockTarget(undefined);
    setRoleTarget(undefined);
    reload();
  };
  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(e.target.value);
    setPage(0);
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "Tài khoản",
      className: "py-2",
      render: (u) => {
        const contacts = [u.email, u.phone].filter(Boolean);
        const main = u.fullName || contacts[0] || u.id;
        const sub = (u.fullName ? contacts : contacts.slice(1)).join(" · ");
        return (
          <div className="min-w-0">
            <p className="truncate font-medium">{main}{u.id === selfId && <span className="font-normal text-ink-soft"> (bạn)</span>}</p>
            {sub && <p className="truncate text-sm text-ink-soft">{sub}</p>}
          </div>
        );
      },
    },
    {
      header: "Vai trò",
      render: (u) => (
        <span className="flex flex-wrap gap-1">
          {u.roles.map((c) => <Tag key={c}>{roleLabel(c, roles?.find((r) => r.code === c)?.name)}</Tag>)}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      render: (u) => {
        const s = STATUSES[u.status];
        return <Tag tone={s?.tone}>{s?.label ?? u.status}</Tag>;
      },
    },
    { header: "Đăng nhập gần nhất", numeric: true, render: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt) : <Dash />) },
    {
      header: "Thao tác",
      render: (u) => (
        <span className="flex gap-4 whitespace-nowrap">
          <TextAction disabled={!roles} aria-label={`Đổi vai trò ${displayName(u)}`} onClick={() => setRoleTarget(u)}>
            Vai trò
          </TextAction>
          {u.status === "ACTIVE" && u.id !== selfId && (
            <TextAction danger aria-label={`Khóa ${displayName(u)}`} onClick={() => setLockTarget(u)}>Khóa</TextAction>
          )}
          {u.status === "LOCKED" && (
            <TextAction disabled={row.busy} aria-label={`Mở khóa ${displayName(u)}`} onClick={() => unlock(u)}>Mở khóa</TextAction>
          )}
        </span>
      ),
    },
  ];

  const first = (data?.page ?? 0) * PAGE_SIZE;
  const last = Math.min(first + (data?.items.length ?? 0), data?.total ?? 0);

  return (
    <div>
      <form role="search" aria-label="Lọc tài khoản" onSubmit={(e) => e.preventDefault()} className="rise mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Tìm tài khoản"
          placeholder="Tìm theo tên, email, số điện thoại"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${INPUT} w-full sm:w-72`}
        />
        <select aria-label="Lọc theo vai trò" value={role} onChange={filter(setRole)} className={INPUT}>
          <option value="">Tất cả vai trò</option>
          {roles?.map((r) => <option key={r.code} value={r.code}>{roleLabel(r.code, r.name)}</option>)}
        </select>
        <select aria-label="Lọc theo trạng thái" value={status} onChange={filter(setStatus)} className={INPUT}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUSES).map(([code, s]) => <option key={code} value={code}>{s.label}</option>)}
        </select>
        {data && <p className="ml-auto text-sm text-ink-soft tabular-nums">{data.total} tài khoản</p>}
      </form>

      <div className="mb-3"><Notice>{row.error}</Notice></div>
      <DataTable
        rows={data?.items}
        columns={columns}
        rowKey={(u) => u.id}
        loading={loading}
        error={error}
        empty={filtered ? "Không có tài khoản nào khớp bộ lọc." : "Chưa có tài khoản nào."}
      />

      {data && data.total > PAGE_SIZE && (
        <nav aria-label="Phân trang" className="mt-4 flex items-center justify-end gap-3 text-sm">
          <span className="text-ink-soft tabular-nums">{first + 1}–{last} / {data.total}</span>
          <button type="button" className={BTN.secondary} disabled={page === 0} onClick={() => setPage(page - 1)}>Trước</button>
          <button type="button" className={BTN.secondary} disabled={last >= data.total} onClick={() => setPage(page + 1)}>Sau</button>
        </nav>
      )}

      {lockTarget && <LockDialog user={lockTarget} onClose={() => setLockTarget(undefined)} onDone={done} />}
      {roleTarget && roles && (
        <RolesDialog user={roleTarget} roles={roles} isSelf={roleTarget.id === selfId} onClose={() => setRoleTarget(undefined)} onDone={done} />
      )}
    </div>
  );
}
