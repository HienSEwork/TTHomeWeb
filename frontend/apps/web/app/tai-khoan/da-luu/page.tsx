import type { Metadata } from "next";
import { SavedRooms } from "@/components/account-saved";
import { savedRooms } from "@/lib/account";

export const metadata: Metadata = { title: "Phòng đã lưu" };

export default function SavedPage() {
  return (
    <div>
      <h1 className="text-title font-extrabold text-ink">Phòng đã lưu</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Chúng tôi gửi tin Zalo khi một phòng bạn lưu đổi giá hoặc đã có người thuê.</p>
      <SavedRooms initial={savedRooms()} />
    </div>
  );
}
