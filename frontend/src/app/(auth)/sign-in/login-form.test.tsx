import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const replace = vi.fn();
let search = "next=/tai-khoan/ho-so";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
  replace.mockClear();
  search = "next=/tai-khoan/ho-so";
  vi.restoreAllMocks();
});

describe("LoginForm", () => {
  it("signs in with a password and follows ?next", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response('{"ok":true}'));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Số điện thoại hoặc email"), "an@x.vn");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "secret-123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/tai-khoan/ho-so"));
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      identifier: "an@x.vn", password: "secret-123", rememberMe: false,
    });
  });

  it("sends staff to the admin area", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      new Response(String(url).endsWith("/me") ? '{"roles":["ADMIN"]}' : '{"ok":true}'));
    search = "";
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Số điện thoại hoặc email"), "an@x.vn");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "secret-123");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/dashboard"));
  });

  it("shows a readable message for wrong credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"code":"INVALID_CREDENTIALS"}', { status: 401 }));
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText("Số điện thoại hoặc email"), "an@x.vn");
    await userEvent.type(screen.getByLabelText("Mật khẩu"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect((await screen.findByRole("alert")).textContent).toContain("chưa đúng");
    expect(replace).not.toHaveBeenCalled();
  });

  it("moves to the code step after requesting an OTP", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 202 }));
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("tab", { name: "Mã OTP" }));
    await userEvent.type(screen.getByLabelText("Số điện thoại"), "0901234567");
    await userEvent.click(screen.getByRole("button", { name: "Gửi mã" }));
    expect(await screen.findByLabelText("Mã xác nhận (6 số)")).toBeTruthy();
  });
});
