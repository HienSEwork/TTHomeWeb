import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuditEntry, PageResponse } from "@/components/admin/insights/types";
import { AuditView } from "./audit-view";

const ACTOR = "11111111-2222-3333-4444-555555555555";
const entry: AuditEntry = {
  id: "e1",
  actorId: ACTOR,
  actorIp: "203.0.113.9",
  action: "PUT /api/v1/admin/rooms/{id}",
  entityType: "rooms",
  entityId: "r-7",
  createdAt: "2026-10-28T08:15:30Z",
};
const page = (items: AuditEntry[], total = items.length): PageResponse<AuditEntry> => ({ items, page: 0, size: 50, total });

const answer = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(body), { status }));
const urls = (m: ReturnType<typeof answer>) => m.mock.calls.map((c) => String(c[0]));

afterEach(() => vi.restoreAllMocks());

describe("AuditView", () => {
  it("lists who did what, with the actor short and the IP shown", async () => {
    const m = answer(page([entry, { ...entry, id: "e2", actorId: null, actorIp: null, entityType: null, entityId: null, action: "POST /api/v1/admin/x" }], 120));
    render(<AuditView />);
    expect(await screen.findByText("/api/v1/admin/rooms/{id}")).toBeTruthy();
    expect(screen.getByText("11111111")).toBeTruthy();
    expect(screen.getByText("203.0.113.9")).toBeTruthy();
    expect(screen.getByText("Trang 1 / 3, tổng 120 bản ghi")).toBeTruthy();
    expect(urls(m)[0]).toBe("/api/admin/audit-logs?page=0&size=50");
  });

  it("says plainly when nothing has been logged", async () => {
    answer(page([]));
    render(<AuditView />);
    expect(await screen.findByText("Chưa có hoạt động nào được ghi lại.")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Phân trang" })).toBeNull();
  });

  it("shows an error", async () => {
    answer({ code: "FORBIDDEN" }, 403);
    render(<AuditView />);
    expect((await screen.findByRole("alert")).textContent).toContain("không có quyền");
  });

  it("filters by text and by clicking an actor, then clears", async () => {
    const m = answer(page([entry]));
    render(<AuditView />);
    await screen.findByText("11111111");
    await userEvent.type(screen.getByLabelText("Thao tác chứa"), "PUT");
    await userEvent.click(screen.getByRole("button", { name: "Lọc" }));
    await screen.findByRole("button", { name: "Xóa lọc" });
    expect(urls(m).at(-1)).toBe("/api/admin/audit-logs?page=0&size=50&q=PUT");

    await userEvent.click(screen.getByRole("button", { name: "11111111" }));
    await vi.waitFor(() => expect(urls(m).at(-1)).toContain(`actorId=${ACTOR}`));

    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    await vi.waitFor(() => expect(urls(m).at(-1)).toBe("/api/admin/audit-logs?page=0&size=50"));
  });

  it("rejects an actor id that is not a UUID without asking the server", async () => {
    const m = answer(page([entry]));
    render(<AuditView />);
    await screen.findByText("11111111");
    const before = m.mock.calls.length;
    await userEvent.type(screen.getByLabelText("Mã người thực hiện"), "abc");
    expect((await screen.findByRole("alert")).textContent).toContain("UUID");
    expect((screen.getByRole("button", { name: "Lọc" }) as HTMLButtonElement).disabled).toBe(true);
    expect(m.mock.calls.length).toBe(before);
  });

  it("pages forward", async () => {
    const m = answer(page([entry], 120));
    render(<AuditView />);
    await screen.findByText("11111111");
    await userEvent.click(screen.getByRole("button", { name: "Sau" }));
    await vi.waitFor(() => expect(urls(m).at(-1)).toBe("/api/admin/audit-logs?page=1&size=50"));
  });
});
