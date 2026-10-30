import { TODAY } from "@tthome/data";
import { vi } from "./i18n/vi";

/** Error messages in the visitor's language; Vietnamese unless a dictionary passes others. */
export type ValidationMessages = typeof vi.validation;
const VI = vi.validation;

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
export function passwordProblem(password: string, m: ValidationMessages = VI): string | undefined {
  if (password.length < 8) return m.passwordShort;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return m.passwordMix;
  return undefined;
}

function phoneError(phone: string, m: ValidationMessages): string | undefined {
  if (!phone.trim()) return m.phoneMissing;
  if (!isVnPhone(phone)) return m.phoneInvalid;
  return undefined;
}

function nameError(name: string, m: ValidationMessages): string | undefined {
  return name.trim().length < 2 ? m.name : undefined;
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

export function validateBooking(input: BookingInput, from = TODAY, m: ValidationMessages = VI): Errors<BookingField> {
  return compact<BookingField>({
    area: input.area ? undefined : m.area,
    date: !input.date ? m.date : input.date <= from ? m.dateFuture : undefined,
    slot: input.slot ? undefined : m.slot,
    name: nameError(input.name, m),
    phone: phoneError(input.phone, m),
    consent: input.consent ? undefined : m.bookingConsent,
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

export function validateConsign(input: ConsignInput, m: ValidationMessages = VI): Errors<ConsignField> {
  const rooms = Number(input.roomCount);
  const price = Number(input.priceFrom.replace(/\D/g, ""));
  return compact<ConsignField>({
    address: input.address.trim().length < 6 ? m.address : undefined,
    district: input.district ? undefined : m.district,
    roomCount: !Number.isInteger(rooms) || rooms < 1 || rooms > 500 ? m.roomCount : undefined,
    priceFrom: !price || price < 500_000 ? m.priceFrom : undefined,
    roomTypes: input.roomTypes.length ? undefined : m.roomTypes,
    name: nameError(input.name, m),
    phone: phoneError(input.phone, m),
    consent: input.consent ? undefined : m.consignConsent,
  });
}

/* Collaborator sign-up and the contact form share the same shape. */

export type ContactInput = { name: string; phone: string; email: string; message: string };
export type ContactField = keyof ContactInput;

export function validateContact(input: ContactInput, requireMessage = true, m: ValidationMessages = VI): Errors<ContactField> {
  return compact<ContactField>({
    name: nameError(input.name, m),
    phone: phoneError(input.phone, m),
    email: input.email && !isEmail(input.email) ? m.email : undefined,
    message: requireMessage && input.message.trim().length < 10 ? m.message : undefined,
  });
}

/** A six-digit one-time code. */
export function isOtp(code: string): boolean {
  return /^\d{6}$/.test(code);
}
