import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminShell } from "./admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
  useRouter: () => ({ replace: vi.fn() }),
}));

const asUser = (roles: string[]) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify({ id: "1", fullName: "An", roles })));

describe("AdminShell", () => {
  it("shows the page and marks the current nav item for staff", async () => {
    asUser(["CONSULTANT"]);
    render(<AdminShell><p>content</p></AdminShell>);
    expect(await screen.findByText("content")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Người dùng và phân quyền" }).getAttribute("aria-current")).toBe("page");
  });

  it("refuses accounts without a staff role", async () => {
    asUser(["TENANT"]);
    render(<AdminShell><p>content</p></AdminShell>);
    expect((await screen.findByRole("alert")).textContent).toContain("không có quyền");
    expect(screen.queryByText("content")).toBeNull();
  });
});
