"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { DataTable, PageHeader, Tag, type Column } from "@/components/admin/parts";
import { ActionButton, Dash, Pager, Select, TextInput, UnderlineTabs, useDebounced } from "@/components/admin/operations/controls";
import { useProjects, useStaff } from "@/components/admin/operations/directory";
import { dayEnd, dayStart, formatDate, formatTime, query } from "@/components/admin/operations/format";
import type { Page } from "@/components/admin/operations/types";
import { AppointmentPanel } from "./appointment-panel";
import { STATUS, STATUS_TABS, type Appointment } from "./model";

const SIZE = 20;

export function AppointmentsView() {
  const [status, setStatus] = useState("");
  const [staffId, setStaffId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDebounced(text.trim());
  const staff = useStaff();
  const projects = useProjects();

  const list = useAdminQuery<Page<Appointment>>(
    `booking/appointments?${query({
      status, staffId, projectId, q, page, size: SIZE,
      from: from ? dayStart(from) : "",
      to: to ? dayEnd(to) : "",
    })}`,
  );

  // Any filter change goes back to the first page.
  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(0);
  };
  const filtered = Boolean(status || staffId || projectId || from || to || q);
  const clear = () => {
    [setStatus, setStaffId, setProjectId, setFrom, setTo, setText].forEach((set) => set(""));
    setPage(0);
  };

  const columns: Column<Appointment>[] = [
    {
      header: "Khách",
      render: (a) => (
        <>
          <button type="button" onClick={() => setOpenId(a.id)} className="block max-w-64 truncate text-left font-semibold hover:underline">
            {a.contactName || "Khách chưa để lại tên"}
          </button>
          <span className="block text-sm text-ink-soft">
            <span className="font-mono">{a.code}</span>
            {a.contactPhone && <> · {a.contactPhone}</>}
          </span>
        </>
      ),
    },
    { header: "Dự án", render: (a) => projects.nameOf(a.projectId) },
    {
      header: "Giờ hẹn",
      numeric: true,
      render: (a) => (
        <>
          <span className="block">{formatDate(a.scheduledAt)}</span>
          <span className="block text-sm text-ink-soft">{formatTime(a.scheduledAt)} · {a.durationMin} phút</span>
        </>
      ),
    },
    { header: "Phụ trách", render: (a) => (a.staffId ? staff.nameOf(a.staffId) : <Dash />) },
    {
      header: "Trạng thái",
      render: (a) => <Tag tone={STATUS[a.status]?.tone}>{STATUS[a.status]?.label ?? a.status}</Tag>,
    },
  ];

  return (
    <>
      <PageHeader title="Lịch hẹn xem phòng" />
      <div className="rise" style={{ "--i": 1 } as React.CSSProperties}>
        <UnderlineTabs label="Trạng thái lịch hẹn" options={STATUS_TABS} value={status} onChange={filter(setStatus)} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TextInput label="Tìm theo tên, số điện thoại hoặc mã" type="search" placeholder="Tìm tên, số điện thoại, mã" value={text} onChange={(e) => { setText(e.target.value); setPage(0); }} className="w-64" />
          <Select label="Nhân viên phụ trách" value={staffId} onChange={filter(setStaffId)} options={staff.options} any="Mọi nhân viên" />
          <Select label="Dự án" value={projectId} onChange={filter(setProjectId)} options={projects.options} any="Mọi dự án" />
          <TextInput label="Từ ngày" type="date" value={from} max={to || undefined} onChange={(e) => filter(setFrom)(e.target.value)} />
          <span className="text-sm text-ink-soft" aria-hidden>đến</span>
          <TextInput label="Đến ngày" type="date" value={to} min={from || undefined} onChange={(e) => filter(setTo)(e.target.value)} />
          {filtered && <ActionButton onClick={clear}>Xóa bộ lọc</ActionButton>}
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          rows={list.data?.items}
          columns={columns}
          rowKey={(a) => a.id}
          loading={list.loading}
          error={list.error}
          empty={filtered ? "Không có lịch hẹn nào khớp bộ lọc." : "Chưa có lịch hẹn xem phòng nào."}
          onRowClick={(a) => setOpenId(a.id)}
        />
        {list.data && <Pager page={list.data.page} size={list.data.size} total={list.data.total} count={list.data.items.length} onPage={setPage} />}
      </div>

      {openId && (
        <AppointmentPanel
          key={openId}
          id={openId}
          staff={staff}
          projects={projects}
          onClose={() => setOpenId(null)}
          onChanged={list.reload}
        />
      )}
    </>
  );
}
