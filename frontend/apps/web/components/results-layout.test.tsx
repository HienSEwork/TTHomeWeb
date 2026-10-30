import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { emitMapFocus } from "@/lib/map-focus";
import { ResultsLayout } from "./results-layout";

function narrowScreen() {
  window.scrollTo = () => {};
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
}

describe("ResultsLayout on small screens", () => {
  beforeEach(narrowScreen);

  it("builds the map only when it is first opened, then switches between list and map", async () => {
    const user = userEvent.setup();
    render(<ResultsLayout list={<p>the list</p>} map={<p>the map</p>} />);
    const list = screen.getByText("the list").parentElement!;
    expect(screen.queryByText("the map")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bản đồ" }));
    expect(screen.getByRole("button", { name: "Bản đồ" })).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveClass("max-lg:hidden");
    expect(screen.getByText("the map").closest("aside")).not.toHaveClass("max-lg:hidden");

    await user.click(screen.getByRole("button", { name: "Danh sách" }));
    expect(list).not.toHaveClass("max-lg:hidden");
    // Stays mounted once built, so it keeps its position.
    expect(screen.getByText("the map").closest("aside")).toHaveClass("max-lg:hidden");
  });

  it("opens the map when a card asks to show its area", () => {
    render(<ResultsLayout list={<p>the list</p>} map={<p>the map</p>} />);
    act(() => emitMapFocus({ id: "p1", kind: "select" }));
    expect(screen.getByRole("button", { name: "Bản đồ" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("the map")).toBeInTheDocument();
  });
});

describe("ResultsLayout on wide screens", () => {
  beforeEach(() => {
    window.scrollTo = () => {};
    window.matchMedia = ((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  });

  it("resizes the map from the keyboard, hides it and widens it to the full page", async () => {
    const user = userEvent.setup();
    render(<ResultsLayout list={<p>the list</p>} map={<p>the map</p>} />);
    const handle = screen.getByRole("separator", { name: "Kéo để đổi độ rộng bản đồ" });
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    handle.focus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "50");

    await user.click(screen.getByRole("button", { name: "Thu gọn bản đồ" }));
    expect(screen.getByText("the map").closest("aside")).toHaveClass("lg:hidden");
    await user.click(screen.getByRole("button", { name: "Hiện bản đồ" }));
    expect(screen.getByText("the map").closest("aside")).not.toHaveClass("lg:hidden");

    await user.click(screen.getByRole("button", { name: "Mở rộng bản đồ toàn màn hình" }));
    expect(screen.getByText("the list").parentElement).toHaveClass("lg:hidden");
    await user.click(screen.getByRole("button", { name: "Thu nhỏ bản đồ" }));
    expect(screen.getByText("the list").parentElement).not.toHaveClass("lg:hidden");
  });
});
