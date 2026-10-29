import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { buttonStyles } from "./button";
import { TextField, ToggleChip } from "./field";
import { Plate } from "./plate";

describe("Plate", () => {
  it("paints the figure and its unit", () => {
    render(<Plate value={12} unit="phòng trống" />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("phòng trống")).toBeInTheDocument();
  });
});

describe("TextField", () => {
  it("links the label and the error message to the input", () => {
    render(<TextField label="Số điện thoại" error="Nhập số điện thoại 10 số" />);
    const input = screen.getByLabelText("Số điện thoại");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Nhập số điện thoại 10 số");
  });
});

describe("ToggleChip", () => {
  function Harness() {
    const [on, setOn] = useState(false);
    return (
      <ToggleChip checked={on} onChange={setOn}>
        Nuôi thú cưng
      </ToggleChip>
    );
  }

  it("toggles like a checkbox", async () => {
    render(<Harness />);
    const box = screen.getByRole("checkbox", { name: "Nuôi thú cưng" });
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(box).toBeChecked();
  });
});

describe("buttonStyles", () => {
  it("combines variant, size and extra classes", () => {
    const classes = buttonStyles({ variant: "plate", size: "lg", className: "w-full" });
    expect(classes).toContain("bg-plate");
    expect(classes).toContain("h-12");
    expect(classes).toContain("w-full");
  });
});
