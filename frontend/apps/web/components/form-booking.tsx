"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { DISTRICTS, VISIT_MODE } from "@tthome/data";
import { Button, SelectField, TextField, cn } from "@tthome/ui";
import { bookingDays, TIME_SLOTS, validateBooking, type BookingField, type BookingInput, type Errors } from "@/lib/validation";
import { ChoiceGroup, ConsentCheck, FormErrorSummary, FormSection, FormSuccess } from "./form-parts";

const BUDGETS = [
  { value: "under-3.5", label: "Dưới 3,5 triệu" },
  { value: "3.5-5", label: "3,5 – 5 triệu" },
  { value: "5-7", label: "5 – 7 triệu" },
  { value: "over-7", label: "Trên 7 triệu" },
];

const MOVE_IN = [
  { value: "now", label: "Càng sớm càng tốt" },
  { value: "this-month", label: "Trong tháng này" },
  { value: "next-month", label: "Tháng sau" },
  { value: "later", label: "Chưa xác định" },
];

const dayLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "short", timeZone: "UTC" });
const dateLabel = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

export type BookingTarget = { projectName: string; roomName?: string; districtSlug: string } | null;

export function BookingForm({ target }: { target: BookingTarget }) {
  const days = bookingDays(7);
  const [input, setInput] = useState<BookingInput>({
    area: target?.districtSlug ?? "",
    budget: "",
    moveIn: "",
    date: "",
    slot: "",
    mode: "in_person",
    name: "",
    phone: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Errors<BookingField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends BookingField>(key: K, value: BookingInput[K]) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateBooking(next));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateBooking(input);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    const day = dateLabel.format(new Date(`${input.date}T00:00:00Z`));
    return (
      <FormSuccess title="Đã đặt lịch xem phòng" onReset={() => setSent(false)} resetLabel="Đặt thêm lịch">
        <p>
          Nhân viên TTHOME sẽ gọi số {input.phone} trong vòng 30 phút (8:00 – 21:00) để xác nhận buổi xem lúc {input.slot} ngày {day}
          {input.mode === "online" ? " qua video Zalo" : ""}. Bạn cũng nhận được tin nhắn Zalo nhắc lịch trước 2 giờ.
        </p>
      </FormSuccess>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8 rounded-card border border-line bg-surface p-5 sm:p-8">
      {target ? (
        <p className="rounded-lg bg-plate-tint px-4 py-3 text-sm text-plate-dark">
          Bạn đang đặt lịch xem <strong>{target.roomName ? `${target.roomName}, ` : ""}{target.projectName}</strong>. Nhân viên có thể dẫn bạn xem thêm phòng tương tự trong cùng buổi.
        </p>
      ) : null}

      <FormSection title="Bạn cần phòng thế nào" description="Chúng tôi chọn sẵn vài phòng phù hợp trước buổi xem.">
        <SelectField label="Khu vực" value={input.area} onChange={(e) => set("area", e.target.value)} error={errors.area}>
          <option value="">Chọn quận</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Ngân sách mỗi tháng" optional value={input.budget} onChange={(e) => set("budget", e.target.value)}>
          <option value="">Chưa chắc</option>
          {BUDGETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Khi nào dọn vào" optional value={input.moveIn} onChange={(e) => set("moveIn", e.target.value)} wrapperClassName="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <option value="">Chọn thời gian</option>
          {MOVE_IN.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title="Thời gian xem">
        <div role="radiogroup" aria-label="Ngày xem phòng" className="min-w-0 sm:col-span-2">
          <p className="text-sm font-semibold text-ink">Ngày</p>
          <div className="scrollbar-none -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d) => {
              const date = new Date(`${d}T00:00:00Z`);
              const on = input.date === d;
              return (
                <label
                  key={d}
                  className={cn(
                    "flex w-16 shrink-0 cursor-pointer flex-col items-center rounded-[10px] border py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-plate",
                    on ? "plate border-transparent" : "border-line-strong bg-surface text-ink hover:border-ink/40",
                  )}
                >
                  <input type="radio" name="date" value={d} checked={on} onChange={() => set("date", d)} className="sr-only" />
                  <span className={cn("text-xs", on ? "text-white/85" : "text-muted")}>{dayLabel.format(date)}</span>
                  <span className="tabular text-base font-bold">{dateLabel.format(date)}</span>
                </label>
              );
            })}
          </div>
          {errors.date ? <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.date}</p> : null}
        </div>
        <ChoiceGroup legend="Giờ" name="slot" value={input.slot} options={TIME_SLOTS.map((s) => ({ value: s, label: s }))} onChange={(v) => set("slot", v)} error={errors.slot} />
        <ChoiceGroup
          legend="Hình thức"
          name="mode"
          value={input.mode}
          options={[
            { value: "in_person", label: VISIT_MODE.in_person, detail: "Gặp nhân viên tại tòa nhà" },
            { value: "online", label: VISIT_MODE.online, detail: "Gọi video Zalo, đi quanh phòng" },
          ]}
          onChange={(v) => set("mode", v)}
        />
      </FormSection>

      <FormSection title="Liên hệ của bạn">
        <TextField label="Họ tên" autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" placeholder="0903 456 512" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <ConsentCheck checked={input.consent} onChange={(v) => set("consent", v)} error={errors.consent}>
          Tôi đồng ý để TTHOME dùng số điện thoại này để liên hệ về lịch xem phòng, theo{" "}
          <Link href="/chinh-sach/chinh-sach-bao-mat" className="font-semibold text-plate underline">
            chính sách bảo mật
          </Link>
          .
        </ConsentCheck>
        <FormErrorSummary count={Object.keys(errors).length} />
      </FormSection>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" size="lg">
          Đặt lịch xem phòng
        </Button>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Check aria-hidden className="size-4 text-success" />
          Gửi yêu cầu xem phòng miễn phí, không cần thanh toán.
        </p>
      </div>
    </form>
  );
}
