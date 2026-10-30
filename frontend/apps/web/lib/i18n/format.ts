import { formatDate, formatDateTime, formatFromPrice, formatPriceShort, formatVnd } from "@tthome/ui";

/** Dates are always shown in Ho Chi Minh City time so the server and the browser print the same text. */
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const MILLION = 1_000_000;

export type Formatter = {
  /** "3,5 triệu" / "3.5M VND". */
  priceShort: (vnd: number) => string;
  /** The big figure and its unit on a room card: "3,5" + "triệu/tháng" / "3.5" + "M VND/month". */
  priceParts: (vnd: number) => { value: string; unit: string };
  /** "Từ 3,5 triệu" or "Liên hệ" / "From 3.5M VND" or "Contact us". */
  fromPrice: (vnd: number | null | undefined) => string;
  /** fromPrice for the middle of a sentence: "từ 3,5 triệu" / "from 3.5M VND". */
  fromPriceInline: (vnd: number | null | undefined) => string;
  /** Short price tag on a map: "3,5tr" / "3.5M". */
  mapPrice: (vnd: number | null | undefined) => string;
  /** "3.500.000 đ" / "3,500,000 VND". */
  vnd: (vnd: number) => string;
  /** "03/11/2026" / "3 Nov 2026". */
  date: (iso: string) => string;
  /** "03/11" / "3 Nov". */
  dayMonth: (iso: string) => string;
  /** "09:30 03/11" / "3 Nov, 09:30". */
  dateTime: (iso: string) => string;
  /** A calendar day (YYYY-MM-DD) as "T6" / "Fri". */
  weekday: (day: string) => string;
  /** A calendar day (YYYY-MM-DD) as "30/10" / "30 Oct". */
  shortDay: (day: string) => string;
  /** A calendar day (YYYY-MM-DD) as "T6, 30/10" / "Fri, 30 Oct". */
  longDay: (day: string) => string;
  /** Plain number with the language's separators. */
  number: (n: number, maxFractionDigits?: number) => string;
};

const utcDay = (day: string) => new Date(`${day}T00:00:00Z`);

function vietnamese(): Formatter {
  const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "short", timeZone: "UTC" });
  const shortDay = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  const longDay = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return {
    priceShort: formatPriceShort,
    priceParts: (vnd) => ({ value: (Math.round((vnd / MILLION) * 10) / 10).toLocaleString("vi-VN"), unit: "triệu/tháng" }),
    fromPrice: formatFromPrice,
    fromPriceInline: (vnd) => formatFromPrice(vnd).toLowerCase(),
    mapPrice: (vnd) => (vnd ? formatPriceShort(vnd).replace(" triệu", "tr") : "Liên hệ"),
    vnd: formatVnd,
    date: formatDate,
    dayMonth: (iso) => formatDate(iso).slice(0, 5),
    dateTime: formatDateTime,
    weekday: (day) => weekday.format(utcDay(day)),
    shortDay: (day) => shortDay.format(utcDay(day)),
    longDay: (day) => longDay.format(utcDay(day)),
    number: (n, max = 0) => n.toLocaleString("vi-VN", { maximumFractionDigits: max }),
  };
}

function english(): Formatter {
  const millions = (vnd: number) => (Math.round((vnd / MILLION) * 10) / 10).toLocaleString("en-GB");
  const priceShort = (vnd: number) => (vnd >= MILLION ? `${millions(vnd)}M VND` : `${Math.round(vnd / 1000).toLocaleString("en-GB")}K VND`);
  const fromPrice = (vnd: number | null | undefined) => (vnd == null || vnd <= 0 ? "Contact us" : `From ${priceShort(vnd)}`);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
  const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: TIME_ZONE });
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
  const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return {
    priceShort,
    priceParts: (vnd) => ({ value: millions(vnd), unit: "M VND/month" }),
    fromPrice,
    fromPriceInline: (vnd) => (vnd == null || vnd <= 0 ? "contact us for the price" : `from ${priceShort(vnd)}`),
    mapPrice: (vnd) => (vnd ? (vnd >= MILLION ? `${millions(vnd)}M` : `${Math.round(vnd / 1000)}K`) : "Contact"),
    vnd: (vnd) => `${vnd.toLocaleString("en-GB")} VND`,
    date: (iso) => date.format(new Date(iso)),
    dayMonth: (iso) => dayMonth.format(new Date(iso)),
    dateTime: (iso) => `${dayMonth.format(new Date(iso))}, ${time.format(new Date(iso))}`,
    weekday: (day) => weekday.format(utcDay(day)),
    shortDay: (day) => shortDay.format(utcDay(day)),
    longDay: (day) => `${weekday.format(utcDay(day))}, ${shortDay.format(utcDay(day))}`,
    number: (n, max = 0) => n.toLocaleString("en-GB", { maximumFractionDigits: max }),
  };
}

export function createFormatter(lang: "vi" | "en"): Formatter {
  return lang === "en" ? english() : vietnamese();
}
