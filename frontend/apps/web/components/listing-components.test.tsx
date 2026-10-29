import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectBySlug, searchProjects } from "@tthome/data";
import { ProjectCard } from "./project-card";
import { SearchBox } from "./search-box";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("ProjectCard", () => {
  it("shows vacancy on a plate, the starting price and links to the project", () => {
    const match = searchProjects({ q: "Võ Văn Tần" })[0]!;
    render(<ProjectCard match={match} />);
    expect(screen.getByText(String(match.rooms.length))).toBeInTheDocument();
    expect(screen.getByText(/^Từ /)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: match.project.name })).toHaveAttribute("href", `/du-an/${match.project.slug}`);
    expect(screen.getByText("Độc quyền")).toBeInTheDocument();
    expect(screen.getByText(match.project.promo!)).toBeInTheDocument();
  });

  it("marks projects that allow pets", () => {
    const project = getProjectBySlug("PRJ-D4B1C7")!;
    const match = searchProjects({ q: project.name })[0]!;
    render(<ProjectCard match={match} />);
    expect(screen.getByText("Cho nuôi thú cưng")).toBeInTheDocument();
  });
});

describe("SearchBox", () => {
  beforeEach(() => push.mockReset());

  it("suggests places while typing and opens the chosen one with the keyboard", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");
    await user.type(input, "bach khoa");
    const options = await screen.findAllByRole("option");
    expect(options[0]).toHaveTextContent("Gần Bách Khoa");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(push).toHaveBeenCalledWith("/tim-kiem?landmark=bach-khoa");
  });

  it("searches the free text when no suggestion is chosen", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);
    await user.type(screen.getByRole("combobox"), "gác lửng{Enter}");
    expect(push).toHaveBeenCalledWith(`/tim-kiem?q=${encodeURIComponent("gác lửng")}`);
  });
});
