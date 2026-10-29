import Link from "next/link";
import { Container, Plate, buttonStyles } from "@tthome/ui";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start py-20 sm:py-28">
      <Plate value="404" size="lg" />
      <h1 className="mt-8 text-title font-extrabold text-ink">Không tìm thấy trang này</h1>
      <p className="mt-3 max-w-lg text-ink-soft">Đường dẫn có thể đã cũ, hoặc phòng đã được cho thuê và gỡ khỏi web. Thử tìm phòng tương tự trong cùng khu vực.</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/tim-kiem" className={buttonStyles({ variant: "primary", size: "lg" })}>
          Tìm phòng
        </Link>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Về trang chủ
        </Link>
      </div>
    </Container>
  );
}
