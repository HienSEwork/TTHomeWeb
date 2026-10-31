import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getProjectBySlug, searchProjects } from "@tthome/data";
import { LangProvider } from "@/lib/i18n/client";
import { LangSwitch } from "./lang-switch";
import { ProjectCard } from "./project-card";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  document.cookie = "lang=; path=/; max-age=0";
  refresh.mockReset();
});

describe("LangSwitch", () => {
  it("marks Vietnamese as current by default", () => {
    render(<LangSwitch />);
    expect(screen.getByRole("group", { name: "Ngôn ngữ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "vi" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "en" })).toHaveAttribute("aria-pressed", "false");
  });

  it("saves English in the cookie and re-renders the page on the server", async () => {
    const user = userEvent.setup();
    render(<LangSwitch />);
    await user.click(screen.getByRole("button", { name: "en" }));
    expect(document.cookie).toContain("lang=en");
    expect(document.documentElement.lang).toBe("en");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the current language is chosen again", async () => {
    const user = userEvent.setup();
    render(
      <LangProvider lang="en">
        <LangSwitch />
      </LangProvider>,
    );
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "en" }));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("components in English", () => {
  it("renders a project card with English labels, prices and offer", () => {
    const project = getProjectBySlug("PRJ-C2D9A8")!;
    const match = searchProjects({ q: project.name })[0]!;
    render(
      <LangProvider lang="en">
        <ProjectCard match={match} lang="en" />
      </LangProvider>,
    );
    expect(screen.getByText(/^From .*M VND$/)).toBeInTheDocument();
    expect(screen.getByText("Direct from TT Home")).toBeInTheDocument();
    expect(screen.getByText("50% off the first month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Save ${project.name}` })).toBeInTheDocument();
  });
});
