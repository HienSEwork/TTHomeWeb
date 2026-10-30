"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Camera, X } from "lucide-react";
import { DISTRICTS, ROOM_TYPE_LABEL, type RoomType } from "@tthome/data";
import { Button, SelectField, TextAreaField, TextField, ToggleChip, formatPriceShort } from "@tthome/ui";
import { validateConsign, type ConsignField, type ConsignInput, type Errors } from "@/lib/validation";
import { ConsentCheck, FormErrorSummary, FormSection, FormSuccess } from "./form-parts";

const TYPES: RoomType[] = ["room", "studio", "1pn", "2pn", "duplex", "shared", "dorm"];
const MAX_PHOTOS = 20;

export function ConsignForm() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [input, setInput] = useState<Omit<ConsignInput, "photos">>({
    address: "",
    district: "",
    roomCount: "",
    priceFrom: "",
    roomTypes: [],
    name: "",
    phone: "",
    consent: false,
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors<ConsignField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof input>(key: K, value: (typeof input)[K]) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateConsign({ ...next, photos: files.length }));
  }

  function toggleType(type: RoomType, on: boolean) {
    set("roomTypes", on ? [...input.roomTypes, type] : input.roomTypes.filter((t) => t !== type));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateConsign({ ...input, photos: files.length });
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <FormSuccess title="Đã gửi thông tin ký gửi">
        <p>
          Cảm ơn anh/chị {input.name.trim()}. Nhân viên TTHOME sẽ gọi số {input.phone} trong 24 giờ để xác nhận và hẹn lịch chụp ảnh. Theo dõi trạng thái ở mục
          Phòng ký gửi trong tài khoản.
        </p>
      </FormSuccess>
    );
  }

  const price = Number(input.priceFrom.replace(/\D/g, ""));

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8 rounded-card border border-line bg-surface p-5 sm:p-8">
      <FormSection title="Địa chỉ tòa nhà">
        <TextField label="Số nhà, tên đường" placeholder="62/4 Nguyễn Trãi, Phường Tân An" value={input.address} onChange={(e) => set("address", e.target.value)} error={errors.address} wrapperClassName="sm:col-span-2" />
        <SelectField label="Quận hoặc thành phố" value={input.district} onChange={(e) => set("district", e.target.value)} error={errors.district}>
          <option value="">Chọn</option>
          {DISTRICTS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
          <option value="khac">Khu vực khác</option>
        </SelectField>
      </FormSection>

      <FormSection title="Phòng cho thuê">
        <TextField label="Số phòng" type="number" inputMode="numeric" min={1} value={input.roomCount} onChange={(e) => set("roomCount", e.target.value)} error={errors.roomCount} />
        <TextField
          label="Giá thấp nhất mỗi tháng (đ)"
          inputMode="numeric"
          placeholder="3500000"
          value={input.priceFrom}
          onChange={(e) => set("priceFrom", e.target.value)}
          error={errors.priceFrom}
          hint={price >= 500_000 ? `Tức là ${formatPriceShort(price)} mỗi tháng` : undefined}
        />
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-ink">Loại phòng</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <ToggleChip key={t} checked={input.roomTypes.includes(t)} onChange={(on) => toggleType(t, on)}>
                {ROOM_TYPE_LABEL[t]}
              </ToggleChip>
            ))}
          </div>
          {errors.roomTypes ? <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.roomTypes}</p> : null}
        </div>
        <TextAreaField label="Mô tả thêm" optional placeholder="Tiện nghi, giờ giấc, chỗ để xe, điều kiện thuê…" value={note} onChange={(e) => setNote(e.target.value)} wrapperClassName="sm:col-span-2" />
      </FormSection>

      <FormSection title="Ảnh phòng" description="Không có ảnh cũng được, đội TTHOME sẽ đến chụp miễn phí. Tối đa 20 ảnh.">
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-card border-2 border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted transition-colors hover:border-plate hover:bg-plate-tint/40"
          >
            <Camera aria-hidden className="size-7 text-plate" />
            <span className="font-semibold text-ink">Chọn ảnh từ máy</span>
            JPG hoặc PNG, mỗi ảnh dưới 10 MB
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label="Chọn ảnh phòng"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
              setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
              e.target.value = "";
            }}
          />
          {files.length ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-wash px-3 py-2 text-sm">
                  <span className="truncate text-ink">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-muted hover:text-danger" aria-label={`Bỏ ảnh ${f.name}`}>
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </FormSection>

      <FormSection title="Liên hệ chủ nhà">
        <TextField label="Họ tên" autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label="Số điện thoại" type="tel" inputMode="tel" autoComplete="tel" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <ConsentCheck checked={input.consent} onChange={(v) => set("consent", v)} error={errors.consent}>
          Tôi đã đọc và đồng ý với{" "}
          <Link href="/chinh-sach/chinh-sach-ky-gui" className="font-semibold text-plate underline">
            chính sách ký gửi
          </Link>
          .
        </ConsentCheck>
        <FormErrorSummary count={Object.keys(errors).length} />
      </FormSection>

      <Button type="submit" size="lg" className="self-start">
        Gửi thông tin ký gửi
      </Button>
    </form>
  );
}
