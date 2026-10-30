import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPolicy, inventoryFigures, photo, SITE } from "@tthome/data";
import { Container, Plate, buttonStyles, formatDate } from "@tthome/ui";
import { ArticleBody } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Về chúng tôi",
  description: "TTHOME quản lý và cho thuê phòng trọ, căn hộ dịch vụ ở TP. Cần Thơ. Giá minh bạch, xem phòng tận nơi cùng nhân viên.",
  alternates: { canonical: "/ve-chung-toi" },
};

const PRINCIPLES = [
  { title: "Phòng trên web là phòng còn trống", text: "Tình trạng phòng cập nhật từ hệ thống quản lý mỗi vài phút. Phòng đã thuê được gỡ ngay." },
  { title: "Giá ghi đủ các khoản", text: "Tiền phòng, điện, nước, dịch vụ và gửi xe đều có trên trang phòng trước khi bạn đi xem." },
  { title: "Người thật dẫn đi xem", text: "Nhân viên TTHOME phụ trách từng khu, biết rõ hẻm nào ngập, tòa nào đóng cổng sớm." },
];

export default function AboutPage() {
  const inv = inventoryFigures();
  const privacy = getPolicy("chinh-sach-bao-mat");
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.company,
          url: "https://tthome.vn",
          telephone: SITE.hotline,
          email: SITE.email,
          taxID: SITE.taxCode,
          address: { "@type": "PostalAddress", streetAddress: SITE.address, addressLocality: "TP. Cần Thơ", addressCountry: "VN" },
        }}
      />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ label: "Về chúng tôi" }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-display font-extrabold text-balance text-ink">Chúng tôi dẫn người thuê đi xem từng căn phòng ở Cần Thơ.</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              TTHOME bắt đầu từ một nhóm nhỏ làm môi giới phòng trọ quanh các trường đại học. Hôm nay chúng tôi quản lý {inv.projects} tòa nhà và {inv.rooms} phòng, với cùng một cách làm: nói rõ giá, dẫn đi xem tận nơi.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-line">
            <Image src={photo(12, 1200)} alt="Hành lang một tòa nhà TTHOME" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            <Plate value={inv.vacant} unit="phòng đang trống" size="lg" className="absolute bottom-4 left-4" />
          </div>
        </div>

        <section aria-labelledby="cach-lam" className="mt-16">
          <h2 id="cach-lam" className="text-title font-extrabold text-ink">
            Cách chúng tôi làm việc
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="rounded-card border border-line bg-surface p-6">
                <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-ink-soft">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="thong-tin" className="mt-16 grid gap-6 rounded-[22px] border border-line bg-ivory p-8 text-ink sm:p-10 md:grid-cols-2">
          <div>
            <h2 id="thong-tin" className="text-2xl font-extrabold">
              Thông tin doanh nghiệp
            </h2>
            <dl className="mt-5 space-y-3 text-ink-soft">
              <div><dt className="text-sm text-muted">Tên công ty</dt><dd>{SITE.company}</dd></div>
              <div><dt className="text-sm text-muted">Mã số thuế</dt><dd className="tabular">{SITE.taxCode}</dd></div>
              <div><dt className="text-sm text-muted">Văn phòng</dt><dd>{SITE.address}</dd></div>
            </dl>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end md:justify-end">
            <Link href="/lien-he" className={buttonStyles({ variant: "wall", size: "lg" })}>
              Liên hệ với chúng tôi
            </Link>
            <Link href="/tuyen-ctv" className="text-sm font-semibold text-ink-soft underline hover:text-ink">
              Hợp tác cùng TTHOME
            </Link>
          </div>
        </section>

        {privacy ? (
          <section id="chinh-sach-bao-mat" aria-labelledby="bao-mat" className="mt-16 scroll-mt-24 border-t border-line pt-12">
            <h2 id="bao-mat" className="text-title font-extrabold text-ink">
              Chính sách bảo mật
            </h2>
            <p className="mt-2 text-sm text-muted">Cập nhật ngày {formatDate(privacy.updatedAt)}.</p>
            <div className="mt-8">
              <ArticleBody sections={privacy.sections} />
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}
