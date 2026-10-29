"use client";

import { useState } from "react";
import { Check, Lock, LockOpen } from "lucide-react";
import { ROLES, USER_STATUS, USER_TYPE, USERS, type UserAccount, type UserType } from "@tthome/data";
import { Badge, Button, EmptyState } from "@tthome/ui";
import { Dialog, Tabs, Toast } from "@/components/interactive";
import { TableFrame, td, th, toolbarControl } from "@/components/page-parts";
import { matchesQuery } from "@/lib/filters";
import { fmt } from "@/lib/format";

type Tab = "users" | "roles";

export function UserBoard() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserAccount[]>(USERS);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<UserType | "">("");
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [confirmLock, setConfirmLock] = useState<UserAccount | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const visible = users.filter((u) => (!type || u.type === type) && matchesQuery(query, u.name, u.phone, u.email));

  function toggleLock(user: UserAccount) {
    const locked = user.status !== "locked";
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, status: locked ? "locked" : "active" } : u)));
    setToast(locked ? `Đã khóa ${user.name}` : `Đã mở khóa ${user.name}`);
    setConfirmLock(null);
  }

  function saveRoles() {
    if (!editing) return;
    setUsers((list) => list.map((u) => (u.id === editing.id ? { ...u, roles: draftRoles } : u)));
    setToast(`Đã cập nhật vai trò của ${editing.name}`);
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <Tabs
        label="Người dùng và vai trò"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "users", label: "Tài khoản", count: users.length },
          { value: "roles", label: "Vai trò và quyền", count: ROLES.length },
        ]}
      />

      {tab === "users" ? (
        <>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="user-q">
              Tìm tài khoản
            </label>
            <input id="user-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên, số điện thoại, email" className={`${toolbarControl} w-full sm:w-72`} />
            <label className="sr-only" htmlFor="user-type">
              Loại tài khoản
            </label>
            <select id="user-type" value={type} onChange={(e) => setType(e.target.value as UserType | "")} className={toolbarControl}>
              <option value="">Mọi loại tài khoản</option>
              {(Object.keys(USER_TYPE) as UserType[]).map((t) => (
                <option key={t} value={t}>
                  {USER_TYPE[t]}
                </option>
              ))}
            </select>
          </div>
          {visible.length ? (
            <TableFrame caption="Tài khoản">
              <thead>
                <tr>
                  <th className={th}>Tài khoản</th>
                  <th className={th}>Loại</th>
                  <th className={th}>Vai trò</th>
                  <th className={th}>Trạng thái</th>
                  <th className={th}>Đăng nhập gần nhất</th>
                  <th className={`${th} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className="hover:bg-wash/60">
                    <td className={td}>
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-xs text-muted">
                        <span className="tabular">{u.phone}</span>
                        {u.email ? `, ${u.email}` : ""}
                      </p>
                    </td>
                    <td className={`${td} text-ink-soft`}>{USER_TYPE[u.type]}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r}>{ROLES.find((x) => x.code === r)?.name ?? r}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className={td}>
                      <Badge tone={USER_STATUS[u.status].tone}>{USER_STATUS[u.status].label}</Badge>
                    </td>
                    <td className={`${td} text-muted tabular`}>{u.lastLoginAt ? fmt.dateTime(u.lastLoginAt) : "Chưa đăng nhập"}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(u);
                          setDraftRoles(u.roles);
                        }}
                      >
                        Vai trò
                      </Button>
                      {u.type !== "admin" ? (
                        <Button variant="ghost" size="sm" className={u.status === "locked" ? "text-shutter" : "text-danger"} onClick={() => (u.status === "locked" ? toggleLock(u) : setConfirmLock(u))}>
                          {u.status === "locked" ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
                          {u.status === "locked" ? "Mở khóa" : "Khóa"}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableFrame>
          ) : (
            <EmptyState title="Không tìm thấy tài khoản" description="Kiểm tra lại số điện thoại hoặc chọn Mọi loại tài khoản." />
          )}
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((r) => (
            <section key={r.code} className="rounded-card border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-bold text-ink">{r.name}</h2>
                <span className="text-sm text-muted tabular">{users.filter((u) => u.roles.includes(r.code)).length} người</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {r.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-shutter" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Vai trò của ${editing?.name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Button>
            <Button onClick={saveRoles} disabled={draftRoles.length === 0}>
              Lưu vai trò
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm text-muted">Mỗi tài khoản cần ít nhất một vai trò.</legend>
          {ROLES.map((r) => (
            <label key={r.code} className="flex items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-shutter has-[:checked]:bg-shutter-tint/40">
              <input
                type="checkbox"
                checked={draftRoles.includes(r.code)}
                onChange={(e) => setDraftRoles((d) => (e.target.checked ? [...d, r.code] : d.filter((x) => x !== r.code)))}
                className="mt-0.5 size-4 accent-shutter"
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{r.name}</span>
                <span className="block text-xs text-muted">{r.permissions.join(", ")}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Dialog>

      <Dialog
        open={confirmLock != null}
        onClose={() => setConfirmLock(null)}
        title={`Khóa tài khoản ${confirmLock?.name ?? ""}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLock(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={() => confirmLock && toggleLock(confirmLock)}>
              Khóa tài khoản
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Người này bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi bạn mở khóa.</p>
      </Dialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
