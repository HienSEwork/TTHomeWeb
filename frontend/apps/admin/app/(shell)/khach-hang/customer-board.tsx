"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CONSULT_STATUS,
  CONSULTS,
  CUSTOMER_SOURCE,
  CUSTOMER_STAGE,
  CUSTOMERS,
  STAFF,
  staffName,
  type ConsultRequest,
  type CustomerSource,
  type CustomerStage,
} from "@tthome/data";
import { Badge, EmptyState, cn, formatPriceShort } from "@tthome/ui";
import { Tabs, Toast } from "@/components/interactive";
import { TableFrame, td, th, toolbarControl } from "@/components/page-parts";
import { countBy, matchesQuery } from "@/lib/filters";
import { fmt } from "@/lib/format";

type Tab = "customers" | "consults";
const STAGES = Object.keys(CUSTOMER_STAGE) as CustomerStage[];

export function CustomerBoard({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<CustomerStage | "">("");
  const [source, setSource] = useState<CustomerSource | "">("");
  const [consults, setConsults] = useState<ConsultRequest[]>(CONSULTS);
  const [toast, setToast] = useState<string | null>(null);

  const customers = CUSTOMERS.filter((c) => (!stage || c.stage === stage) && (!source || c.source === source) && matchesQuery(query, c.name, c.phone, c.email, c.wantedArea));
  const stageCounts = countBy(CUSTOMERS, STAGES, (c) => c.stage);
  const visibleConsults = consults.filter((c) => matchesQuery(query, c.name, c.phone, c.area));

  function assign(id: string, staffId: string) {
    setConsults((list) => list.map((c) => (c.id === id ? { ...c, staffId: staffId || null, status: staffId && c.status === "new" ? "assigned" : c.status } : c)));
    setToast(staffId ? `Đã giao cho ${staffName(staffId)}` : "Đã bỏ phân công");
  }

  return (
    <div className="space-y-4">
      <Tabs
        label="Danh sách"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "customers", label: "Khách hàng", count: CUSTOMERS.length },
          { value: "consults", label: "Yêu cầu tư vấn", count: consults.filter((c) => c.status === "new").length },
        ]}
      />

      {tab === "customers" ? (
        <ul className="flex flex-wrap gap-2" aria-label="Lọc theo giai đoạn">
          <li>
            <StageChip active={!stage} onClick={() => setStage("")} label="Tất cả" count={CUSTOMERS.length} />
          </li>
          {STAGES.map((s) => (
            <li key={s}>
              <StageChip active={stage === s} onClick={() => setStage(s)} label={CUSTOMER_STAGE[s].label} count={stageCounts[s]} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="cust-q">
          Tìm khách
        </label>
        <input id="cust-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên, số điện thoại, khu vực" className={`${toolbarControl} w-full sm:w-72`} />
        {tab === "customers" ? (
          <>
            <label className="sr-only" htmlFor="cust-source">
              Nguồn khách
            </label>
            <select id="cust-source" value={source} onChange={(e) => setSource(e.target.value as CustomerSource | "")} className={toolbarControl}>
              <option value="">Mọi nguồn</option>
              {(Object.keys(CUSTOMER_SOURCE) as CustomerSource[]).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_SOURCE[s]}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      {tab === "customers" ? (
        customers.length ? (
          <TableFrame caption="Danh sách khách hàng">
            <thead>
              <tr>
                <th className={th}>Khách</th>
                <th className={th}>Giai đoạn</th>
                <th className={th}>Nhu cầu</th>
                <th className={th}>Nguồn</th>
                <th className={th}>Phụ trách</th>
                <th className={th}>Liên hệ gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-wash/60">
                  <td className={td}>
                    <Link href={`/khach-hang/${c.id}`} className="font-semibold text-ink hover:text-shutter hover:underline">
                      {c.name}
                    </Link>
                    <span className="block text-xs text-muted tabular">{c.phone}</span>
                  </td>
                  <td className={td}>
                    <Badge tone={CUSTOMER_STAGE[c.stage].tone}>{CUSTOMER_STAGE[c.stage].label}</Badge>
                  </td>
                  <td className={`${td} text-ink-soft`}>
                    {c.wantedArea}
                    <span className="block text-xs text-muted">Dưới {formatPriceShort(c.budgetMax)}, dọn vào {fmt.date(c.moveIn)}</span>
                  </td>
                  <td className={`${td} text-ink-soft`}>{CUSTOMER_SOURCE[c.source]}</td>
                  <td className={td}>{staffName(c.staffId) ?? <span className="font-semibold text-warn">Chưa giao</span>}</td>
                  <td className={`${td} text-muted tabular`}>{fmt.dateTime(c.lastContactAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableFrame>
        ) : (
          <EmptyState title="Không có khách khớp bộ lọc" description="Chọn Tất cả hoặc Mọi nguồn để xem lại toàn bộ." />
        )
      ) : (
        <TableFrame caption="Yêu cầu tư vấn">
          <thead>
            <tr>
              <th className={th}>Người gửi</th>
              <th className={th}>Nhu cầu</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Giao cho</th>
              <th className={th}>Gửi lúc</th>
            </tr>
          </thead>
          <tbody>
            {visibleConsults.map((c) => (
              <tr key={c.id} className={cn("hover:bg-wash/60", c.status === "spam" && "opacity-60")}>
                <td className={td}>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-xs text-shutter tabular hover:underline">
                    {c.phone}
                  </a>
                </td>
                <td className={`${td} max-w-sm text-ink-soft`}>
                  {[c.area, c.budget, c.moveIn && `dọn vào ${c.moveIn.toLowerCase()}`].filter(Boolean).join(", ") || "Không ghi"}
                  {c.note ? <span className="block text-xs text-muted">{c.note}</span> : null}
                </td>
                <td className={td}>
                  <Badge tone={CONSULT_STATUS[c.status].tone}>{CONSULT_STATUS[c.status].label}</Badge>
                </td>
                <td className={td}>
                  <label className="sr-only" htmlFor={`assign-${c.id}`}>
                    Giao yêu cầu của {c.name}
                  </label>
                  <select id={`assign-${c.id}`} value={c.staffId ?? ""} onChange={(e) => assign(c.id, e.target.value)} className={`${toolbarControl} w-44`} disabled={c.status === "spam"}>
                    <option value="">Chưa giao</option>
                    {STAFF.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`${td} text-muted tabular`}>{fmt.dateTime(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function StageChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-soft hover:border-ink/40",
      )}
    >
      {label}
      <span className={cn("tabular text-xs", active ? "text-white/70" : "text-muted")}>{count}</span>
    </button>
  );
}
