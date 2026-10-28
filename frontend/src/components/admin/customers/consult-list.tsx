"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { DataTable, Tag, type Column } from "@/components/admin/parts";
import { ActionButton, Dash, Pager, Select, TextInput, UnderlineTabs, useDebounced } from "@/components/admin/operations/controls";
import { formatDate, money, query } from "@/components/admin/operations/format";
import type { Option, Page } from "@/components/admin/operations/types";
import { ConsultPanel } from "./consult-panel";
import { CONSULT_STATUS, toOptions, type ConsultRequest } from "./model";

const SIZE = 20;
const STATUS_TABS = [{ value: "", label: "Tất cả" }, ...toOptions(CONSULT_STATUS)];

export function ConsultList({ staff, onOpenCustomer }: {
  staff: { options: Option[]; nameOf: (id?: string | null) => string };
  onOpenCustomer: (customerId: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignee] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(text.trim());

  const list = useAdminQuery<Page<ConsultRequest>>(`crm/consult-requests?${query({ status, assignedTo, q, page, size: SIZE })}`);

  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(0);
  };
  const filtered = Boolean(status || assignedTo || q);
  const clear = () => {
    [setStatus, setAssignee, setText].forEach((set) => set(""));
    setPage(0);
  };

  const columns: Column<ConsultRequest>[] = [
    {
      header: "Người gửi",
      render: (r) => (
        <>
          <button type="button" onClick={() => setOpenId(r.id)} className="block max-w-64 truncate text-left font-semibold hover:underline">
            {r.fullName}
          </button>
          <span className="block text-sm text-ink-soft tabular-nums">{r.phone}</span>
        </>
      ),
    },
    { header: "Khu vực", render: (r) => r.areaText || <Dash /> },
    { header: "Ngân sách tối đa", numeric: true, render: (r) => money(r.budgetMax) },
    { header: "Dọn vào", numeric: true, render: (r) => formatDate(r.moveInDate) },
    { header: "Trạng thái", render: (r) => <Tag tone={CONSULT_STATUS[r.status]?.tone}>{CONSULT_STATUS[r.status]?.label ?? r.status}</Tag> },
    { header: "Phụ trách", render: (r) => (r.assignedTo ? staff.nameOf(r.assignedTo) : <Dash />) },
    { header: "Gửi lúc", numeric: true, render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <>
      <UnderlineTabs label="Trạng thái yêu cầu tư vấn" options={STATUS_TABS} value={status} onChange={filter(setStatus)} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TextInput label="Tìm theo tên hoặc số điện thoại" type="search" placeholder="Tìm tên, số điện thoại" value={text} onChange={(e) => { setText(e.target.value); setPage(0); }} className="w-64" />
        <Select label="Nhân viên phụ trách" value={assignedTo} onChange={filter(setAssignee)} options={staff.options} any="Mọi nhân viên" />
        {filtered && <ActionButton onClick={clear}>Xóa bộ lọc</ActionButton>}
      </div>
      <div className="mt-4">
        <DataTable
          rows={list.data?.items}
          columns={columns}
          rowKey={(r) => r.id}
          loading={list.loading}
          error={list.error}
          empty={filtered ? "Không có yêu cầu nào khớp bộ lọc." : "Chưa có yêu cầu tư vấn nào."}
          onRowClick={(r) => setOpenId(r.id)}
        />
        {list.data && <Pager page={list.data.page} size={list.data.size} total={list.data.total} count={list.data.items.length} onPage={setPage} />}
      </div>
      {openId && <ConsultPanel key={openId} id={openId} staff={staff} onClose={() => setOpenId(null)} onChanged={list.reload} onOpenCustomer={onOpenCustomer} />}
    </>
  );
}
