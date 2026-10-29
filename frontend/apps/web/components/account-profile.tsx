"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { DISTRICTS } from "@tthome/data";
import { Button, Card, SelectField, TextField } from "@tthome/ui";
import { isEmail, isVnPhone, passwordProblem } from "@/lib/validation";
import { CURRENT_USER } from "@/lib/account";

function Saved({ show, children }: { show: boolean; children: ReactNode }) {
  return show ? (
    <p role="status" className="text-sm font-semibold text-shutter">
      {children}
    </p>
  ) : null;
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function ProfileForm() {
  const [name, setName] = useState(CURRENT_USER.name);
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [area, setArea] = useState(CURRENT_USER.wantedArea);
  const [budget, setBudget] = useState(CURRENT_USER.budget);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const problem = !isEmail(email) ? "Email chưa đúng định dạng" : undefined;
    setError(problem);
    setSaved(!problem);
  }

  return (
    <Panel title="Thông tin cá nhân" description="Nhân viên tư vấn dùng nhu cầu thuê để gợi ý phòng cho bạn.">
      <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <TextField label="Họ tên" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
        <TextField label="Email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} error={error} />
        <SelectField label="Khu vực muốn thuê" value={area} onChange={(e) => { setArea(e.target.value); setSaved(false); }}>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Ngân sách" value={budget} onChange={(e) => { setBudget(e.target.value); setSaved(false); }}>
          <option value="under-3.5">Dưới 3,5 triệu</option>
          <option value="3.5-5">3,5 – 5 triệu</option>
          <option value="5-7">5 – 7 triệu</option>
          <option value="over-7">Trên 7 triệu</option>
        </SelectField>
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit">Lưu thay đổi</Button>
          <Saved show={saved}>Đã lưu thay đổi</Saved>
        </div>
      </form>
    </Panel>
  );
}

export function ChangePhoneForm() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  return (
    <Panel title="Đổi số điện thoại" description={`Số hiện tại: ${CURRENT_USER.phone}. Chúng tôi gửi mã xác nhận tới số mới.`}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const ok = isVnPhone(phone);
          setError(ok ? undefined : "Số điện thoại cần 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09");
          setSent(ok);
        }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start"
      >
        <TextField label="Số điện thoại mới" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} wrapperClassName="sm:w-72" />
        <Button type="submit" variant="secondary" className="sm:mt-7">
          Gửi mã xác nhận
        </Button>
      </form>
      <div className="mt-3">
        <Saved show={sent}>Đã gửi mã tới {phone}. Nhập mã trong 5 phút để hoàn tất.</Saved>
      </div>
    </Panel>
  );
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});
  const [saved, setSaved] = useState(false);
  return (
    <Panel title="Đổi mật khẩu">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const found = { current: current ? undefined : "Nhập mật khẩu hiện tại", next: passwordProblem(next) };
          setErrors(found);
          setSaved(!found.current && !found.next);
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <TextField label="Mật khẩu hiện tại" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
        <TextField label="Mật khẩu mới" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint="Ít nhất 8 ký tự, có cả chữ và số" />
        <div className="flex items-center gap-4 sm:col-span-2">
          <Button type="submit" variant="secondary">
            Đổi mật khẩu
          </Button>
          <Saved show={saved}>Đã đổi mật khẩu</Saved>
        </div>
      </form>
    </Panel>
  );
}

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [requested, setRequested] = useState(false);
  if (requested) {
    return (
      <Panel title="Xóa tài khoản">
        <p role="status" className="text-ink-soft">
          Đã nhận yêu cầu. Tài khoản và dữ liệu cá nhân sẽ bị xóa sau 30 ngày. Đăng nhập lại trước thời hạn đó để hủy yêu cầu.
        </p>
      </Panel>
    );
  }
  return (
    <Panel title="Xóa tài khoản" description="Phòng đã lưu, lịch hẹn và lịch sử tư vấn sẽ bị xóa sau 30 ngày. Hợp đồng đã ký không bị ảnh hưởng.">
      {confirming ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextField label='Gõ "XOA" để xác nhận' value={typed} onChange={(e) => setTyped(e.target.value)} wrapperClassName="sm:w-60" />
          <Button variant="danger" disabled={typed.trim().toUpperCase() !== "XOA"} onClick={() => setRequested(true)}>
            Xóa tài khoản
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Giữ tài khoản
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="text-danger" onClick={() => setConfirming(true)}>
          Xóa tài khoản
        </Button>
      )}
    </Panel>
  );
}
