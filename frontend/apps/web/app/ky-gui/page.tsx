import type { Metadata } from "next";
import Link from "next/link";
import { FAQS } from "@tthome/data";
import { Container, SectionHeader } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConsignForm } from "@/components/form-consign";
import { FaqList } from "@/components/faq-list";
import { StepsList } from "@/components/steps-list";

export const metadata: Metadata = {
  title: "Ký gửi phòng cho thuê",
  description: "Gửi phòng trọ, căn hộ cho TTHOME: chụp ảnh miễn phí, đăng tin, dẫn khách xem phòng. Chỉ trả phí khi phòng được thuê.",
  alternates: { canonical: "/ky-gui" },
};

const STEPS = [
  { title: "Gửi thông tin", text: "Điền địa chỉ, số phòng và giá thuê ở form bên dưới. Mất khoảng 3 phút." },
  { title: "Đội TTHOME chụp ảnh", text: "Chúng tôi gọi lại trong 24 giờ, hẹn đến chụp ảnh và quay video phòng miễn phí." },
  { title: "Đăng tin", text: "Phòng lên TTHOME trong 2–3 ngày làm việc, kèm giá điện nước rõ ràng." },
  { title: "Dẫn khách xem phòng", text: "Nhân viên dẫn khách đến xem. Bạn chỉ ký hợp đồng và nhận cọc." },
];

const BENEFITS = [
  { figure: "0 đ", text: "để đăng tin, chụp ảnh và dẫn khách" },
  { figure: "50%", text: "một tháng tiền phòng, chỉ thu khi khách ký hợp đồng" },
  { figure: "24 giờ", text: "để nhân viên gọi lại sau khi bạn gửi thông tin" },
];

export default function ConsignPage() {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "Ký gửi phòng" }]} />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <h1 className="text-display font-extrabold text-balance text-ink">Có phòng trống, để TTHOME tìm người thuê.</h1>
              <p className="mt-4 max-w-xl text-lg text-ink-soft">Bạn giữ quyền chọn khách và giá thuê. Chúng tôi lo ảnh, tin đăng và những buổi dẫn khách đi xem.</p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {BENEFITS.map((b) => (
                <div key={b.figure} className="rounded-card bg-wash p-4">
                  <dt className="tabular text-2xl font-extrabold text-shutter">{b.figure}</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{b.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <SectionHeader title="Ký gửi diễn ra thế nào" />
        <div className="mt-6">
          <StepsList steps={STEPS} />
        </div>
      </Container>

      <Container className="grid gap-10 pb-4 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="form-ky-gui" className="min-w-0">
          <h2 id="form-ky-gui" className="text-title font-extrabold text-ink">
            Gửi thông tin phòng
          </h2>
          <p className="mt-2 text-ink-soft">
            Đã gửi trước đó? Xem trạng thái ở{" "}
            <Link href="/tai-khoan/phong-ky-gui" className="font-semibold text-plate underline">
              Phòng ký gửi của tôi
            </Link>
            .
          </p>
          <div className="mt-6">
            <ConsignForm />
          </div>
        </section>
        <aside aria-labelledby="hoi-ky-gui" className="lg:pt-24">
          <h2 id="hoi-ky-gui" className="text-lg font-bold text-ink">
            Chủ nhà thường hỏi
          </h2>
          <div className="mt-3">
            <FaqList items={FAQS.filter((f) => f.audience === "landlord")} />
          </div>
        </aside>
      </Container>
    </>
  );
}
