const MILLION = 1_000_000;

/** 3_500_000 -> "3,5 triệu"; 12_000_000 -> "12 triệu"; 850_000 -> "850 nghìn". */
export function formatPriceShort(vnd: number): string {
  if (vnd >= MILLION) {
    const millions = Math.round((vnd / MILLION) * 10) / 10;
    return `${millions.toLocaleString("vi-VN")} triệu`;
  }
  return `${Math.round(vnd / 1000).toLocaleString("vi-VN")} nghìn`;
}

/** 3_500_000 -> "3.500.000 đ". */
export function formatVnd(vnd: number): string {
  return `${vnd.toLocaleString("vi-VN")} đ`;
}

/** Monthly price for a card: "Từ 3,5 triệu" or "Liên hệ" when the price is unknown. */
export function formatFromPrice(vnd: number | null | undefined): string {
  if (vnd == null || vnd <= 0) return "Liên hệ";
  return `Từ ${formatPriceShort(vnd)}`;
}

/** Dates are always shown in Ho Chi Minh City time so the server and the browser print the same text. */
const TIME_ZONE = "Asia/Ho_Chi_Minh";

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIME_ZONE });
const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

/** "2026-11-03" -> "03/11/2026". */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** "2026-11-03T09:30:00+07:00" -> "09:30 03/11". */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** 1234 -> "1.234". */
export function formatCount(n: number): string {
  return n.toLocaleString("vi-VN");
}

/** 0.4567 -> "45,7%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toLocaleString("vi-VN", { maximumFractionDigits: digits })}%`;
}

/** Hide the middle of a phone number for lists: "0903 *** 512". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
}

/** Remove Vietnamese diacritics and lower-case, for search and slugs. */
export function normalizeVi(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

export function slugify(text: string): string {
  return normalizeVi(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
