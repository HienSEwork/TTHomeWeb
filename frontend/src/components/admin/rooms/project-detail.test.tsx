import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectDetail } from "./project-detail";
import { buildProjectBody } from "./project-form";
import { mockApi, project } from "./test-utils";

const empty = { items: [], page: 0, size: 50, total: 0 };

describe("ProjectDetail", () => {
  it("sends the new project status", async () => {
    const calls = mockApi({
      "GET projects/p1": project(),
      "GET projects/p1/rooms": empty,
      "PUT projects/p1/status": project({ status: "hidden" }),
    });
    render(<ProjectDetail id="p1" />);
    await screen.findByRole("heading", { name: "Căn hộ Sao Mai" });
    await userEvent.selectOptions(screen.getByLabelText("Trạng thái dự án"), "hidden");
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    const put = calls.find((c) => c.method === "PUT");
    expect(put?.url).toBe("/api/admin/projects/p1/status");
    expect(put?.body).toEqual({ status: "hidden" });
  });

  it("explains an empty project instead of showing a bare table", async () => {
    mockApi({ "GET projects/p1": project({ totalRooms: 0, vacantCount: 0, minPrice: null }), "GET projects/p1/rooms": empty });
    render(<ProjectDetail id="p1" />);
    expect(await screen.findByText("Dự án này chưa có phòng nào.")).toBeTruthy();
  });

  it("reports a project that cannot be loaded", async () => {
    mockApi({});
    render(<ProjectDetail id="p1" />);
    expect((await screen.findByRole("alert")).textContent).toContain("Có lỗi xảy ra");
  });
});

describe("buildProjectBody", () => {
  it("sends every field of the PUT and keeps the ones the form does not show", () => {
    const form = new FormData();
    form.set("name", " Căn hộ Sao Mai ");
    form.set("petPolicy", "cat");
    form.set("exclusive", "on");
    form.set("freeHours", "true");
    form.set("feeWater", "18000");
    const body = buildProjectBody(project(), form);
    expect(body).toMatchObject({
      name: "Căn hộ Sao Mai",
      petPolicy: "cat",
      exclusive: true,
      evParking: false,
      freeHours: true,
      feeWater: 18000,
      feeElectric: null,
      wardId: 7,
      districtId: 3,
    });
    expect(Object.keys(body)).toHaveLength(21);
  });
});
