export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
  }
}

// The backend answers in English; people read these.
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Tài khoản hoặc mật khẩu chưa đúng.",
  ACCOUNT_LOCKED: "Tài khoản đang bị khóa tạm thời vì nhập sai nhiều lần. Hãy thử lại sau ít phút.",
  ACCOUNT_DISABLED: "Tài khoản này đã bị vô hiệu hóa. Liên hệ TTHome để được hỗ trợ.",
  OTP_INVALID: "Mã xác nhận không đúng hoặc đã hết hạn.",
  OTP_RATE_LIMITED: "Bạn yêu cầu mã quá nhiều lần. Hãy đợi một lúc rồi thử lại.",
  CHANNEL_UNAVAILABLE: "Kênh gửi mã đang gián đoạn. Vui lòng thử lại sau.",
  CONTACT_TAKEN: "Số điện thoại hoặc email này đã được dùng cho tài khoản khác.",
  PASSWORD_NOT_SET: "Tài khoản này chưa đặt mật khẩu. Hãy đăng nhập bằng mã OTP.",
  VALIDATION_ERROR: "Thông tin chưa hợp lệ. Hãy kiểm tra lại các ô đã nhập.",
  TOKEN_INVALID: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  CONFLICT: "Thông tin bị trùng với dữ liệu có sẵn.",
};

export const errorMessage = (e: unknown) =>
  e instanceof ApiError ? (MESSAGES[e.code] ?? "Có lỗi xảy ra. Vui lòng thử lại.") : "Không kết nối được máy chủ. Vui lòng thử lại.";

export async function api<T = void>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${path}`, {
    method: body === undefined && path === "me" ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(res.status, err.code ?? "UNKNOWN");
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type Me = { id: string; phone: string | null; email: string | null; fullName: string | null; roles: string[] };
