import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ConsignmentsScreen } from "./consignments-screen";
import type { Submission } from "./model";

const submission = (over: Partial<Submission> = {}): Submission => ({
  id: "11111111-1111-1111-1111-111111111111",
  code: "KG-0001",
  landlordId: null,
  landlordName: "Nguyễn Văn An",
  landlordPhone: "0901234567",
  projectName: "Nhà trọ Bình Thạnh",
  addressText: "12 Nguyễn Gia Trí",
  wardId: 5,
  roomCount: 8,
  roomsJson: '[{"type":"Studio","area":25,"price":4500000}]',
  expectedPriceMin: 4500000,
  expectedPriceMax: 6000000,
  note: "Gần chợ",
  status: "submitted",
  reviewerId: null,
  rejectReason: null,
  createdAt: "2026-10-20T03:00:00Z",
  reviewLog: [],
  ...over,
});

const page = (items: Submission[], total = items.length) => ({ items, page: 0, size: 20, total });

type Call = { url: string; method: string; body?: string };
let calls: Call[];

function mockApi(routes: (url: string, method: string) => unknown, status = 200) {
  calls = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: init?.body as string | undefined });
    const body = routes(url, method);
    return new Response(body === undefined ? "" : JSON.stringify(body), { status });
  });
}

beforeAll(() => {
  // jsdom has no modal dialog support.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => vi.restoreAllMocks());

describe("ConsignmentsScreen", () => {
  it("opens on the waiting queue and lists the rows", async () => {
    mockApi(() => page([submission()]));
    render(<ConsignmentsScreen />);
    expect(await screen.findByText("KG-0001")).toBeTruthy();
    expect(calls[0].url).toBe("/api/admin/consignment/submissions?page=0&size=20&status=submitted");
    expect(screen.getByText("4.500.000 – 6.000.000 đ")).toBeTruthy();
    expect(screen.getByText("1–1 trên 1 hồ sơ")).toBeTruthy();
  });

  it("says plainly when nothing waits", async () => {
    mockApi(() => page([]));
    render(<ConsignmentsScreen />);
    expect(await screen.findByText("Không còn hồ sơ nào chờ duyệt.")).toBeTruthy();
  });

  it("shows an error in place of the table", async () => {
    mockApi(() => ({ code: "FORBIDDEN" }), 403);
    render(<ConsignmentsScreen />);
    expect((await screen.findByRole("alert")).textContent).toContain("không có quyền");
  });

  it("filters by status and by search text", async () => {
    mockApi(() => page([]));
    const user = userEvent.setup();
    render(<ConsignmentsScreen />);
    await screen.findByText("Không còn hồ sơ nào chờ duyệt.");
    await user.click(screen.getByRole("button", { name: "Từ chối" }));
    await waitFor(() => expect(calls.at(-1)?.url).toContain("status=rejected"));
    await user.click(screen.getByRole("button", { name: "Tất cả" }));
    await waitFor(() => expect(calls.at(-1)?.url).not.toContain("status="));
    await user.type(screen.getByRole("searchbox"), "An{Enter}");
    await waitFor(() => expect(calls.at(-1)?.url).toContain("q=An"));
  });

  async function openDetail(row: Submission) {
    mockApi((url, method) => {
      if (method === "PUT") return { ...row, status: "approved" };
      return url.includes(`/${row.id}`) ? row : page([row]);
    });
    const user = userEvent.setup();
    render(<ConsignmentsScreen />);
    await user.click(await screen.findByText(row.code));
    return { user, panel: await screen.findByRole("complementary", { name: "Chi tiết hồ sơ ký gửi" }) };
  }

  it("shows the detail with the rooms the landlord sent", async () => {
    const { panel } = await openDetail(submission());
    expect(await within(panel).findByText("Gần chợ")).toBeTruthy();
    expect(within(panel).getByText(/Loại: Studio/)).toBeTruthy();
    expect(within(panel).getByText("Chưa có lượt duyệt nào.")).toBeTruthy();
  });

  it("approves with an optional note", async () => {
    const { user, panel } = await openDetail(submission());
    await user.click(await within(panel).findByRole("button", { name: "Duyệt" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Duyệt hồ sơ" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    const put = calls.find((c) => c.method === "PUT")!;
    expect(put.url).toBe("/api/admin/consignment/submissions/11111111-1111-1111-1111-111111111111/review");
    expect(JSON.parse(put.body!)).toEqual({ decision: "approve" });
  });

  it("will not reject without a reason, then sends it", async () => {
    const { user, panel } = await openDetail(submission());
    await user.click(await within(panel).findByRole("button", { name: "Từ chối" }));
    const dialog = await screen.findByRole("dialog");
    const send = within(dialog).getByRole("button", { name: "Từ chối hồ sơ" }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    await user.type(within(dialog).getByLabelText("Lý do từ chối"), "  Thiếu giấy tờ  ");
    await user.click(send);
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(JSON.parse(calls.find((c) => c.method === "PUT")!.body!)).toEqual({ decision: "reject", note: "Thiếu giấy tờ" });
  });

  it("asks the landlord for more information with a note", async () => {
    const { user, panel } = await openDetail(submission());
    await user.click(await within(panel).findByRole("button", { name: "Yêu cầu bổ sung" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Thông tin còn thiếu"), "Ảnh sổ đỏ");
    await user.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(JSON.parse(calls.find((c) => c.method === "PUT")!.body!)).toEqual({ decision: "need_info", note: "Ảnh sổ đỏ" });
  });

  it("offers no decision on a submission that is already decided", async () => {
    const { panel } = await openDetail(submission({ status: "approved" }));
    await within(panel).findByText("Gần chợ");
    expect(within(panel).queryByRole("button", { name: "Duyệt" })).toBeNull();
  });
});
