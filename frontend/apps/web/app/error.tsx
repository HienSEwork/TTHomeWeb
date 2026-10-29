"use client";

import Link from "next/link";
import { SITE } from "@tthome/data";
import { Container, buttonStyles } from "@tthome/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex flex-col items-start py-20 sm:py-28">
      <h1 className="text-title font-extrabold text-ink">Trang chưa tải được</h1>
      <p className="mt-3 max-w-lg text-ink-soft">
        Có lỗi khi lấy dữ liệu. Thử tải lại sau ít phút, hoặc gọi {SITE.hotline} để nhân viên tìm phòng giúp bạn.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <button type="button" onClick={reset} className={buttonStyles({ variant: "primary", size: "lg" })}>
          Thử lại
        </button>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Về trang chủ
        </Link>
      </div>
    </Container>
  );
}
