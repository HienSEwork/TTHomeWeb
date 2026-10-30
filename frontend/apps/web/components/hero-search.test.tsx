import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DISTRICTS } from "@tthome/data";
import { LangProvider } from "@/lib/i18n/client";
import { HeroSearch } from "./hero-search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const renderHero = () =>
  render(
    <LangProvider lang="vi">
      <HeroSearch vacantByDistrict={{ "ninh-kieu": 12 }} />
    </LangProvider>,
  );

describe("HeroSearch", () => {
  beforeEach(() => push.mockReset());

  it("offers every district of Can Tho as a choice, not a text box", () => {
    renderHero();
    const area = screen.getByRole("combobox", { name: /Khu vực/ });
    expect(area.tagName).toBe("BUTTON");
    fireEvent.click(area);
    const options = screen.getAllByRole("option");
    expect(DISTRICTS).toHaveLength(9);
    expect(options).toHaveLength(DISTRICTS.length + 1);
    expect(options[0]).toHaveTextContent("Toàn TP. Cần Thơ");
    expect(options[1]).toHaveTextContent("Quận Ninh Kiều");
    expect(options[1]).toHaveTextContent("12 phòng trống");
  });

  it("searches the chosen district", () => {
    renderHero();
    fireEvent.click(screen.getByRole("combobox", { name: /Khu vực/ }));
    fireEvent.click(screen.getByRole("option", { name: /Quận Cái Răng/ }));
    expect(screen.getByRole("combobox", { name: /Khu vực/ })).toHaveTextContent("Quận Cái Răng");
    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));
    expect(push).toHaveBeenCalledWith(expect.stringContaining("district=cai-rang"));
  });

  it("picks a room type with the keyboard from the styled list", () => {
    renderHero();
    const type = screen.getByRole("combobox", { name: /Loại phòng/ });
    fireEvent.keyDown(type, { key: "ArrowDown" });
    expect(type).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(type, { key: "ArrowDown" });
    fireEvent.keyDown(type, { key: "Enter" });
    expect(type).toHaveAttribute("aria-expanded", "false");
    expect(type).toHaveTextContent("Studio");
  });
});
