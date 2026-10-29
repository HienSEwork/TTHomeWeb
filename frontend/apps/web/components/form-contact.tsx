"use client";

import { useState, type FormEvent } from "react";
import { Button, SelectField, TextAreaField, TextField } from "@tthome/ui";
import { validateContact, type ContactField, type ContactInput, type Errors } from "@/lib/validation";
import { FormErrorSummary, FormSuccess } from "./form-parts";

type Variant = "contact" | "ctv";

const COPY: Record<Variant, { submit: string; done: string; message: string; placeholder: string }> = {
  contact: {
    submit: "Gửi tin nhắn",
    done: "Đã gửi tin nhắn",
    message: "Nội dung",
    placeholder: "Bạn cần hỗ trợ gì?",
  },
  ctv: {
    submit: "Đăng ký cộng tác viên",
    done: "Đã nhận đăng ký",
    message: "Bạn giới thiệu khách bằng cách nào",
    placeholder: "Ví dụ: tôi có nhóm Zalo tìm phòng cho sinh viên trường…",
  },
};

const CTV_ROLES = ["Sinh viên", "Môi giới tự do", "Nhân viên văn phòng", "Chủ nhà", "Khác"];

export function ContactForm({ variant = "contact" }: { variant?: Variant }) {
  const copy = COPY[variant];
  const [input, setInput] = useState<ContactInput>({ name: "", phone: "", email: "", message: "" });
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Errors<ContactField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const requireMessage = variant === "contact";

  function set(key: ContactField, value: string) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateContact(next, requireMessage));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateContact(input, requireMessage);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <FormSuccess
        title={copy.done}
        onReset={() => {
          setInput({ name: "", phone: "", email: "", message: "" });
          setTried(false);
          setSent(false);
        }}
        resetLabel="Gửi thêm"
      >
        <p>
          {variant === "ctv"
            ? `Bộ phận hợp tác sẽ gọi số ${input.phone} trong 2 ngày làm việc để hướng dẫn và gửi hợp đồng cộng tác.`
            : `TTHOME sẽ trả lời qua số ${input.phone}${input.email ? ` hoặc email ${input.email}` : ""} trong giờ làm việc.`}
        </p>
      </FormSuccess>
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-label={copy.submit} className="grid gap-4 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 sm:p-8">
      <TextField label="Họ tên" autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
      <TextField label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
      <TextField label="Email" optional type="email" autoComplete="email" value={input.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
      {variant === "ctv" ? (
        <SelectField label="Bạn là" optional value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Chọn</option>
          {CTV_ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </SelectField>
      ) : null}
      <TextAreaField
        label={copy.message}
        optional={!requireMessage}
        placeholder={copy.placeholder}
        value={input.message}
        onChange={(e) => set("message", e.target.value)}
        error={errors.message}
        wrapperClassName="sm:col-span-2"
      />
      <FormErrorSummary count={Object.keys(errors).length} />
      <Button type="submit" size="lg" className="justify-self-start">
        {copy.submit}
      </Button>
    </form>
  );
}
