import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BookingForm } from "./form-booking";
import { ContactForm } from "./form-contact";

describe("BookingForm", () => {
  it("shows errors instead of sending an empty form", async () => {
    render(<BookingForm target={null} />);
    await userEvent.click(screen.getByRole("button", { name: "Đặt lịch xem phòng" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Còn 6 mục cần sửa");
    expect(screen.getByLabelText("Số điện thoại")).toHaveAttribute("aria-invalid", "true");
  });

  it("prefills the area from the room being booked and confirms after a valid submit", async () => {
    const user = userEvent.setup();
    render(<BookingForm target={{ projectName: "Nhà Mây Mậu Thân", roomName: "Phòng 302", districtSlug: "ninh-kieu" }} />);
    expect(screen.getByText(/Phòng 302, Nhà Mây Mậu Thân/)).toBeInTheDocument();
    expect(screen.getByLabelText("Khu vực")).toHaveValue("ninh-kieu");

    await user.click(screen.getAllByRole("radio")[0]!);
    await user.click(screen.getByRole("radio", { name: "10:00" }));
    await user.type(screen.getByLabelText("Họ tên"), "Nguyễn Thảo Vy");
    await user.type(screen.getByLabelText("Số điện thoại"), "0903 456 512");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Đặt lịch xem phòng" }));

    expect(screen.getByRole("status")).toHaveTextContent("Đã đặt lịch xem phòng");
    expect(screen.getByRole("status")).toHaveTextContent("0903 456 512");
  });
});

describe("ContactForm", () => {
  it("lets collaborators sign up without a message", async () => {
    const user = userEvent.setup();
    render(<ContactForm variant="ctv" />);
    await user.type(screen.getByLabelText("Họ tên"), "Đoàn Minh Trí");
    await user.type(screen.getByLabelText("Số điện thoại"), "0912345678");
    await user.click(screen.getByRole("button", { name: "Đăng ký cộng tác viên" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đã nhận đăng ký");
  });
});
