import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetFavoritesCache } from "@/lib/favorites";
import { FavoriteButton } from "./favorite-button";

describe("FavoriteButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetFavoritesCache();
  });

  it("toggles saved state and bursts only when saving", async () => {
    const user = userEvent.setup();
    const { container } = render(<FavoriteButton favKey="room:r1" label="Nhà Mây" />);
    const button = screen.getByRole("button", { name: "Lưu Nhà Mây" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Bỏ lưu Nhà Mây" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll("[style*='--a']")).toHaveLength(6);

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll("[style*='--a']")).toHaveLength(0);
  });

  it("keeps the choice in this browser, shared by every heart for the same room", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FavoriteButton favKey="room:r1" label="A" />
        <FavoriteButton favKey="room:r1" label="B" />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Lưu A" }));
    expect(screen.getByRole("button", { name: "Bỏ lưu B" })).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(window.localStorage.getItem("tthome:favorites:v1")!)).toEqual(["room:r1"]);
  });
});
