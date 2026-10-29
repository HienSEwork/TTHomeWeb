import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { APPOINTMENTS, TODAY } from "@tthome/data";
import { AppointmentBoard } from "@/app/(shell)/lich-hen/appointment-board";
import { BarList, StackedBar } from "./bars";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));

describe("StackedBar", () => {
  it("labels every part with its count and share", () => {
    render(
      <StackedBar
        label="Tình trạng phòng"
        items={[
          { label: "Còn trống", value: 3, color: "#000" },
          { label: "Đã thuê", value: 1, color: "#111" },
        ]}
      />,
    );
    expect(screen.getByRole("img", { name: "Tình trạng phòng: Còn trống 3, Đã thuê 1" })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});

describe("BarList", () => {
  it("formats values as percentages when asked", () => {
    render(<BarList unit="percent" max={1} items={[{ label: "Nhà Mây", value: 0.5, hint: "3/6" }]} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("3/6")).toBeInTheDocument();
  });
});

describe("AppointmentBoard", () => {
  it("confirms a pending appointment", async () => {
    const pending = APPOINTMENTS.find((a) => a.status === "pending" && a.scheduledAt >= `${TODAY}T00:00:00+07:00`)!;
    render(<AppointmentBoard />);
    const select = screen.getByLabelText(`Đổi trạng thái ${pending.code}`);
    await userEvent.selectOptions(select, "confirmed");
    const row = select.closest("li")!;
    expect(within(row).getByText("Đã xác nhận")).toBeInTheDocument();
  });

  it("filters to appointments without staff", async () => {
    render(<AppointmentBoard />);
    await userEvent.selectOptions(screen.getByLabelText("Nhân viên"), "none");
    for (const select of screen.getAllByLabelText(/^Nhân viên dẫn xem cho/)) {
      expect(select).toHaveValue("");
    }
  });
});
