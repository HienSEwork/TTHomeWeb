import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { emitMapFocus } from "@/lib/map-focus";
import { ResultsLayout } from "./results-layout";

describe("ResultsLayout on small screens", () => {
  it("switches between the list and the full-screen map", async () => {
    window.scrollTo = () => {};
    const user = userEvent.setup();
    render(<ResultsLayout list={<p>the list</p>} map={<p>the map</p>} />);
    const list = screen.getByText("the list").parentElement!;
    const map = screen.getByText("the map").closest("aside")!;
    expect(map).toHaveClass("max-lg:hidden");
    expect(list).not.toHaveClass("max-lg:hidden");

    await user.click(screen.getByRole("button", { name: "Bản đồ" }));
    expect(screen.getByRole("button", { name: "Bản đồ" })).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveClass("max-lg:hidden");
    expect(map).not.toHaveClass("max-lg:hidden");
  });

  it("opens the map when a card asks to show its area", () => {
    window.scrollTo = () => {};
    window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    render(<ResultsLayout list={<p>the list</p>} map={<p>the map</p>} />);
    act(() => emitMapFocus({ id: "p1", kind: "select" }));
    expect(screen.getByRole("button", { name: "Bản đồ" })).toHaveAttribute("aria-pressed", "true");
  });
});
