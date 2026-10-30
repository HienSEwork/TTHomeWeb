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

  it("lists every district of Can Tho when the area field opens", () => {
    renderHero();
    fireEvent.focus(screen.getByRole("combobox", { name: "Khu vực" }));
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(DISTRICTS.length);
    expect(DISTRICTS).toHaveLength(9);
    expect(options[0]).toHaveTextContent("Quận Ninh Kiều");
    expect(options[0]).toHaveTextContent("12 phòng trống");
  });

  it("searches a ward picked from the typed matches", () => {
    renderHero();
    const area = screen.getByRole("combobox", { name: "Khu vực" });
    fireEvent.change(area, { target: { value: "xuan khanh" } });
    fireEvent.click(screen.getByRole("option", { name: /Phường Xuân Khánh/ }));
    expect(area).toHaveValue("Phường Xuân Khánh, Quận Ninh Kiều");
    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));
    expect(push).toHaveBeenCalledWith(expect.stringMatching(/district=ninh-kieu.*ward=xuan-khanh|ward=xuan-khanh.*district=ninh-kieu/));
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
