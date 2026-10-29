import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BadgePercent, CalendarCheck, Camera, Headset, PawPrint, PlugZap, ReceiptText, Sofa, Sparkles, SunMedium, Wallet } from "lucide-react";
import { DISTRICTS, districtStats, PROJECTS, PROVINCE, publishedPosts, SITE } from "@tthome/data";
import { buttonStyles, formatDate, formatFromPrice } from "@tthome/ui";
import { BrandLogo } from "@/components/brand-logo";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { HeroSearch } from "@/components/hero-search";
import { JsonLd } from "@/components/json-ld";
import { RoomListingCard } from "@/components/room-listing-card";
import { SectionHeading } from "@/components/section-heading";
import { featuredRooms, newestRooms, type RoomRef } from "@/lib/listing";

export const revalidate = 600;

const QUICK_FILTERS = [
  { label: "Dưới 5 triệu", href: "/tim-kiem?price=0-5000000" },
  { label: "Studio", href: "/tim-kiem?type=studio" },
  { label: "Có ban công", href: "/tim-kiem?balcony=1" },
  { label: "Full nội thất", href: "/tim-kiem?furniture=full" },
  { label: "Cho nuôi thú cưng", href: "/tim-kiem?group=pet" },
  { label: "Nhận xe điện", href: "/tim-kiem?group=ev" },
];

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: ReceiptText, label: "Giá thuê minh bạch" },
  { icon: Camera, label: "Ảnh phòng thực tế" },
  { icon: CalendarCheck, label: "Đặt lịch xem thuận tiện" },
];

const LIFESTYLES: { icon: LucideIcon; title: string; note: string; href: string }[] = [
  { icon: Sparkles, title: "Studio hiện đại", note: "Gọn gàng, đủ tiện nghi", href: "/tim-kiem?type=studio" },
  { icon: Wallet, title: "Phòng dưới 5 triệu", note: "Vừa ngân sách", href: "/tim-kiem?price=0-5000000" },
  { icon: Sofa, title: "Full nội thất", note: "Xách vali vào ở", href: "/tim-kiem?furniture=full" },
  { icon: SunMedium, title: "Có ban công", note: "Thêm góc thở riêng", href: "/tim-kiem?balcony=1" },
  { icon: PawPrint, title: "Cho nuôi thú cưng", note: "Ở cùng bạn nhỏ", href: "/tim-kiem?group=pet" },
  { icon: PlugZap, title: "Chỗ để xe điện", note: "Có ổ sạc trong hầm", href: "/tim-kiem?group=ev" },
];

const REASONS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ReceiptText, title: "Thông tin phòng rõ ràng", text: "Diện tích, nội thất, tiện nghi và nội quy ghi đủ trước khi bạn đi xem." },
  { icon: Wallet, title: "Giá thuê minh bạch", text: "Tiền phòng, điện, nước, dịch vụ tách từng dòng để bạn tính tổng mỗi tháng." },
  { icon: Camera, title: "Hình ảnh trực quan", text: "Ảnh chụp tại phòng, có video ở nhiều tòa nhà." },
  { icon: CalendarCheck, title: "Chủ động đặt lịch xem", text: "Chọn ngày giờ hợp với bạn, xem trực tiếp hoặc gọi video. Không cần trả tiền trước." },
  { icon: Headset, title: "Hỗ trợ tư vấn", text: `Gọi ${SITE.hotline} hoặc nhắn Zalo, nhân viên gợi ý phòng theo nhu cầu.` },
];

const AREA_SLUGS = ["binh-thanh", "quan-7", "thu-duc", "phu-nhuan", "quan-3"];

