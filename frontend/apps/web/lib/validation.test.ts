import { describe, expect, it } from "vitest";
import { bookingDays, isEmail, isOtp, isVnPhone, normalizePhone, passwordProblem, validateBooking, validateConsign, validateConsult, validateContact, validateJob, type BookingInput, type JobInput } from "./validation";

describe("phone numbers", () => {
  it("accepts 10-digit Vietnamese mobiles with spaces or +84", () => {
    expect(isVnPhone("0903 456 512")).toBe(true);
    expect(isVnPhone("+84 903 456 512")).toBe(true);
    expect(normalizePhone("+84 903 456 512")).toBe("0903456512");
  });

  it("rejects landlines, short numbers and wrong prefixes", () => {
    expect(isVnPhone("028 3822 1234")).toBe(false);
    expect(isVnPhone("090345651")).toBe(false);
    expect(isVnPhone("0103456512")).toBe(false);
  });
});

describe("small checks", () => {
  it("checks email, password and OTP", () => {
    expect(isEmail("han@tthome.vn")).toBe(true);
    expect(isEmail("han@tthome")).toBe(false);
    expect(passwordProblem("abc")).toMatch(/8 ký tự/);
    expect(passwordProblem("abcdefgh")).toMatch(/chữ và số/);
    expect(passwordProblem("abcd1234")).toBeUndefined();
    expect(isOtp("123456")).toBe(true);
    expect(isOtp("12345a")).toBe(false);
  });

  it("offers the next seven days starting tomorrow", () => {
    expect(bookingDays(7, "2026-10-29")).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]);
  });
});

describe("validateBooking", () => {
  const valid: BookingInput = {
    area: "ninh-kieu", budget: "2.5-3.5", moveIn: "this-month", date: "2026-10-30", slot: "10:00", mode: "in_person",
    name: "Nguyễn Thảo Vy", phone: "0903456512", consent: true,
  };

  it("passes a complete form", () => {
    expect(validateBooking(valid, "2026-10-29")).toEqual({});
  });

  it("flags every missing required field", () => {
    const errors = validateBooking({ ...valid, area: "", date: "", slot: "", name: "", phone: "123", consent: false }, "2026-10-29");
    expect(Object.keys(errors).sort()).toEqual(["area", "consent", "date", "name", "phone", "slot"]);
  });

  it("refuses a viewing today or in the past", () => {
    expect(validateBooking({ ...valid, date: "2026-10-29" }, "2026-10-29").date).toBeDefined();
  });
});

describe("validateConsign", () => {
  it("checks numbers and room types", () => {
    const errors = validateConsign({ address: "12 Lê Lợi", city: "can-tho", ward: "", roomCount: "0", priceFrom: "abc", roomTypes: [], photos: 0, name: "An", phone: "0903456512", consent: true });
    expect(Object.keys(errors).sort()).toEqual(["priceFrom", "roomCount", "roomTypes", "ward"]);
  });
});

describe("validateContact", () => {
  it("makes the message optional when asked", () => {
    const input = { name: "Minh Trí", phone: "0912345678", email: "", message: "" };
    expect(validateContact(input, false)).toEqual({});
    expect(validateContact(input).message).toBeDefined();
  });
});

describe("validateConsult", () => {
  const input = { name: "Minh Anh", phone: "0939456512", city: "can-tho", wards: [], budget: "", moveIn: "", times: [], note: "", referral: "", consent: true };

  it("needs only a name, a phone and consent", () => {
    expect(validateConsult(input)).toEqual({});
    expect(Object.keys(validateConsult({ ...input, name: "", phone: "123", consent: false })).sort()).toEqual(["consent", "name", "phone"]);
  });

  it("caps the areas at five", () => {
    expect(validateConsult({ ...input, wards: ["a", "b", "c", "d", "e", "f"] }).wards).toBeDefined();
  });
});

describe("validateJob", () => {
  const input: JobInput = {
    position: "sales",
    name: "Nguyễn Văn An",
    birthDate: "2003-05-12",
    gender: "male",
    email: "an@gmail.com",
    phone: "0939456512",
    city: "ho-chi-minh",
    status: "student",
    facebook: "",
    consent: true,
  };

  it("accepts a complete application", () => {
    expect(validateJob(input, "2026-10-29")).toEqual({});
  });

  it("flags missing fields, applicants under 16 and odd Facebook links", () => {
    const errors = validateJob({ ...input, position: "", email: "an@", birthDate: "2012-01-01", facebook: "myspace.com/an", consent: false }, "2026-10-29");
    expect(Object.keys(errors).sort()).toEqual(["birthDate", "consent", "email", "facebook", "position"]);
    expect(validateJob({ ...input, facebook: "facebook.com/nguyen.an" }, "2026-10-29")).toEqual({});
  });
});
