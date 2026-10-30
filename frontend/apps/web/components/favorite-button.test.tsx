import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FavoriteButton } from "./favorite-button";

describe("FavoriteButton", () => {
  it("toggles saved state and bursts only when saving", async () => {
    const user = userEvent.setup();
    const { container } = render(<FavoriteButton label="Nhà Mây" />);
    const button = screen.getByRole("button", { name: "Lưu Nhà Mây" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Bỏ lưu Nhà Mây" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll("[style*='--a']")).toHaveLength(6);

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll("[style*='--a']")).toHaveLength(0);
  });
});
