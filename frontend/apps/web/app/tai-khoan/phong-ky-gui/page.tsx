import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@tthome/ui";
import { LandlordRooms, LandlordSubmissions } from "@/components/account-landlord";
import { landlordListings } from "@/lib/account";

export const metadata: Metadata = { title: "Phòng ký gửi" };

export default function LandlordPage() {
  const { submissions, rooms } = landlordListings();
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-extrabold text-ink">Phòng ký gửi</h1>
          <p className="mt-1 text-sm text-muted">Giá và tình trạng bạn cập nhật ở đây hiện trên web sau khi nhân viên kiểm tra, thường trong 1 giờ.</p>
        </div>
        <Link href="/ky-gui" className={buttonStyles({ variant: "primary" })}>
          Ký gửi thêm phòng
        </Link>
      </div>

      <section aria-labelledby="ho-so-ky-gui">
        <h2 id="ho-so-ky-gui" className="text-lg font-bold text-ink">
          Hồ sơ ký gửi
        </h2>
        <div className="mt-4">
          <LandlordSubmissions items={submissions} />
        </div>
      </section>

      <section aria-labelledby="phong-dang-dang">
        <h2 id="phong-dang-dang" className="text-lg font-bold text-ink">
          Phòng đang đăng
        </h2>
        <p className="mt-1 text-sm text-muted">Bấm vào giá để sửa. Gạt công tắc khi phòng đã có người thuê.</p>
        <div className="mt-4">
          <LandlordRooms initial={rooms} />
        </div>
      </section>
    </div>
  );
}
