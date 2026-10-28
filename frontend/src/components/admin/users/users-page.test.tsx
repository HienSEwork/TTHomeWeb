import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UsersPage } from "./users-page";

type Reply = { status?: number; body?: unknown };
type Call = { method: string; url: string; body?: unknown };

let calls: Call[];

// Keys are "METHOD /url-prefix" or just "/url-prefix" for any method; the longest match wins.
function serve(table: Record<string, Reply>) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const key = Object.keys(table)
      .filter((k) => `${method} ${url}`.startsWith(k) || url.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    const reply = key ? table[key] : { status: 404, body: { code: "NOT_FOUND" } };
    return new Response(reply.status === 204 || reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status ?? 200,
    });
  });
}

const ROLES = [
  { code: "TENANT", name: "Tenant", permissions: [] },
  { code: "CONSULTANT", name: "Consultant", permissions: ["dashboard.view"] },
  { code: "ADMIN", name: "Admin", permissions: ["dashboard.view", "report.view"] },
];
const PERMISSIONS = [
  { code: "dashboard.view", description: "View the admin dashboard" },
  { code: "report.view", description: "View reports and statistics" },
];
const user = (over: object) => ({
  id: "u1", phone: "0901234567", email: "an@example.com", fullName: "Nguyễn An", userType: "TENANT", status: "ACTIVE",
  roles: ["TENANT"], phoneVerified: true, emailVerified: false, lastLoginAt: null, lockedUntil: null,
  createdAt: "2026-01-01T00:00:00Z", ...over,
});
const page = (items: object[]) => ({ items, page: 0, size: 20, total: items.length });
const base = {
  "/api/auth/me": { body: { id: "admin-1", roles: ["ADMIN"] } },
  "/api/admin/roles": { body: ROLES },
  "/api/admin/permissions": { body: PERMISSIONS },
};

beforeAll(() => {
  // jsdom has no modal dialog support.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});
beforeEach(() => {
  calls = [];
  vi.restoreAllMocks();
});

describe("accounts", () => {
  it("lists accounts with role and status labels", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({}), user({ id: "u2", fullName: null, email: "b@x.vn", phone: null, status: "LOCKED", roles: ["AGENT", "ADMIN"] })]) } });
    render(<UsersPage />);
    expect(await screen.findByText("Nguyễn An")).toBeTruthy();
    const table = within(screen.getByRole("table"));
    expect(table.getByText("Khách thuê")).toBeTruthy();
    expect(table.getByText("Hoạt động")).toBeTruthy();
    expect(table.getByText("Đã khóa")).toBeTruthy();
    expect(table.getByText("Môi giới / CTV")).toBeTruthy();
    expect(screen.getByText("2 tài khoản")).toBeTruthy();
    expect(calls.some((c) => c.url === "/api/admin/users?page=0&size=20")).toBe(true);
  });

  it("says so when there are no accounts", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([]) } });
    render(<UsersPage />);
    expect(await screen.findByText("Chưa có tài khoản nào.")).toBeTruthy();
  });

  it("shows the mapped error when the list fails", async () => {
    serve({ ...base, "/api/admin/users?": { status: 403, body: { code: "FORBIDDEN" } } });
    render(<UsersPage />);
    expect((await screen.findByRole("alert")).textContent).toContain("không có quyền");
  });

  it("filters by status through the query string", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({})]) } });
    render(<UsersPage />);
    await screen.findByText("Nguyễn An");
    await userEvent.selectOptions(screen.getByLabelText("Lọc theo trạng thái"), "LOCKED");
    await waitFor(() => expect(calls.some((c) => c.url === "/api/admin/users?page=0&size=20&status=LOCKED")).toBe(true));
  });

  it("locks an account after confirmation", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({})]) }, "POST /api/admin/users/u1/lock": { status: 204 } });
    render(<UsersPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Khóa Nguyễn An" }));
    await userEvent.click(await screen.findByRole("button", { name: "Khóa tài khoản" }));
    await waitFor(() => expect(calls).toContainEqual({ method: "POST", url: "/api/admin/users/u1/lock", body: undefined }));
  });

  it("explains a conflict when locking fails", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({})]) }, "POST /api/admin/users/u1/lock": { status: 409, body: { code: "CONFLICT" } } });
    render(<UsersPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Khóa Nguyễn An" }));
    await userEvent.click(await screen.findByRole("button", { name: "Khóa tài khoản" }));
    expect((await screen.findByRole("alert")).textContent).toContain("không cho phép thao tác");
  });

  it("unlocks a locked account", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({ status: "LOCKED" })]) }, "POST /api/admin/users/u1/unlock": { status: 204 } });
    render(<UsersPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Mở khóa Nguyễn An" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url === "/api/admin/users/u1/unlock")).toBe(true));
  });

  it("does not offer to lock the signed-in admin", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({ id: "admin-1", fullName: "Quản trị", roles: ["ADMIN"] })]) } });
    render(<UsersPage />);
    await screen.findByText("Quản trị");
    await screen.findByText("(bạn)");
    expect(screen.queryByRole("button", { name: /^Khóa / })).toBeNull();
  });

  it("sends the chosen roles in server order", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({})]) }, "PUT /api/admin/users/u1/roles": { status: 204 } });
    render(<UsersPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Đổi vai trò Nguyễn An" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Nhân viên tư vấn" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu vai trò" }));
    await waitFor(() =>
      expect(calls).toContainEqual({ method: "PUT", url: "/api/admin/users/u1/roles", body: { roles: ["TENANT", "CONSULTANT"] } }),
    );
  });

  it("keeps the ADMIN role fixed on the signed-in admin", async () => {
    serve({ ...base, "/api/admin/users?": { body: page([user({ id: "admin-1", fullName: "Quản trị", roles: ["ADMIN"] })]) } });
    render(<UsersPage />);
    await screen.findByText("(bạn)");
    await userEvent.click(screen.getByRole("button", { name: "Đổi vai trò Quản trị" }));
    const dialog = await screen.findByRole("dialog");
    expect((within(dialog).getByRole("checkbox", { name: /Quản trị viên/ }) as HTMLInputElement).disabled).toBe(true);
  });
});

describe("roles and permissions", () => {
  const open = async () => {
    serve({ ...base, "/api/admin/users?": { body: page([]) }, "PUT /api/admin/roles/CONSULTANT/permissions": { body: {} } });
    render(<UsersPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Vai trò và quyền" }));
  };

  it("renders the matrix and keeps the ADMIN column read-only", async () => {
    await open();
    const admin = await screen.findByRole("checkbox", { name: "Quản trị viên: Xem tổng quan" });
    expect((admin as HTMLInputElement).disabled).toBe(true);
    expect((admin as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("button", { name: "Lưu thay đổi" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves only the roles that changed", async () => {
    await open();
    await userEvent.click(await screen.findByRole("checkbox", { name: "Nhân viên tư vấn: Xem báo cáo" }));
    expect(screen.getByRole("status").textContent).toContain("1 vai trò có thay đổi");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() =>
      expect(calls).toContainEqual({
        method: "PUT",
        url: "/api/admin/roles/CONSULTANT/permissions",
        body: { permissions: ["dashboard.view", "report.view"] },
      }),
    );
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(1);
  });

  it("discards edits on undo", async () => {
    await open();
    const box = (await screen.findByRole("checkbox", { name: "Khách thuê: Xem báo cáo" })) as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(box.checked).toBe(false);
  });
});
