import { TODAY } from "@tthome/data";

export type Errors<K extends string> = Partial<Record<K, string>>;

/** Keep digits only; "+84 903 456 512" becomes "0903456512". */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

/** Vietnamese mobile numbers: 10 digits starting with 03, 05, 07, 08 or 09. */
export function isVnPhone(input: string): boolean {
  return /^0[35789]\d{8}$/.test(normalizePhone(input));
}

export function isEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

/** At least 8 characters with a letter and a digit. */
export function passwordProblem(password: string): string | undefined {
  if (password.length < 8) return "Mật khẩu cần ít nhất 8 ký tự";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Mật khẩu cần có cả chữ và số";
  return undefined;
}

function phoneError(phone: string): string | undefined {
  if (!phone.trim()) return "Nhập số điện thoại để nhân viên gọi xác nhận";
  if (!isVnPhone(phone)) return "Số điện thoại cần 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09";
  return undefined;
}

function nameError(name: string): string | undefined {
  return name.trim().length < 2 ? "Nhập họ tên của bạn" : undefined;
}

function compact<K extends string>(errors: Errors<K>): Errors<K> {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v))) as Errors<K>;
}

/* Booking a viewing or asking for advice. */

export const TIME_SLOTS = ["08:30", "10:00", "13:30", "15:00", "16:30", "18:00", "19:30"] as const;

/** The next `days` calendar days starting tomorrow, as YYYY-MM-DD. */
export function bookingDays(days = 7, from = TODAY): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i + 1);
    return d.toISOString().slice(0, 10);
  });
}

export type BookingInput = {
  area: string;
  budget: string;
  moveIn: string;
  date: string;
  slot: string;
  mode: "in_person" | "online";
  name: string;
  phone: string;
  consent: boolean;
};

export type BookingField = keyof BookingInput;

export function validateBooking(input: BookingInput, from = TODAY): Errors<BookingField> {
  return compact<BookingField>({
    area: input.area ? undefined : "Chọn khu vực bạn muốn ở",
    date: !input.date ? "Chọn ngày xem phòng" : input.date <= from ? "Chọn một ngày từ ngày mai trở đi" : undefined,
    slot: input.slot ? undefined : "Chọn giờ xem phòng",
    name: nameError(input.name),
    phone: phoneError(input.phone),
    consent: input.consent ? undefined : "Bạn cần đồng ý để TTHOME liên hệ lại",
  });
}

/* Landlord consignment. */

export type ConsignInput = {
  address: string;
  district: string;
  roomCount: string;
  priceFrom: string;
  roomTypes: string[];
  photos: number;
  name: string;
  phone: string;
  consent: boolean;
};

export type ConsignField = keyof ConsignInput;

export function validateConsign(input: ConsignInput): Errors<ConsignField> {
  const rooms = Number(input.roomCount);
  const price = Number(input.priceFrom.replace(/\D/g, ""));
  return compact<ConsignField>({
    address: input.address.trim().length < 6 ? "Nhập số nhà và tên đường" : undefined,
    district: input.district ? undefined : "Chọn quận hoặc thành phố",
    roomCount: !Number.isInteger(rooms) || rooms < 1 || rooms > 500 ? "Nhập số phòng từ 1 đến 500" : undefined,
    priceFrom: !price || price < 500_000 ? "Nhập giá thuê thấp nhất, ví dụ 3500000" : undefined,
    roomTypes: input.roomTypes.length ? undefined : "Chọn ít nhất một loại phòng",
    name: nameError(input.name),
    phone: phoneError(input.phone),
    consent: input.consent ? undefined : "Bạn cần đồng ý với chính sách ký gửi",
  });
}

/* Collaborator sign-up and the contact form share the same shape. */

export type ContactInput = { name: string; phone: string; email: string; message: string };
export type ContactField = keyof ContactInput;

export function validateContact(input: ContactInput, requireMessage = true): Errors<ContactField> {
  return compact<ContactField>({
    name: nameError(input.name),
    phone: phoneError(input.phone),
    email: input.email && !isEmail(input.email) ? "Email chưa đúng định dạng" : undefined,
    message: requireMessage && input.message.trim().length < 10 ? "Viết ít nhất 10 ký tự để chúng tôi hiểu rõ yêu cầu" : undefined,
  });
}

/** A six-digit one-time code. */
export function isOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}
