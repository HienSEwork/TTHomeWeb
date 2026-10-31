import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CITIES } from "@tthome/data";
import { LangProvider } from "@/lib/i18n/client";
import { HeroSearch } from "./hero-search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const renderHero = () =>
  render(
    <LangProvider lang="vi">
      <HeroSearch vacant={{ "ho-chi-minh": 40, "can-tho": 30, "can-tho/ninh-kieu": 12 }} />
    </LangProvider>,
  );

const canTho = CITIES.find((c) => c.slug === "can-tho")!;

describe("HeroSearch", () => {
  beforeEach(() => push.mockReset());

  it("offers the two cities, then only the wards of the chosen one", () => {
    renderHero();
    fireEvent.click(screen.getByRole("combobox", { name: /Thành phố/ }));
    const cities = screen.getAllByRole("option");
    expect(cities.map((o) => o.textContent)).toEqual([expect.stringContaining("Cả TP.HCM và Cần Thơ"), expect.stringContaining("TP. Hồ Chí Minh"), expect.stringContaining("TP. Cần Thơ")]);
    fireEvent.click(screen.getByRole("option", { name: /TP\. Cần Thơ/ }));

    fireEvent.click(screen.getByRole("combobox", { name: /Phường, xã/ }));
    const wards = screen.getAllByRole("option");
    expect(wards).toHaveLength(canTho.wards.length + 1);
    expect(wards[0]).toHaveTextContent("Toàn TP. Cần Thơ");
    // The ward with vacant rooms comes first.
    expect(wards[1]).toHaveTextContent("Phường Ninh Kiều");
    expect(wards[1]).toHaveTextContent("12 phòng trống");
  });

  it("searches the chosen ward and settles its city", () => {
    renderHero();
    fireEvent.click(screen.getByRole("combobox", { name: /Phường, xã/ }));
    fireEvent.click(screen.getByRole("option", { name: /Phường Ninh Kiều/ }));
    expect(screen.getByRole("combobox", { name: /Thành phố/ })).toHaveTextContent("TP. Cần Thơ");
    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));
    expect(push).toHaveBeenCalledWith(expect.stringContaining("city=can-tho&ward=ninh-kieu"));
  });

  it("picks a room type with the keyboard from the styled list", () => {
    renderHero();
    const type = screen.getByRole("combobox", { name: /Loại phòng/ });
    fireEvent.keyDown(type, { key: "ArrowDown" });
    expect(type).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(type, { key: "ArrowDown" });
    fireEvent.keyDown(type, { key: "Enter" });
    expect(type).toHaveAttribute("aria-expanded", "false");
    expect(type).toHaveTextContent("Phòng trọ");
  });
});
