"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DISTRICTS, PROJECTS, ROOM_STATUS, ROOM_TYPE_LABEL, findDistrict, findWard, type RoomStatus } from "@tthome/data";
import { Badge, EmptyState, formatCount, formatPriceShort } from "@tthome/ui";
import { Tabs } from "@/components/interactive";
import { TableFrame, td, th, toolbarControl } from "@/components/page-parts";
import { matchesQuery } from "@/lib/filters";
import { fmt } from "@/lib/format";

type View = "projects" | "rooms";

export function ProjectsTable() {
  const [view, setView] = useState<View>("projects");
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState<RoomStatus | "">("");

  const projects = useMemo(
    () => PROJECTS.filter((p) => (!district || p.districtSlug === district) && matchesQuery(query, p.name, p.code, p.street)),
    [district, query],
  );
  const rooms = useMemo(
    () =>
      projects
        .flatMap((p) => p.rooms.map((r) => ({ room: r, project: p })))
        .filter(({ room, project }) => (!status || room.status === status) && (matchesQuery(query, project.name, project.code, project.street) || matchesQuery(query, room.code, room.name))),
    [projects, status, query],
  );

  return (
    <div className="space-y-4">
      <Tabs
        label="Xem theo"
        value={view}
        onChange={setView}
        tabs={[
          { value: "projects", label: "Dự án", count: projects.length },
          { value: "rooms", label: "Phòng", count: rooms.length },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="room-q">
          Tìm dự án hoặc mã phòng
        </label>
        <input id="room-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên dự án, mã PRJ, mã phòng" className={`${toolbarControl} w-full sm:w-72`} />
        <label className="sr-only" htmlFor="room-district">
          Khu vực
        </label>
        <select id="room-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={toolbarControl}>
          <option value="">Tất cả khu vực</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
        {view === "rooms" ? (
          <>
            <label className="sr-only" htmlFor="room-status">
              Trạng thái
            </label>
            <select id="room-status" value={status} onChange={(e) => setStatus(e.target.value as RoomStatus | "")} className={toolbarControl}>
              <option value="">Mọi trạng thái</option>
              {(Object.keys(ROOM_STATUS) as RoomStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ROOM_STATUS[s].label}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      {view === "projects" ? (
        projects.length ? (
          <TableFrame caption="Danh sách dự án">
            <thead>
              <tr>
                <th className={th}>Dự án</th>
                <th className={th}>Khu vực</th>
                <th className={`${th} text-right`}>Trống / tổng</th>
                <th className={`${th} text-right`}>Giá từ</th>
                <th className={th}>Hiển thị</th>
                <th className={`${th} text-right`}>Lượt xem</th>
                <th className={th}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const vacant = p.rooms.filter((r) => r.status === "available");
                const min = vacant.length ? Math.min(...vacant.map((r) => r.price)) : null;
                return (
                  <tr key={p.id} className="hover:bg-wash/60">
                    <td className={td}>
                      <Link href={`/phong/${p.code}`} className="flex items-center gap-3 font-semibold text-ink hover:text-shutter">
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-line">
                          <Image src={p.images[0]!} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span>
                          {p.name}
                          <span className="block text-xs font-normal text-muted tabular">PRJ-{p.code}</span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${td} text-ink-soft`}>
                      {findWard(p.districtSlug, p.wardSlug)?.name}
                      <span className="block text-xs text-muted">{findDistrict(p.districtSlug)?.name}</span>
                    </td>
                    <td className={`${td} text-right tabular`}>
                      <span className="font-semibold text-ink">{vacant.length}</span>
                      <span className="text-muted"> / {p.rooms.length}</span>
                    </td>
                    <td className={`${td} text-right tabular`}>{min ? formatPriceShort(min) : "Hết phòng"}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {p.exclusive ? <Badge tone="ink">Độc quyền</Badge> : null}
                        {p.promo ? <Badge tone="wall">Ưu đãi</Badge> : null}
                        {!p.exclusive && !p.promo ? <span className="text-muted">Thường</span> : null}
                      </div>
                    </td>
                    <td className={`${td} text-right tabular text-ink-soft`}>{formatCount(p.views)}</td>
                    <td className={`${td} text-muted tabular`}>{fmt.date(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableFrame>
        ) : (
          <EmptyState title="Không có dự án khớp bộ lọc" description="Thử bỏ bớt từ khóa hoặc chọn Tất cả khu vực." />
        )
      ) : rooms.length ? (
        <TableFrame caption="Danh sách phòng">
          <thead>
            <tr>
              <th className={th}>Mã phòng</th>
              <th className={th}>Dự án</th>
              <th className={th}>Loại</th>
              <th className={`${th} text-right`}>Diện tích</th>
              <th className={`${th} text-right`}>Giá thuê</th>
              <th className={th}>Trạng thái</th>
              <th className={th}>Trống từ</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(({ room, project }) => (
              <tr key={room.id} className="hover:bg-wash/60">
                <td className={`${td} font-semibold text-ink tabular`}>
                  {room.code}
                  <span className="block text-xs font-normal text-muted">{room.name}</span>
                </td>
                <td className={td}>
                  <Link href={`/phong/${project.code}`} className="text-ink-soft hover:text-shutter hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className={`${td} text-ink-soft`}>{ROOM_TYPE_LABEL[room.type]}</td>
                <td className={`${td} text-right tabular`}>{room.area} m²</td>
                <td className={`${td} text-right font-semibold tabular`}>{formatPriceShort(room.price)}</td>
                <td className={td}>
                  <Badge tone={ROOM_STATUS[room.status].tone}>{ROOM_STATUS[room.status].label}</Badge>
                </td>
                <td className={`${td} text-muted tabular`}>{fmt.date(room.availableFrom)}</td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      ) : (
        <EmptyState title="Không có phòng khớp bộ lọc" description="Thử chọn Mọi trạng thái hoặc xóa từ khóa." />
      )}
    </div>
  );
}
