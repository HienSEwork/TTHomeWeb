import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { callsTo, mockFetch, page } from "@/components/admin/operations/test-fetch";
import { CustomersView } from "./customers-view";

const customer = {
  id: "c1",
  userId: null,
  fullName: "Lê Minh Châu",
  phone: "0912345678",
  email: null,
  zalo: null,
  source: "zalo",
  stage: "new",
  lostReason: null,
  ownerUserId: null,
  referrerUserId: null,
  priority: 3,
  lastContactAt: null,
  nextFollowupAt: null,
  createdAt: "2026-10-01T08:00:00Z",
};

const request = {
  id: "r1",
  customerId: "c1",
  fullName: "Phạm Quốc Bảo",
  phone: "0988000111",
  areaText: "Quận 7",
  budgetMax: 5000000,
  moveInDate: "2026-11-15",
  message: "Cần phòng gần Lotte",
  channel: "web",
  status: "assigned",
  assignedTo: "s1",
  createdAt: "2026-10-20T08:00:00Z",
};

const common = [
  { match: /\/users\?role=ADMIN/, json: page([{ id: "s1", fullName: "Trần Thu", email: null, phone: null }]) },
  { match: /\/crm\/customers\?/, json: page([customer]) },
  { match: /\/crm\/customers\/c1$/, json: customer },
  { match: /\/crm\/customers\/c1\/interactions/, json: page([{ id: "i1", kind: "stage_change", direction: null, summary: "new -> contacted", actorId: "s1", createdAt: "2026-10-02T08:00:00Z" }]) },
  { match: /\/crm\/customers\/c1\/notes$/, json: [] },
  { match: /\/crm\/consult-requests\?/, json: page([request]) },
  { match: /\/crm\/consult-requests\/r1$/, json: request },
];

afterEach(() => vi.restoreAllMocks());

describe("CustomersView", () => {
  it("lists customers with their stage and source", async () => {
    mockFetch(common);
    render(<CustomersView />);
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Lê Minh Châu")).toBeTruthy();
    expect(within(table).getByText("Mới")).toBeTruthy();
    expect(within(table).getByText("Zalo")).toBeTruthy();
  });

  it("says so when there are no customers", async () => {
    mockFetch([]);
    render(<CustomersView />);
    expect(await screen.findByText("Chưa có khách hàng nào.")).toBeTruthy();
  });

  it("shows an error when the list cannot load", async () => {
    mockFetch([{ match: /\/crm\/customers\?/, status: 500, json: { code: "UNKNOWN" } }]);
    render(<CustomersView />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
  });

  it("filters by stage on the server", async () => {
    const spy = mockFetch(common);
    render(<CustomersView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Đã đặt cọc" }));
    expect(callsTo(spy, "GET", /crm\/customers\?.*stage=deposited/).length).toBeGreaterThan(0);
  });

  it("needs a reason to mark a customer lost", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/c1\/stage$/, json: { ...customer, stage: "lost" } }, ...common]);
    render(<CustomersView />);
    await userEvent.click(await screen.findByRole("button", { name: "Lê Minh Châu" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Mới → Đã liên hệ")).toBeTruthy();
    await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "Giai đoạn mới" }), "lost");
    const update = within(dialog).getByRole("button", { name: "Cập nhật giai đoạn" });
    expect((update as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(within(dialog).getByLabelText("Lý do mất khách"), "Đã thuê chỗ khác");
    await userEvent.click(update);
    const [put] = callsTo(spy, "PUT", /\/c1\/stage$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ stage: "lost", lostReason: "Đã thuê chỗ khác" });
  });

  it("logs an interaction", async () => {
    const spy = mockFetch([{ method: "POST", match: /\/c1\/interactions$/, status: 201, json: {} }, ...common]);
    render(<CustomersView />);
    await userEvent.click(await screen.findByRole("button", { name: "Lê Minh Châu" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(await within(dialog).findByLabelText("Nội dung tương tác"), "Hẹn xem phòng thứ bảy");
    await userEvent.click(within(dialog).getByRole("button", { name: "Ghi tương tác" }));
    const [post] = callsTo(spy, "POST", /\/c1\/interactions$/);
    expect(JSON.parse(String(post[1]?.body))).toEqual({ kind: "call", direction: null, summary: "Hẹn xem phòng thứ bảy" });
  });
});

describe("consult requests", () => {
  const openRequest = async () => {
    render(<CustomersView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Yêu cầu tư vấn" }));
    await userEvent.click(await screen.findByRole("button", { name: "Phạm Quốc Bảo" }));
    return screen.findByRole("dialog");
  };

  it("lists the requests with budget and assignee", async () => {
    mockFetch(common);
    render(<CustomersView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Yêu cầu tư vấn" }));
    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Phạm Quốc Bảo")).toBeTruthy();
    expect(within(table).getByText("Đã giao")).toBeTruthy();
    expect(within(table).getByText("Trần Thu")).toBeTruthy();
  });

  it("marks a request as contacted", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/r1\/status$/, json: { ...request, status: "contacted" } }, ...common]);
    const dialog = await openRequest();
    await userEvent.click(await within(dialog).findByRole("button", { name: "Đã liên hệ" }));
    const [put] = callsTo(spy, "PUT", /\/r1\/status$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ status: "contacted" });
  });

  it("removes the assignee", async () => {
    const spy = mockFetch([{ method: "PUT", match: /\/r1\/assignee$/, json: { ...request, status: "new", assignedTo: null } }, ...common]);
    const dialog = await openRequest();
    await userEvent.selectOptions(await within(dialog).findByRole("combobox", { name: "Nhân viên phụ trách" }), "");
    const [put] = callsTo(spy, "PUT", /\/r1\/assignee$/);
    expect(JSON.parse(String(put[1]?.body))).toEqual({ userId: null });
  });
});