function RoomRow({ rooms, label, eager }: { rooms: RoomRef[]; label: string; eager?: boolean }) {
  return (
    <ul
      aria-label={label}
      className="scrollbar-none -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0"
    >
      {rooms.map((r, i) => (
        <li key={r.room.id} className="flex w-[78vw] shrink-0 snap-start sm:w-[300px] xl:w-auto">
          <RoomListingCard listing={r} priority={eager && i < 3} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const featured = featuredRooms(5);
  const featuredIds = new Set(featured.map((r) => r.project.id));
  const newest = newestRooms(10).filter((r) => !featuredIds.has(r.project.id)).slice(0, 5);
  const areas = AREA_SLUGS.map((slug, i) => {
    const district = DISTRICTS.find((d) => d.slug === slug)!;
    // A real building in the district stands in for the area, so the photo never shows somewhere else.
    const showcase = PROJECTS.filter((p) => p.districtSlug === slug).sort((a, b) => b.views - a.views)[0]!;
    return { district, stats: districtStats(slug), photo: showcase.images[i === 0 ? 0 : 1]! };
  });
  const posts = publishedPosts().slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TTHOME",
          url: "https://tthome.vn",
          potentialAction: { "@type": "SearchAction", target: "https://tthome.vn/tim-kiem?q={q}", "query-input": "required name=q" },
        }}
      />

      <section className="relative isolate">
        <HeroBackdrop />
        <div className="mx-auto flex max-w-[1120px] flex-col items-center px-4 pt-14 pb-12 text-center sm:px-6 sm:pt-20 lg:pt-24">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-gold/50 bg-white/80 px-4 py-1.5 text-sm font-semibold text-gold-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            TTHOME · Phòng trọ Gen Z
          </p>
          <h1 className="mt-6 animate-rise text-display font-extrabold text-ink [animation-delay:80ms]">
            Tìm phòng đẹp.
            <span className="text-gold-gradient block pb-1">Sống đúng gu.</span>
          </h1>
          <p className="mt-5 max-w-[660px] animate-rise text-base text-muted [animation-delay:160ms] sm:text-lg">
            Khám phá không gian phù hợp với phong cách sống của bạn. Thông tin rõ ràng, giá minh bạch, đặt lịch xem phòng dễ dàng.
          </p>

          <HeroSearch className="mt-9 w-full max-w-[980px] animate-rise [animation-delay:240ms]" />

          <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Lọc nhanh">
            {QUICK_FILTERS.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-gold-deep hover:bg-gold-soft hover:text-ink"
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-soft">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon aria-hidden className="size-[18px] text-gold-deep" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="noi-bat" className="mx-auto max-w-[1280px] px-4 pt-6 pb-16 sm:px-6">
        <SectionHeading
          id="noi-bat"
          title="Không gian phù hợp dành cho bạn"
          description="Khám phá những căn phòng nổi bật dành riêng cho nhu cầu của bạn."
          href="/tim-kiem?sort=popular"
          linkLabel="Xem tất cả phòng"
        />
        <RoomRow rooms={featured} label="Phòng nổi bật" eager />
      </section>

      <section aria-labelledby="khu-vuc" className="bg-ivory py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <SectionHeading id="khu-vuc" title="Khám phá theo khu vực" description="Chọn nơi ở gần trường, chỗ làm và nhịp sống của bạn." href="/khu-vuc" linkLabel="Tất cả khu vực" />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {areas.map(({ district, stats, photo }, i) => (
              <li key={district.slug} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : undefined}>
                <Link
                  href={`/phong-tro/${PROVINCE.slug}/${district.slug}`}
                  className={`group relative block overflow-hidden rounded-card ${i === 0 ? "aspect-[4/3] lg:aspect-auto lg:h-full" : "aspect-[4/3] lg:aspect-[16/11]"}`}
                >
                  <Image src={photo} alt={`Khu vực ${district.name}`} fill sizes={i === 0 ? "(min-width: 1024px) 620px, 100vw" : "(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100" />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#1d1a15]/75 via-[#1d1a15]/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                    <span>
                      <span className={`block font-bold ${i === 0 ? "text-2xl" : "text-lg"}`}>{district.name}</span>
                      <span className="mt-0.5 block text-sm text-white/85">
                        {stats.vacant} phòng trống, {formatFromPrice(stats.minPrice).toLowerCase()}
                      </span>
                    </span>
                    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-white/90 text-ink transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="size-4" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {newest.length ? (
        <section aria-labelledby="moi-cap-nhat" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
          <SectionHeading id="moi-cap-nhat" title="Phòng mới cập nhật" description="Tòa nhà vừa lên TTHOME trong những ngày gần đây." href="/tim-kiem?sort=newest" linkLabel="Xem phòng mới" />
          <RoomRow rooms={newest} label="Phòng mới cập nhật" />
        </section>
      ) : null}

      <section aria-labelledby="phong-cach" className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <SectionHeading id="phong-cach" title="Tìm phòng theo phong cách sống" center />
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {LIFESTYLES.map(({ icon: Icon, title, note, href }) => (
            <li key={title}>
              <Link href={href} className="group flex h-full flex-col gap-3 rounded-card border border-line bg-white p-4 transition-colors hover:border-gold hover:bg-gold-soft/60 sm:p-5">
                <span aria-hidden className="grid size-11 place-items-center rounded-full bg-gold-soft text-gold-deep transition-colors group-hover:bg-white">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{note}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="vi-sao" className="border-y border-line bg-white py-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
          <div>
            <h2 id="vi-sao" className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.125rem]">
              Vì sao chọn TTHOME?
            </h2>
            <p className="mt-3 max-w-md text-muted">Biết rõ phòng trước khi đi xem, để buổi xem phòng là bước quyết định chứ không phải bước dò hỏi.</p>
            <Link href="/tim-kiem" className={buttonStyles({ variant: "secondary", size: "lg", className: "mt-7" })}>
              Bắt đầu tìm phòng
            </Link>
          </div>
          <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/60 text-gold-deep">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {posts.length ? (
        <section aria-labelledby="cam-nang" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
          <SectionHeading id="cam-nang" title="Cẩm nang thuê phòng" description="Một chút chuẩn bị để tìm phòng nhẹ nhàng hơn." href="/tin-tuc" linkLabel="Xem tất cả bài viết" />
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-white">
                  <div className="relative aspect-[16/10] overflow-hidden bg-ivory">
                    <Image src={post.cover} alt="" fill sizes="(min-width: 768px) 400px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gold-ink">{post.category.name}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs text-muted">
                      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>, {post.readMinutes} phút đọc
                    </p>
                    <h3 className="mt-2 text-lg leading-snug font-semibold text-ink">
                      <Link href={`/tin-tuc/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h3>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gold-ink">
                      Đọc bài viết
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="chu-nha" className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[24px] border border-gold/40 bg-ivory px-6 py-12 sm:px-12 md:py-16">
          <div aria-hidden className="absolute -right-6 -bottom-10 -z-10 opacity-[0.16] sm:right-10">
            <BrandLogo variant="mark" height={300} />
          </div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold-ink">
            <BadgePercent aria-hidden className="size-4" />
            Chụp ảnh và đăng tin miễn phí
          </p>
          <h2 id="chu-nha" className="mt-3 max-w-xl text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.25rem]">
            Bạn có phòng trống cần cho thuê?
          </h2>
          <p className="mt-3 max-w-lg text-muted">Gửi thông tin phòng để TTHOME hỗ trợ tiếp cận khách thuê phù hợp.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ky-gui" className={buttonStyles({ size: "lg", className: "px-7" })}>
              Ký gửi phòng
            </Link>
            <Link href="/chinh-sach/chinh-sach-ky-gui" className={buttonStyles({ variant: "ghost", size: "lg" })}>
              Xem chính sách ký gửi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
