import type { Metadata } from "next";
import { Container, SectionHeader, formatVnd } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/form-contact";
import { StepsList } from "@/components/steps-list";

export const metadata: Metadata = {
  title: "Tuyển cộng tác viên giới thiệu khách thuê",
  description: "Giới thiệu người thuê phòng cho TTHOME và nhận hoa hồng sau khi khách ký hợp đồng. Không cần kinh nghiệm, đăng ký trong 2 phút.",
  alternates: { canonical: "/tuyen-ctv" },
};

const COMMISSION = [
  { band: "Phòng dưới 3,5 triệu", rate: "30% tháng đầu", example: 3_000_000 * 0.3 },
  { band: "Phòng 3,5 – 7 triệu", rate: "40% tháng đầu", example: 5_000_000 * 0.4 },
  { band: "Phòng trên 7 triệu", rate: "50% tháng đầu", example: 9_000_000 * 0.5 },
  { band: "Giới thiệu chủ nhà ký gửi", rate: "500.000 đ mỗi tòa", example: 500_000 },
];

const HOW = [
  { title: "Đăng ký", text: "Điền form, bộ phận hợp tác gọi lại và gửi hợp đồng cộng tác điện tử." },
  { title: "Gửi khách", text: "Gửi tên và số điện thoại khách qua Zalo hoặc cổng cộng tác viên." },
  { title: "Theo dõi", text: "Biết khách đã được gọi, đã xem phòng hay đã cọc." },
  { title: "Nhận hoa hồng", text: "Chuyển khoản vào ngày 5 hằng tháng cho các hợp đồng tháng trước." },
];

export default function PartnerPage() {
  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--color-ivory),#fff)]">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "Cộng tác viên" }]} />
          <h1 className="mt-6 max-w-3xl text-display font-extrabold text-balance text-ink">Biết ai đang tìm phòng? Giới thiệu cho TTHOME.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">Hoa hồng trả sau khi khách ký hợp đồng thuê. Không cần đặt cọc, không bắt buộc số lượng.</p>
        </Container>
      </section>

      <Container className="py-12">
        <SectionHeader title="Mức hoa hồng" description="Tính trên tiền phòng tháng đầu của hợp đồng từ 6 tháng." />
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line bg-wash text-ink-soft">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Loại giao dịch</th>
                <th scope="col" className="px-5 py-3 font-semibold">Hoa hồng</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Ví dụ bạn nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMMISSION.map((c) => (
                <tr key={c.band}>
                  <th scope="row" className="px-5 py-4 font-semibold text-ink">{c.band}</th>
                  <td className="px-5 py-4 text-ink-soft">{c.rate}</td>
                  <td className="tabular px-5 py-4 text-right font-bold text-shutter">{formatVnd(c.example)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>

      <Container className="pb-12">
        <SectionHeader title="Cách làm cộng tác viên" />
        <div className="mt-6">
          <StepsList steps={HOW} />
        </div>
      </Container>

      <Container>
        <section aria-labelledby="dang-ky-ctv" className="max-w-3xl">
          <h2 id="dang-ky-ctv" className="text-title font-extrabold text-ink">
            Đăng ký cộng tác viên
          </h2>
          <div className="mt-6">
            <ContactForm variant="ctv" />
          </div>
        </section>
      </Container>
    </>
  );
}
