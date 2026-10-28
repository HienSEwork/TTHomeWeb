"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { DataTable, Tag, type Column } from "@/components/admin/parts";
import { ActionButton, Dash, Pager, Select, TextInput, UnderlineTabs, useDebounced } from "@/components/admin/operations/controls";
import { formatDate, query } from "@/components/admin/operations/format";
import type { Option, Page } from "@/components/admin/operations/types";
import { CustomerPanel } from "./customer-panel";
import { SOURCES, STAGES, toOptions, type Customer } from "./model";

const SIZE = 20;
const STAGE_TABS = [{ value: "", label: "Tất cả" }, ...toOptions(STAGES)];

export function CustomerList({ staff, openId, onOpen }: {
  staff: { options: Option[]; nameOf: (id?: string | null) => string };
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const [stage, setStage] = useState("");
  const [ownerUserId, setOwner] = useState("");
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const q = useDebounced(text.trim());

  const list = useAdminQuery<Page<Customer>>(`crm/customers?${query({ stage, ownerUserId, source, q, page, size: SIZE })}`);

  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(0);
  };
  const filtered = Boolean(stage || ownerUserId || source || q);
  const clear = () => {
    [setStage, setOwner, setSource, setText].forEach((set) => set(""));
    setPage(0);
  };
  const [now] = useState(() => Date.now());

  const columns: Column<Customer>[] = [
    {
      header: "Khách",
      render: (c) => (
        <>
          <button type="button" onClick={() => onOpen(c.id)} className="block max-w-64 truncate text-left font-semibold hover:underline">
            {c.fullName}
          </button>
          <span className="block text-sm text-ink-soft">{c.phone || c.email || "Chưa có liên hệ"}</span>
        </>
      ),
    },
    { header: "Nguồn", render: (c) => SOURCES[c.source] ?? c.source },
    { header: "Giai đoạn", render: (c) => <Tag tone={STAGES[c.stage]?.tone}>{STAGES[c.stage]?.label ?? c.stage}</Tag> },
    { header: "Phụ trách", render: (c) => (c.ownerUserId ? staff.nameOf(c.ownerUserId) : <Dash />) },
    { header: "Liên hệ gần nhất", numeric: true, render: (c) => formatDate(c.lastContactAt) },
    {
      header: "Hẹn theo dõi",
      numeric: true,
      render: (c) => {
        const overdue = c.nextFollowupAt && new Date(c.nextFollowupAt).getTime() < now && c.stage !== "lost" && c.stage !== "rented";
        return <span className={overdue ? "font-semibold text-danger" : ""}>{formatDate(c.nextFollowupAt)}</span>;
      },
    },
    { header: "Ưu tiên", numeric: true, render: (c) => c.priority },
  ];

  return (
    <>
      <UnderlineTabs label="Giai đoạn khách hàng" options={STAGE_TABS} value={stage} onChange={filter(setStage)} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TextInput label="Tìm theo tên, số điện thoại hoặc email" type="search" placeholder="Tìm tên, số điện thoại, email" value={text} onChange={(e) => { setText(e.target.value); setPage(0); }} className="w-64" />
        <Select label="Nhân viên phụ trách" value={ownerUserId} onChange={filter(setOwner)} options={staff.options} any="Mọi nhân viên" />
        <Select label="Nguồn khách" value={source} onChange={filter(setSource)} options={toOptions(SOURCES)} any="Mọi nguồn" />
        {filtered && <ActionButton onClick={clear}>Xóa bộ lọc</ActionButton>}
      </div>
      <div className="mt-4">
        <DataTable
          rows={list.data?.items}
          columns={columns}
          rowKey={(c) => c.id}
          loading={list.loading}
          error={list.error}
          empty={filtered ? "Không có khách nào khớp bộ lọc." : "Chưa có khách hàng nào."}
          onRowClick={(c) => onOpen(c.id)}
        />
        {list.data && <Pager page={list.data.page} size={list.data.size} total={list.data.total} count={list.data.items.length} onPage={setPage} />}
      </div>
      {openId && <CustomerPanel key={openId} id={openId} staff={staff} onClose={() => onOpen(null)} onChanged={list.reload} />}
    </>
  );
}
