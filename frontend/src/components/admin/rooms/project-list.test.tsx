import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectList } from "./project-list";
import { fail, mockApi, project } from "./test-utils";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const page = (items: unknown[], total = items.length) => ({ items, page: 0, size: 20, total });

describe("ProjectList", () => {
  it("lists projects with their vacancy and lowest price", async () => {
    mockApi({ "GET projects": page([project(), project({ id: "p2", name: "Nhà Hoa Lan", code: "PRJ-zzz", status: "hidden", vacantCount: 0, totalRooms: 4, minPrice: null })]) });
    render(<ProjectList />);
    expect(await screen.findByRole("link", { name: "Căn hộ Sao Mai" })).toBeTruthy();
    expect(screen.getByText("3 / 12")).toBeTruthy();
    expect(screen.getByText("0 / 4")).toBeTruthy();
    expect(within(screen.getByRole("table")).getByText("Đang ẩn")).toBeTruthy();
    expect(screen.getByText("1–2 trên 2 dự án")).toBeTruthy();
  });

  it("keeps the frame and says so when there are no projects", async () => {
    mockApi({ "GET projects": page([]) });
    render(<ProjectList />);
    expect(await screen.findByText(/Chưa có dự án nào/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Phòng và dự án" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Dự án" })).toBeTruthy();
  });

  it("shows the failure and retries", async () => {
    mockApi({ "GET projects": fail(500) });
    render(<ProjectList />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });

  it("asks the server for the chosen status", async () => {
    const calls = mockApi({ "GET projects": page([]) });
    render(<ProjectList />);
    await screen.findByText(/Chưa có dự án nào/);
    await userEvent.selectOptions(screen.getByLabelText("Trạng thái"), "closed");
    await waitFor(() => expect(calls.at(-1)?.url).toContain("status=closed"));
    expect(await screen.findByText("Không có dự án nào khớp bộ lọc.")).toBeTruthy();
  });
});
