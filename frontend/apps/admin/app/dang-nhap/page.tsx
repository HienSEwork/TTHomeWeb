import type { Metadata } from "next";
import { DEMO_ACCOUNTS } from "@tthome/data";
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
          <aside aria-label="Tài khoản demo" className="mt-6 rounded-lg border border-dashed border-line-strong bg-wash px-4 py-3 text-sm text-ink-soft">
            <p className="font-semibold text-ink">Tài khoản demo (quản trị)</p>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
              <dt className="text-muted">Email</dt>
              <dd className="font-mono text-ink">{DEMO_ACCOUNTS.admin.email}</dd>
              <dt className="text-muted">Mật khẩu</dt>
              <dd className="font-mono text-ink">{DEMO_ACCOUNTS.admin.password}</dd>
            </dl>
            <p className="mt-1.5 text-xs text-muted">Bản demo chạy bằng dữ liệu mẫu ở Cần Thơ, không kết nối máy chủ thật.</p>
          </aside>
          <SignInForm />
        </div>
      </div>
      <div className="hidden flex-col justify-end bg-sidebar p-12 text-white lg:flex">
        <p className="max-w-md text-[1.75rem] leading-snug font-bold tracking-tight">Mỗi lịch hẹn được xác nhận trong 2 giờ là một khách thuê ít phải chờ.</p>
        <p className="mt-4 text-sm text-white/60">Bản demo: mọi số liệu là dữ liệu mẫu, thay đổi không được lưu lại.</p>
      </div>
    </div>
  );
}
