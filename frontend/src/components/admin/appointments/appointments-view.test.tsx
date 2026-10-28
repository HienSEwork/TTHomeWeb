import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch, page } from "@/components/admin/operations/test-fetch";
import { AppointmentsView } from "./appointments-view";

const appointment = {
  id: "a1",
  code: "LH-0001",
  customerId: null,
  userId: null,
  projectId: "p1",
  roomId: null,
  mode: "in_person",
  scheduledAt: "2026-10-01T02:00:00Z", // already in the past, so completing is allowed
  durationMin: 30,
  status: "pending",
  staffId: null,
  contactName: "Nguyễn Văn An",
  contactPhone: "0901234567",
  note: null,
  cancelReason: null,
  createdAt: "2026-09-28T08:00:00Z",
  history: [{ fromStatus: "pending", toStatus: "pending", changedBy: "s1", note: "Staff assigned", createdAt: "2026-09-29T08:00:00Z" }],
};

const common = [
  { match: /\/users\?role=ADMIN/, json: page([{ id: "s1", fullName: "Trần Thu", email: null, phone: null }]) },
  { match: /\/projects\?/, json: page([{ id: "p1", name: "Nhà Mộc Quận 7" }]) },
  { match: /\/booking\/appointments\?/, json: page([appointment]) },
  { match: /\/booking\/appointments\/a1$/, json: appointment },
];

afterEach(() => vi.restoreAllMocks());

describe("AppointmentsView", () => {
  it("lists the appointments with project, staff and status", async () => {
    mockFetch(common);
    render(<AppointmentsView />);
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Nguyễn Văn An")).toBeTruthy();
    expect(within(table).getByText("Nhà Mộc Quận 7")).toBeTruthy();
    expect(within(table).getByText("Chờ xác nhận")).toBeTruthy();
    expect(screen.getByText("1–1 trên 1")).toBeTruthy();
  });

  it("says so when there are no appointments", async () => {
    mockFetch([]);
    render(<AppointmentsView />);
    expect(await screen.findByText("Chưa có lịch hẹn xem phòng nào.")).toBeTruthy();
  });

  it("shows an error when the list cannot load", async () => {
    mockFetch([{ match: /\/booking\/appointments\?/, status: 500, json: { code: "UNKNOWN" } }]);
    render(<AppointmentsView />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
  });

  it("asks the server for the chosen status", async () => {
    const spy = mockFetch(common);
    render(<AppointmentsView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Đã xác nhận" }));
    expect(callsTo(spy, "GET", /booking\/appointments\?.*status=confirmed/).length).toBeGreaterThan(0);
  });

  it("confirms an appointment from the panel", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/a1\/status$/, json: { ...appointment, status: "confirmed" } }, ...common]);
    render(<AppointmentsView />);
    await userEvent.click(await screen.findByRole("button", { name: "Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Đã phân công nhân viên")).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Xác nhận lịch" }));
    const [put] = callsTo(spy, "PUT", /\/a1\/status$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ status: "confirmed" });
  });

  it("needs a reason before cancelling", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/a1\/status$/, json: { ...appointment, status: "cancelled" } }, ...common]);
    render(<AppointmentsView />);
    await userEvent.click(await screen.findByRole("button", { name: "Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(await within(dialog).findByRole("button", { name: "Hủy lịch" }));
    const confirm = within(dialog).getByRole("button", { name: "Xác nhận hủy" });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(within(dialog).getByLabelText("Lý do hủy lịch"), "Khách bận");
    await userEvent.click(confirm);
    const [put] = callsTo(spy, "PUT", /\/a1\/status$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ status: "cancelled", reason: "Khách bận" });
  });

  it("assigns a staff member", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/a1\/staff$/, json: { ...appointment, staffId: "s1" } }, ...common]);
    render(<AppointmentsView />);
    await userEvent.click(await screen.findByRole("button", { name: "Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(await within(dialog).findByRole("combobox", { name: "Nhân viên phụ trách" }), "s1");
    const [put] = callsTo(spy, "PUT", /\/a1\/staff$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ staffId: "s1" });
  });
});
