import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashboardData } from "@/components/admin/insights/types";
import { DashboardView } from "./dashboard-view";

const figures: DashboardData = {
  from: "2026-10-22T03:00:00Z",
  to: "2026-10-29T03:00:00Z",
  vacantRooms: 12,
  totalRooms: 40,
  upcomingAppointments: 6,
  appointmentsToConfirm: 3,
  newCustomers: 9,
  newConsultRequests: 4,
  pendingConsignments: 2,
  unavailable: [],
};

const answer = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe("DashboardView", () => {
  it("shows what is waiting and the headline figures", async () => {
    answer(figures);
    render(<DashboardView />);
    expect(await screen.findByText("Đang có 3 lịch hẹn chờ xác nhận và 2 yêu cầu ký gửi chờ duyệt.")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Tổng quan");
    expect(screen.getByText("trên 40 phòng")).toBeTruthy();
    expect(screen.getByText("30,0% số phòng đang trống.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Lịch hẹn chờ xác nhận/ }).getAttribute("href")).toBe("/admin/appointments");
  });

  it("prints zeros as zeros and says nothing is waiting", async () => {
    answer({ ...figures, appointmentsToConfirm: 0, pendingConsignments: 0, newCustomers: 0, vacantRooms: 0, totalRooms: 0 });
    render(<DashboardView />);
    expect(await screen.findByText("Không có việc nào đang chờ xử lý.")).toBeTruthy();
    expect(screen.getByText("Khách mới trong 7 ngày").parentElement?.textContent).toContain("0");
  });

  it("shows a dash, not zero, for a service that did not answer", async () => {
    answer({ ...figures, appointmentsToConfirm: null, upcomingAppointments: null, unavailable: ["booking"] });
    render(<DashboardView />);
    expect(await screen.findByText(/Chưa lấy được số liệu: lịch hẹn\./)).toBeTruthy();
    expect(screen.getByLabelText("Lịch hẹn sắp tới: chưa có số liệu").textContent).toBe("—");
  });

  it("explains a failed load and retries", async () => {
    const fetchMock = answer({ code: "UNKNOWN" }, 500);
    render(<DashboardView />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(figures)));
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText(/Đang có 3 lịch hẹn/)).toBeTruthy();
  });

  it("asks for the chosen number of days", async () => {
    const fetchMock = answer(figures);
    render(<DashboardView />);
    await screen.findByText(/Đang có 3 lịch hẹn/);
    await userEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    expect(await screen.findByText("Khách mới trong 30 ngày")).toBeTruthy();
    expect(fetchMock.mock.calls.map((c) => c[0])).toContain("/api/admin/dashboard?days=30");
  });
});
