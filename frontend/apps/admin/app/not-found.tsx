import Link from "next/link";
import { buttonStyles } from "@tthome/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-extrabold text-ink">Không tìm thấy trang này</h1>
        <p className="mt-2 text-sm text-muted">Có thể dự án hoặc khách đã bị xóa, hoặc đường dẫn bị gõ sai.</p>
        <Link href="/" className={buttonStyles({ className: "mt-6" })}>
          Về bảng điều khiển
        </Link>
      </div>
    </div>
  );
}
