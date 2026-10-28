import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fillDays, niceStep } from "@/components/admin/insights/format";
import type { ReportOverview } from "@/components/admin/insights/types";
import { periodProblem } from "./period";
import { ReportsView } from "./reports-view";

const overview: ReportOverview = {
  from: "2026-09-30T17:00:00Z",
  to: "2026-10-03T17:00:00Z",
  traffic: { visitors: 200, views: 640, viewsByDay: [{ day: "2026-10-01", count: 40 }, { day: "2026-10-03", count: 100 }], eventsByName: { view: 640, search: 120 } },
  appointments: { created: 10, createdByStatus: { pending: 4, confirmed: 6 }, upcomingOpen: 5, pendingConfirmation: 4 },
  bookingRate: 0.05,
  customers: { newCustomers: 12, bySource: { web: 9 }, byStage: { new: 7, lost: 1 }, newConsultRequests: 3, consultRequestsByStatus: { new: 3 } },
  inventory: { projects: 2, rooms: 30, vacant: 10, reserved: 5, rented: 14, hidden: 1 },
  projects: [{ id: "p1", name: "Tòa Sao Mai", totalRooms: 20, vacantCount: 4, occupancy: 0.8, minPrice: 3500000 }],
  unavailable: [],
};

const answer = (body: unknown, status = 200) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
    String(url).includes(".xlsx")
      ? new Response("xlsx-bytes", { headers: { "Content-Disposition": 'attachment; filename="report-2026-10-01_2026-10-03.xlsx"' } })
      : new Response(JSON.stringify(body), { status }),
  );

afterEach(() => vi.restoreAllMocks());

describe("ReportsView", () => {
  it("shows traffic, bookings, customers and rooms of the period", async () => {
    answer(overview);
    render(<ReportsView />);
    expect(await screen.findByText(/200 khách truy cập, 640 lượt xem, tỷ lệ đặt lịch 5,0%/)).toBeTruthy();
    expect(screen.getByRole("img", { name: "Lượt xem theo ngày, tổng 640" })).toBeTruthy();
    expect(screen.getByText("Tòa Sao Mai")).toBeTruthy();
    expect(screen.getByText("80,0%")).toBeTruthy();
    expect(screen.getByText("3.500.000 ₫")).toBeTruthy();
    expect(screen.getByText("Đã xác nhận")).toBeTruthy();
  });

  it("keeps the frame and says so when a period has no visitors or a service is down", async () => {
    answer({
      ...overview,
      traffic: { visitors: 0, views: 0, viewsByDay: [], eventsByName: {} },
      appointments: null,
      bookingRate: null,
      unavailable: ["booking"],
    });
    render(<ReportsView />);
    expect(await screen.findByText(/Chưa có khách truy cập trong kỳ này\./)).toBeTruthy();
    expect(screen.getByText("Chưa lấy được số liệu lịch hẹn.")).toBeTruthy();
    expect(screen.getByText("Chưa có dữ liệu trong kỳ này.")).toBeTruthy();
  });

  it("shows an error with a retry", async () => {
    answer({ code: "VALIDATION_ERROR" }, 400);
    render(<ReportsView />);
    expect((await screen.findByRole("alert")).textContent).toContain("Thông tin chưa hợp lệ");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("downloads the Excel file the server names", async () => {
    answer(overview);
    const createObjectURL = vi.fn(() => "blob:report");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<ReportsView />);
    await screen.findByText(/200 khách truy cập/);
    await userEvent.click(screen.getByRole("button", { name: "Tải file Excel" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalled();
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u.startsWith("/api/admin/reports/overview.xlsx?from="))).toBe(true);
  });

  it("refuses a period that ends before it starts without asking the server", async () => {
    const fetchMock = answer(overview);
    render(<ReportsView />);
    await screen.findByText(/200 khách truy cập/);
    const callsBefore = fetchMock.mock.calls.length;
    const from = screen.getByLabelText("Từ ngày");
    await userEvent.clear(from);
    await userEvent.type(from, "2999-01-01");
    expect((await screen.findByRole("alert")).textContent).toContain("trước ngày kết thúc");
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });
});

describe("report helpers", () => {
  it("fills days without views with zero over an exclusive end", () => {
    const days = fillDays([{ day: "2026-10-02", count: 5 }], "2026-10-01T00:00:00Z", "2026-10-04T00:00:00Z");
    expect(days).toEqual([
      { day: "2026-10-01", count: 0 },
      { day: "2026-10-02", count: 5 },
      { day: "2026-10-03", count: 0 },
    ]);
  });

  it("picks a scale whose top tick passes the maximum", () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(4)).toBe(2);
    expect(niceStep(99)).toBe(50);
  });

  it("limits the period like the API", () => {
    expect(periodProblem({ from: "2026-01-01", to: "2027-01-02" })).toContain("366");
    expect(periodProblem({ from: "2026-01-01", to: "2026-01-31" })).toBeNull();
  });
});
