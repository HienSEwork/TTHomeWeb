import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogScreen } from "@/components/admin/catalog/catalog-screen";
import { ContentScreen } from "./content-screen";

type Reply = { status?: number; body?: unknown };
let routes: Record<string, Reply>;
const calls = () => (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit | undefined][];

beforeAll(() => {
  // jsdom has no modal dialog support.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
});

beforeEach(() => {
  routes = {};
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    const key = `${init?.method ?? "GET"} ${String(url).replace("/api/admin/", "")}`;
    const reply = routes[key] ?? { body: [] };
    const status = reply.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(reply.body ?? {}), { status });
  });
});

const tag = { id: "t1", locale: "vi", name: "Khuyến mãi", slug: "khuyen-mai" };

describe("ContentScreen", () => {
  it("lists the rows of the chosen tab", async () => {
    routes["GET cms/tags"] = { body: [tag] };
    render(<ContentScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Thẻ" }));
    expect(await screen.findByRole("button", { name: "Khuyến mãi" })).toBeTruthy();
    expect(screen.getByText("khuyen-mai")).toBeTruthy();
  });

  it("says plainly when a resource has no rows", async () => {
    render(<ContentScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Thẻ" }));
    expect(await screen.findByText(/Chưa có thẻ nào/)).toBeTruthy();
  });

  it("shows a retryable error inside the list", async () => {
    routes["GET cms/posts?page=0&size=20"] = { status: 500, body: { code: "UNKNOWN" } };
    render(<ContentScreen />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
    routes["GET cms/posts?page=0&size=20"] = { body: { items: [], page: 0, size: 20, total: 0 } };
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText(/Chưa có bài viết nào/)).toBeTruthy();
  });

  it("creates a post with the fields the backend expects", async () => {
    routes["GET cms/posts?page=0&size=20"] = { body: { items: [], page: 0, size: 20, total: 0 } };
    routes["POST cms/posts"] = { status: 201, body: {} };
    render(<ContentScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Thêm bài viết" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Tiêu đề"), "  Mẹo thuê phòng ");
    await userEvent.type(within(dialog).getByLabelText("Nội dung"), "Nội dung bài viết");
    await userEvent.click(within(dialog).getByRole("button", { name: "Thêm" }));

    await waitFor(() => expect(calls().some(([u, i]) => u === "/api/admin/cms/posts" && i?.method === "POST")).toBe(true));
    const post = calls().find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(String(post[1]?.body))).toEqual({
      locale: "vi",
      title: "Mẹo thuê phòng",
      slug: null,
      categoryId: null,
      authorName: null,
      excerpt: null,
      content: "Nội dung bài viết",
      coverUrl: null,
      status: "draft",
      publishedAt: null,
      tagIds: [],
    });
  });

  it("asks for confirmation before deleting", async () => {
    routes["GET cms/tags"] = { body: [tag] };
    routes["DELETE cms/tags/t1"] = { status: 204 };
    render(<ContentScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Thẻ" }));
    await userEvent.click(await screen.findByRole("button", { name: "Khuyến mãi" }));
    await userEvent.click(await screen.findByRole("button", { name: "Xóa thẻ" }));

    expect(screen.getByText(/Xóa thẻ “Khuyến mãi”\?/)).toBeTruthy();
    expect(calls().some(([, i]) => i?.method === "DELETE")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
    await waitFor(() => expect(calls().some(([u, i]) => u === "/api/admin/cms/tags/t1" && i?.method === "DELETE")).toBe(true));
  });
});

describe("CatalogScreen", () => {
  it("sends the immutable area fields only when creating", async () => {
    routes["GET catalog/areas?page=0&size=50"] = { body: { items: [], page: 0, size: 50, total: 0 } };
    routes["POST catalog/areas"] = { status: 201, body: {} };
    render(<CatalogScreen />);
    await userEvent.click(await screen.findByRole("button", { name: "Thêm khu vực" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Mã hành chính"), "79");
    await userEvent.selectOptions(within(dialog).getByLabelText("Cấp"), "1");
    await userEvent.selectOptions(within(dialog).getByLabelText("Phiên bản địa giới"), "post_2025");
    await userEvent.type(within(dialog).getByLabelText("Tên"), "Thành phố Hồ Chí Minh");
    await userEvent.type(within(dialog).getByLabelText("Đường dẫn"), "ho-chi-minh");
    await userEvent.click(within(dialog).getByRole("button", { name: "Thêm" }));

    await waitFor(() => expect(calls().some(([, i]) => i?.method === "POST")).toBe(true));
    const post = calls().find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(String(post[1]?.body))).toEqual({
      id: 79,
      level: 1,
      scheme: "post_2025",
      parentId: null,
      name: "Thành phố Hồ Chí Minh",
      slug: "ho-chi-minh",
      centerLat: null,
      centerLng: null,
    });
  });

  it("lists the fixed room types with readable names", async () => {
    routes["GET catalog/room-types"] = { body: ["studio", "1pn"] };
    render(<CatalogScreen />);
    await userEvent.click(screen.getByRole("tab", { name: "Loại phòng" }));
    expect(await screen.findByText("1 phòng ngủ")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Thêm/ })).toBeNull();
  });
});
