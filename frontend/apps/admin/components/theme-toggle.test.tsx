import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeToggle } from "./theme-toggle";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("switches the theme on <html>, updates aria-pressed and remembers the choice", async () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Giao diện tối" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "true"));

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    await waitFor(() => expect(button).toHaveAttribute("aria-pressed", "false"));
  });

  it("starts pressed when the page already loaded dark", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Giao diện tối" })).toHaveAttribute("aria-pressed", "true");
  });
});
