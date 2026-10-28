"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/parts";
import { useAdminQuery } from "@/lib/admin-api";
import { api, Me } from "@/lib/api";
import { AccountsView } from "./accounts-view";
import { RoleRow } from "./model";
import { RolesView } from "./roles-view";

const TABS = [
  ["accounts", "Tài khoản"],
  ["roles", "Vai trò và quyền"],
] as const;

export function UsersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("accounts");
  const [selfId, setSelfId] = useState<string>();
  const rolesQuery = useAdminQuery<RoleRow[]>("roles");

  // Used to keep an admin from locking or demoting their own account; the server refuses too.
  useEffect(() => {
    api<Me>("me").then((m) => setSelfId(m.id)).catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader title="Người dùng và phân quyền" />
      <div role="tablist" aria-label="Chế độ xem" className="mb-6 flex gap-6 border-b border-line">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`-mb-px h-11 border-b-2 text-[0.9375rem] transition-colors duration-200 ${tab === id ? "border-gold-deep font-semibold" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Both panels stay mounted so unsaved matrix edits survive a tab switch. */}
      <section role="tabpanel" id="panel-accounts" aria-labelledby="tab-accounts" hidden={tab !== "accounts"}>
        <AccountsView roles={rolesQuery.data} selfId={selfId} />
      </section>
      <section role="tabpanel" id="panel-roles" aria-labelledby="tab-roles" hidden={tab !== "roles"}>
        <RolesView rolesQuery={rolesQuery} />
      </section>
    </div>
  );
}
