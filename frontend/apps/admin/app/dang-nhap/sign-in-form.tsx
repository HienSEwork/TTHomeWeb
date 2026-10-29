"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, TextField } from "@tthome/ui";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Nhập email công việc, ví dụ ten@tthome.vn");
        if (password.length < 8) return setError("Mật khẩu có ít nhất 8 ký tự");
        setError(null);
        router.push("/");
      }}
    >
      <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={error?.startsWith("Nhập email") ? error : undefined} />
      <TextField
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error?.startsWith("Mật khẩu") ? error : undefined}
      />
      <Button type="submit" size="lg" className="w-full">
        Đăng nhập
      </Button>
      <p className="text-center text-sm text-muted">Quên mật khẩu? Liên hệ quản trị viên để được cấp lại.</p>
    </form>
  );
}
