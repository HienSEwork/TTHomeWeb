import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROJECTS } from "@tthome/data";
import { favoriteKey, resetFavoritesCache, toggleFavorite } from "@/lib/favorites";
import { LangProvider } from "@/lib/i18n/client";
import { FavoritesList } from "./favorites-list";
import { SiteHeader } from "./site-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const project = PROJECTS[0]!;
const room = project.rooms.find((r) => r.status !== "hidden")!;

describe("favourites without signing in", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetFavoritesCache();
  });

  it("counts hearted rooms on the header heart", () => {
    render(<SiteHeader />);
    const link = screen.getByRole("link", { name: "Yêu thích" });
    expect(link).toHaveAttribute("href", "/yeu-thich");
    act(() => {
      toggleFavorite(favoriteKey("room", room.id));
      toggleFavorite(favoriteKey("project", project.id));
    });
    expect(screen.getByRole("link", { name: "Yêu thích, 2 mục" })).toHaveTextContent("2");
  });

  it("lists the saved rooms and buildings, and clears them", async () => {
    const user = userEvent.setup();
    toggleFavorite(favoriteKey("room", room.id));
    toggleFavorite(favoriteKey("project", project.id));
    render(
      <LangProvider lang="vi">
        <FavoritesList />
      </LangProvider>,
    );
    expect(screen.getByRole("heading", { name: /Phòng \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Tòa nhà \(1\)/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Xóa tất cả" }));
    expect(screen.getByText("Chưa có phòng nào")).toBeInTheDocument();
  });
});
