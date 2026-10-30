import { render, screen, waitFor } from "@testing-library/react";
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
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByRole("button", { name: "Mở menu" })).toHaveFocus();
    // The drawer slides out before it unmounts.
    await waitFor(() => expect(document.getElementById("menu-di-dong")).not.toBeInTheDocument());
  });

  it("renders the menu as a dialog outside the header, so nothing clips it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(container.contains(dialog)).toBe(false);
    expect(dialog).toContainElement(document.getElementById("menu-di-dong"));
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    const backdrop = screen.getByRole("dialog", { name: "Menu" }).previousElementSibling as HTMLElement;
    await user.click(backdrop);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("opens sign-in in a drawer from the menu", async () => {
    const user = userEvent.setup();
    render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    const inMenu = screen.getAllByRole("button", { name: "Đăng nhập" }).find((b) => screen.getByRole("dialog", { name: "Menu" }).contains(b))!;
    await user.click(inMenu);
    expect(await screen.findByRole("dialog", { name: "Đăng nhập hoặc tạo tài khoản" })).toBeInTheDocument();
    expect(screen.getByText("nguoidung@tthome.demo")).toBeInTheDocument();
  });

  it("closes when the route changes", async () => {
    pathname = "/";
    const user = userEvent.setup();
    const { rerender } = render(<SiteHeader />);
    await user.click(screen.getByRole("button", { name: "Mở menu" }));
    expect(document.getElementById("menu-di-dong")).toBeInTheDocument();

    pathname = "/tim-kiem";
    rerender(<SiteHeader />);
    await waitFor(() => expect(document.getElementById("menu-di-dong")).not.toBeInTheDocument());
  });
});
