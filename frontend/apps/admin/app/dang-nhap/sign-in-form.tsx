"use client";

import { useActionState } from "react";
import { Button, TextField } from "@tthome/ui";
import { signIn, type SignInState } from "./actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null, email: "" });
  const error = state.error;

  return (
    <form className="mt-8 space-y-4" noValidate action={action}>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={error?.startsWith("Nhập email") ? error : undefined}
      />
      <TextField
        label="Mật khẩu"
        name="password"
        type="password"
        autoComplete="current-password"
        error={error?.startsWith("Mật khẩu") ? error : undefined}
      />
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" name="remember" className="size-4 accent-ink" />
        Ghi nhớ đăng nhập trên máy này
      </label>
      {error && !error.startsWith("Nhập email") && !error.startsWith("Mật khẩu") ? (
        <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      <p className="text-center text-sm text-muted">Quên mật khẩu? Liên hệ quản trị viên để được cấp lại.</p>
    </form>
  );
}
