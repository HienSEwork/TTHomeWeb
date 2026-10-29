const TZ = "Asia/Ho_Chi_Minh";

const dateTime = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
const clock = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
const weekday = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: TZ });

/** Always in Vietnam time, so server and browser render the same text. */
export const fmt = {
  dateTime: (iso: string) => dateTime.format(new Date(iso)),
  date: (iso: string) => date.format(new Date(iso.length === 10 ? `${iso}T12:00:00+07:00` : iso)),
  time: (iso: string) => clock.format(new Date(iso)),
  day: (isoDay: string) => {
    const s = weekday.format(new Date(`${isoDay}T12:00:00+07:00`));
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
};
