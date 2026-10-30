import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ refresh: vi.fn() }) }));

describe("SiteHeader mobile menu", () => {
  it("closes on Escape and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    const toggle = screen.getByRole("button", { name: "Mở menu" });
    await user.click(toggle);
    expect(document.getElementById("menu-di-dong")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.getElementById("menu-di-dong")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByRole("button", { name: "Mở menu" })).toHaveFocus();
  });

  it("closes when the route changes", async () => {
    pathname = "/";
    const user = userEvent.setup();
    const { rerender } = render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(document.getElementById("menu-di-dong")).toBeInTheDocument();

    pathname = "/tim-kiem";
    rerender(<SiteHeader />);
    expect(document.getElementById("menu-di-dong")).not.toBeInTheDocument();
  });
});
