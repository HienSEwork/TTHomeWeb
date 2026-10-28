"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Modal } from "@/components/admin/parts";
import { Button, Field, Notice } from "@/components/ui";
import { useSubmit } from "@/components/use-submit";
import { AmenityPanel } from "./amenity-panel";
import { CheckField, flag, num, options, SelectField, str, TextArea, tri, TriField } from "./form-bits";
import { MediaPanel } from "./media-panel";
import { FURNITURE, ROOM_TYPE, Room } from "./model";
import { Tabs } from "./tabs";

// Status is not part of the room form: it changes through the availability endpoint.
export function buildRoomBody(data: FormData) {
  return {
    code: str(data, "code"),
    title: str(data, "title"),
    roomType: str(data, "roomType"),
    floor: num(data, "floor"),
    areaM2: num(data, "areaM2"),
    price: num(data, "price"),
    priceInclUtility: flag(data, "priceInclUtility"),
    deposit: num(data, "deposit"),
    furniture: str(data, "furniture"),
    hasBalcony: tri(data, "hasBalcony"),
    hasWindow: tri(data, "hasWindow"),
    maxOccupants: num(data, "maxOccupants"),
    availableFrom: str(data, "availableFrom"),
    promo: flag(data, "promo"),
    promoNote: str(data, "promoNote"),
  };
}

type Tab = "info" | "amenities" | "media";

export function RoomEditor({
  projectId,
  room: initial,
  onChanged,
  onClose,
}: {
  projectId: string;
  room?: Room;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [room, setRoom] = useState(initial);
  const [tab, setTab] = useState<Tab>("info");
  const [notice, setNotice] = useState<string>();

  return (
    <Modal title={room ? `Phòng ${room.code}` : "Thêm phòng"} onClose={onClose}>
      {room && (
        <div className="mb-5">
          <Tabs
            label="Phần của phòng"
            value={tab}
            onChange={setTab}
            options={[["info", "Thông tin"], ["amenities", "Tiện nghi"], ["media", "Hình ảnh"]]}
          />
        </div>
      )}
      {notice && tab === "info" && <div className="mb-4"><Notice tone="ok">{notice}</Notice></div>}
      {tab === "info" && (
        <RoomForm
          key={room?.id ?? "new"}
          room={room}
          onSubmit={async (body) => {
            setNotice(undefined);
            const saved = room
              ? await adminApi<Room>(`rooms/${room.id}`, { method: "PUT", body })
              : await adminApi<Room>(`projects/${projectId}/rooms`, { method: "POST", body });
            setNotice(room ? "Đã lưu phòng." : "Đã tạo phòng. Thêm tiện nghi và hình ảnh ở các thẻ phía trên.");
            setRoom(saved);
            onChanged();
          }}
        />
      )}
      {room && tab === "amenities" && (
        <AmenityPanel
          endpoint={`rooms/${room.id}/amenities`}
          owner="room"
          selected={room.amenityIds}
          onSaved={(amenityIds) => {
            setRoom({ ...room, amenityIds });
            onChanged();
          }}
        />
      )}
      {room && tab === "media" && <MediaPanel endpoint={`rooms/${room.id}/media`} />}
    </Modal>
  );
}

function RoomForm({ room, onSubmit }: { room?: Room; onSubmit: (body: ReturnType<typeof buildRoomBody>) => Promise<void> }) {
  const { busy, error, run } = useSubmit();
  return (
    <form
      className="step-in space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const body = buildRoomBody(new FormData(e.currentTarget));
        run(() => onSubmit(body));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mã phòng" name="code" required maxLength={50} defaultValue={room?.code ?? ""} />
        <SelectField label="Loại phòng" name="roomType" required defaultValue={room?.roomType ?? "studio"}>
          {options(ROOM_TYPE)}
        </SelectField>
      </div>
      <Field label="Tiêu đề hiển thị" name="title" required maxLength={200} defaultValue={room?.title ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tầng" name="floor" type="number" min={-5} max={200} step={1} defaultValue={room?.floor ?? ""} />
        <Field label="Diện tích (m²)" name="areaM2" type="number" min={0.1} max={9999.9} step={0.1} defaultValue={room?.areaM2 ?? ""} />
        <Field label="Số người tối đa" name="maxOccupants" type="number" min={1} max={50} step={1} defaultValue={room?.maxOccupants ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Giá thuê (₫)" name="price" type="number" inputMode="numeric" min={0} step={1} defaultValue={room?.price ?? ""} />
        <Field label="Tiền cọc (₫)" name="deposit" type="number" inputMode="numeric" min={0} step={1} defaultValue={room?.deposit ?? ""} />
      </div>
      <CheckField label="Giá đã gồm điện nước và dịch vụ" name="priceInclUtility" defaultChecked={room?.priceInclUtility ?? false} />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Nội thất" name="furniture" defaultValue={room?.furniture ?? ""}>
          <option value="">Chưa rõ</option>
          {options(FURNITURE)}
        </SelectField>
        <TriField label="Ban công" name="hasBalcony" value={room?.hasBalcony ?? null} />
        <TriField label="Cửa sổ" name="hasWindow" value={room?.hasWindow ?? null} />
      </div>
      <Field label="Có thể vào ở từ" name="availableFrom" type="date" defaultValue={room?.availableFrom ?? ""} />
      <CheckField label="Đang khuyến mãi" name="promo" defaultChecked={room?.promo ?? false} />
      <TextArea label="Nội dung khuyến mãi" name="promoNote" rows={2} maxLength={500} defaultValue={room?.promoNote ?? ""} />
      <Notice>{error}</Notice>
      <Button busy={busy}>{room ? "Lưu phòng" : "Tạo phòng"}</Button>
    </form>
  );
}
