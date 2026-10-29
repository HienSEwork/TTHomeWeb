import type { Metadata } from "next";
import { Logo } from "@tthome/ui";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-ink">Đăng nhập trang quản trị</h1>
          <p className="mt-1.5 text-sm text-muted">Dành cho nhân viên TTHome. Người thuê và chủ nhà đăng nhập ở tthome.vn.</p>
          <SignInForm />
        </div>
      </div>
      <div className="hidden flex-col justify-end bg-ink p-12 text-white lg:flex">
        <p className="max-w-md text-[1.75rem] leading-snug font-bold tracking-tight">Mỗi lịch hẹn được xác nhận trong 2 giờ là một khách thuê ít phải chờ.</p>
        <p className="mt-4 text-sm text-white/60">Tài khoản bị khóa 15 phút sau 5 lần nhập sai mật khẩu.</p>
      </div>
    </div>
  );
}
