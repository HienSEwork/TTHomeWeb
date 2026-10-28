"use client";

import Link from "next/link";
import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { PageHeader } from "@/components/admin/parts";
import { Notice } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { AmenityPanel } from "./amenity-panel";
import { ghostButton, options } from "./form-bits";
import { MediaPanel } from "./media-panel";
import { dong, PROJECT_STATUS, Project } from "./model";
import { ProjectForm } from "./project-form";
import { RoomPanel } from "./room-panel";
import { Tabs } from "./tabs";

type Tab = "rooms" | "info" | "amenities" | "media";

export function ProjectDetail({ id }: { id: string }) {
  const { data: project, error, reload } = useAdminQuery<Project>(`projects/${id}`);
  const [tab, setTab] = useState<Tab>("rooms");
  const [statusBusy, setStatusBusy] = useState(false);
  const [failure, setFailure] = useState<string>();

  if (error) {
    return (
      <div className="space-y-3">
        <Notice>{errorMessage(error)}</Notice>
        <div className="flex gap-3">
          <button type="button" onClick={reload} className={ghostButton}>Thử lại</button>
          <Link href="/admin/rooms" className={ghostButton}>Về danh sách</Link>
        </div>
      </div>
    );
  }
  if (!project) return <p className="py-6 text-ink-soft">Đang tải…</p>;

  async function setStatus(status: string) {
    setStatusBusy(true);
    setFailure(undefined);
    try {
      await adminApi(`projects/${id}/status`, { method: "PUT", body: { status } });
      reload();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <>
      <nav aria-label="Đường dẫn" className="rise mb-2 text-sm text-ink-soft">
        <Link href="/admin/rooms" className="hover:text-gold-deep hover:underline">Phòng và dự án</Link>
      </nav>
      <PageHeader title={project.name}>
        <label htmlFor="project-status" className="text-sm font-medium text-ink-soft">Trạng thái dự án</label>
        <select
          id="project-status"
          value={project.status}
          disabled={statusBusy}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-gold/60 bg-white px-3 text-base transition-colors duration-150 hover:bg-cream focus:border-gold-deep disabled:opacity-60"
        >
          {options(PROJECT_STATUS)}
        </select>
      </PageHeader>
      <p className="rise -mt-3 mb-5 text-ink-soft" style={{ "--i": 1 } as React.CSSProperties}>
        <span className="font-mono">{project.code}</span>
        {` · ${project.vacantCount} trống trên ${project.totalRooms} phòng`}
        {project.minPrice != null && ` · từ ${dong(project.minPrice)} ₫`}
      </p>
      <Notice>{failure}</Notice>

      <div className="rise mb-6" style={{ "--i": 2 } as React.CSSProperties}>
        <Tabs
          label="Các phần của dự án"
          value={tab}
          onChange={setTab}
          options={[["rooms", "Phòng"], ["info", "Thông tin hiển thị"], ["amenities", "Tiện nghi"], ["media", "Hình ảnh"]]}
        />
      </div>

      {tab === "rooms" && <RoomPanel project={project} onChanged={reload} />}
      {tab === "info" && <ProjectForm project={project} onSaved={reload} />}
      {tab === "amenities" && <AmenityPanel endpoint={`projects/${id}/amenities`} owner="project" selected={project.amenityIds} onSaved={reload} />}
      {tab === "media" && <MediaPanel endpoint={`projects/${id}/media`} />}
    </>
  );
}
