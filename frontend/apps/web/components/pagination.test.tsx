import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pagination, pageFrom, pageWindow } from "./pagination";

const labels = { label: "Pages", prev: "Prev", next: "Next", page: (n: number) => `Page ${n}`, range: (a: number, b: number, t: number) => `${a}-${b} of ${t}` };

describe("pageFrom", () => {
  it("reads the page and clamps it to the pages that exist", () => {
    expect(pageFrom(undefined, 75)).toBe(1);
    expect(pageFrom("3", 75)).toBe(3);
    expect(pageFrom("9", 75)).toBe(4);
    expect(pageFrom("0", 75)).toBe(1);
    expect(pageFrom("abc", 75)).toBe(1);
    expect(pageFrom(["2", "5"], 75)).toBe(2);
  });
});

describe("pageWindow", () => {
  it("keeps the ends and the neighbours of the current page", () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
  });
});

describe("Pagination", () => {
  it("renders nothing for a single page of 20 or fewer", () => {
    const { container } = render(<Pagination page={1} total={20} basePath="/tim-kiem" params={{}} labels={labels} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the other pages and keeps the other filters", () => {
    render(<Pagination page={2} total={45} basePath="/tim-kiem" params={{ q: "ninh kieu", trang: "2", type: ["studio", "1pn"] }} labels={labels} />);
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute("href", "/tim-kiem?q=ninh+kieu&type=studio&type=1pn");
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/tim-kiem?q=ninh+kieu&type=studio&type=1pn&trang=3");
    expect(screen.getByText("21-40 of 45")).toBeInTheDocument();
  });
});
