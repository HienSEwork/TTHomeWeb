/**
 * The two accounts of the mock-only demo. There is no backend: the web and admin
 * apps check these credentials locally and keep a plain session cookie.
 */
export type DemoRole = "tenant" | "admin";

export type DemoAccount = {
  role: DemoRole;
  email: string;
  password: string;
  name: string;
  phone: string;
};

export const DEMO_PASSWORD = "Demo@2026";

/** One-time code accepted by the phone sign-in tab of the demo. */
export const DEMO_OTP = "123456";

export const DEMO_ACCOUNTS: Readonly<Record<"user" | "admin", DemoAccount>> = {
  user: {
    role: "tenant",
    email: "nguoidung@tthome.demo",
    password: DEMO_PASSWORD,
    name: "Nguyễn Minh Anh",
    phone: "0939 456 512",
  },
  admin: {
    role: "admin",
    email: "admin@tthome.demo",
    password: DEMO_PASSWORD,
    name: "Quản trị TTHome",
    phone: "0292 3868 686",
  },
};

/** Session cookie names; the value is the account email. */
export const WEB_SESSION_COOKIE = "tthome_demo_user";
export const ADMIN_SESSION_COOKIE = "tthome_demo_admin";

/** Returns the demo account for `which` when the email (any case) and password match, otherwise null. */
export function checkDemoCredentials(which: keyof typeof DEMO_ACCOUNTS, email: string, password: string): DemoAccount | null {
  const account = DEMO_ACCOUNTS[which];
  return email.trim().toLowerCase() === account.email && password === account.password ? account : null;
}

/** Phone sign-in for the demo user: the phone number (spaces ignored) and DEMO_OTP. */
export function checkDemoPhone(phone: string, code: string): DemoAccount | null {
  const account = DEMO_ACCOUNTS.user;
  return phone.replace(/\D/g, "") === account.phone.replace(/\D/g, "") && code === DEMO_OTP ? account : null;
}
