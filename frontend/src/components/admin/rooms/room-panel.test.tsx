import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaPanel } from "./media-panel";
import { buildRoomBody } from "./room-editor";
import { RoomPanel } from "./room-panel";
import { mockApi, project, room } from "./test-utils";

describe("RoomPanel", () => {
  it("sends the new availability and reloads the project counters", async () => {
    const onChanged = vi.fn();
    const calls = mockApi({
      "GET projects/p1/rooms": { items: [room()], page: 0, size: 50, total: 1 },
      "PUT rooms/r1/availability": room({ status: "rented" }),
    });
    render(<RoomPanel project={project()} onChanged={onChanged} />);
    await userEvent.selectOptions(await screen.findByLabelText("Tình trạng phòng A101"), "rented");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.url).toBe("/api/admin/rooms/r1/availability");
    expect(put?.body).toEqual({ status: "rented" });
  });

  it("shows the rooms with the price right-aligned", async () => {
    mockApi({ "GET projects/p1/rooms": { items: [room()], page: 0, size: 50, total: 1 } });
    render(<RoomPanel project={project()} onChanged={vi.fn()} />);
    const price = await screen.findByText((t) => t.replace(/\D/g, "") === "4500000");
    expect(price.className).toContain("tabular-nums");
    expect(price.className).toContain("text-right");
  });
});

describe("buildRoomBody", () => {
  it("turns empty inputs into null and leaves the status out", () => {
    const form = new FormData();
    form.set("code", " A101 ");
    form.set("title", "Studio");
    form.set("roomType", "studio");
    form.set("price", "4500000");
    form.set("hasBalcony", "false");
    const body = buildRoomBody(form);
    expect(body).toMatchObject({ code: "A101", price: 4500000, floor: null, deposit: null, hasBalcony: false, hasWindow: null, promo: false });
    expect(body).not.toHaveProperty("status");
  });
});

describe("MediaPanel", () => {
  const link = (assetId: string, sortOrder: number, kind = "photo", cover = false) => ({ assetId, kind, sortOrder, cover });

  it("saves the new order and the chosen cover", async () => {
    const first = "11111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const second = "22222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const calls = mockApi({
      "GET rooms/r1/media": [link(first, 0, "photo", true), link(second, 1, "video")],
      "PUT rooms/r1/media": [],
    });
    render(<MediaPanel endpoint="rooms/r1/media" />);
    await userEvent.click(await screen.findByRole("button", { name: "Đưa tệp 22222222 lên" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu thứ tự" }));
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      items: [
        { assetId: second, kind: "video", cover: false },
        { assetId: first, kind: "photo", cover: true },
      ],
    });
  });

  it("keeps its frame when nothing is linked", async () => {
    mockApi({ "GET rooms/r1/media": [] });
    render(<MediaPanel endpoint="rooms/r1/media" />);
    expect(await screen.findByText("Chưa có hình ảnh hay video nào được gắn.")).toBeTruthy();
  });
});
