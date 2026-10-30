import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BadgePercent, CalendarCheck, Camera, Headset, PawPrint, PlugZap, ReceiptText, Sofa, Sparkles, SunMedium, Wallet } from "lucide-react";
import { DISTRICTS, districtStats, PROJECTS, PROVINCE, publishedPosts, SITE } from "@tthome/data";
import { buttonStyles, cn, formatDate, formatFromPrice } from "@tthome/ui";
import { BrandLogo } from "@/components/brand-logo";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { HeroParallax } from "@/components/hero-parallax";
import { HeroSearch } from "@/components/hero-search";
import { JsonLd } from "@/components/json-ld";
import { Magnetic } from "@/components/magnetic";
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

/** Where each trust badge floats around the hero on wide screens, and how strongly it follows the mouse. */
const BADGE_SPOTS = ["top-[22%] left-[4%] [--depth:18px]", "top-[48%] right-[3%] [--depth:-24px] [animation-delay:-2.5s]", "bottom-[7%] left-[3%] [--depth:12px] [animation-delay:-5s]"];

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

const AREA_SLUGS = ["ninh-kieu", "cai-rang", "binh-thuy", "phong-dien", "o-mon"];

/** Stagger index for the scroll entrance (see the reveal utility in globals.css). */
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function RoomRow({ rooms, label, eager }: { rooms: RoomRef[]; label: string; eager?: boolean }) {
  return (
    <ul
      aria-label={label}
      className="scrollbar-none -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0"
    >
      {rooms.map((r, i) => (
        <li key={r.room.id} style={stagger(i)} className="reveal flex w-[78vw] shrink-0 snap-start sm:w-[300px] xl:w-auto">
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

      <HeroParallax className="bg-mesh relative isolate overflow-hidden">
        <HeroBackdrop />

        <ul aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
          {TRUST.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className={cn(
                "absolute translate-x-[calc(var(--px,0)*var(--depth))] translate-y-[calc(var(--py,0)*var(--depth))] transition-[translate] duration-700 ease-out-expo",
                BADGE_SPOTS[i],
              )}
            >
              <span className="glass-line inline-flex animate-float items-center gap-2.5 rounded-full bg-white/80 py-2 pr-4 pl-2 text-sm font-semibold text-ink shadow-[0_1px_2px_rgb(45_35_20/0.04),0_24px_40px_-18px_rgb(45_35_20/0.28)] backdrop-blur-xl [animation-delay:inherit]">
                <span className="grid size-8 place-items-center rounded-full bg-gold-soft text-gold-deep">
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mx-auto flex max-w-[1120px] flex-col items-center px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-20 lg:pt-24 lg:pb-20">
          <p className="glass-line inline-flex animate-rise items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold text-gold-ink backdrop-blur">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Phòng trọ, studio cho Gen Z ở Cần Thơ
          </p>
          <h1 className="mt-6 animate-rise text-display font-extrabold text-ink [animation-delay:90ms]">
            Tìm phòng đẹp.
            <span className="text-gold-gradient block pb-1">Sống đúng gu.</span>
          </h1>
          <p className="mt-5 max-w-[620px] animate-rise text-base text-muted [animation-delay:180ms] sm:text-lg">
            Khám phá không gian phù hợp với phong cách sống của bạn. Thông tin rõ ràng, giá minh bạch, đặt lịch xem phòng dễ dàng.
          </p>

          <HeroSearch className="mt-10 w-full max-w-[980px] animate-rise [animation-delay:270ms]" />

          <ul className="mt-6 flex animate-rise flex-wrap justify-center gap-2 [animation-delay:360ms]" aria-label="Lọc nhanh">
            {QUICK_FILTERS.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="glass-line inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-ink-soft backdrop-blur transition-[background-color,color,box-shadow] duration-300 hover:bg-white hover:text-ink hover:shadow-[0_0_0_1px_var(--color-gold),0_8px_20px_-10px_rgb(217_155_75/0.6)] active:scale-[0.97]"
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-soft xl:hidden">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon aria-hidden className="size-[18px] text-gold-deep" />
                {label}
              </li>
            ))}
          </ul>
          <p className="sr-only max-xl:hidden">{TRUST.map((t) => t.label).join(", ")}.</p>
        </div>
      </HeroParallax>

      <section aria-labelledby="noi-bat" className="mx-auto max-w-[1280px] px-4 pt-10 pb-16 sm:px-6">
        <SectionHeading
          id="noi-bat"
          title="Không gian phù hợp dành cho bạn"
          description="Khám phá những căn phòng nổi bật dành riêng cho nhu cầu của bạn."
          href="/tim-kiem?sort=popular"
          linkLabel="Xem tất cả phòng"
          className="reveal"
        />
        <RoomRow rooms={featured} label="Phòng nổi bật" eager />
      </section>

      <section aria-labelledby="khu-vuc" className="border-y border-line/70 bg-cream py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <SectionHeading
            id="khu-vuc"
            title="Khám phá theo khu vực"
            description="Chọn nơi ở gần trường, chỗ làm và nhịp sống của bạn."
            href="/khu-vuc"
            linkLabel="Tất cả khu vực"
            className="reveal"
          />
          <ul className="mt-10 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:auto-rows-[200px] lg:grid-cols-12">
            {areas.map(({ district, stats, photo }, i) => (
              <li
                key={district.slug}
                style={stagger(i)}
                className={cn(
                  "reveal",
                  ["sm:col-span-2 sm:row-span-2 lg:col-span-6", "lg:col-span-6", "lg:col-span-3", "lg:col-span-3", "lg:col-span-12"][i],
                  i === 0 && "row-span-2",
                )}
              >
                <Link href={`/phong-tro/${PROVINCE.slug}/${district.slug}`} className="group relative block h-full overflow-hidden rounded-[22px] bg-dune">
                  <Image
                    src={photo}
                    alt={`Khu vực ${district.name}`}
                    fill
                    sizes={i === 0 ? "(min-width: 1024px) 620px, 100vw" : i === 4 ? "(min-width: 640px) 1280px, 100vw" : "(min-width: 1024px) 620px, (min-width: 640px) 50vw, 100vw"}
                    className="object-cover transition-transform duration-600 ease-glide group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                  />
                  <span aria-hidden className="absolute inset-0 shadow-[inset_0_-140px_90px_-50px_rgb(28_26_23/0.82),inset_0_0_0_1px_rgb(255_255_255/0.08)]" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white transition-transform duration-600 ease-glide group-hover:-translate-y-1.5 motion-reduce:group-hover:translate-y-0 sm:p-6">
                    <span>
                      <span className="inline-flex rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-[opacity,translate] duration-500 ease-glide [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100">
                        {stats.vacant} phòng trống
                      </span>
                      <span className={cn("mt-2 block font-display font-bold tracking-[-0.02em]", i === 0 ? "text-3xl" : "text-xl")}>{district.name}</span>
                      <span className="mt-0.5 block text-sm text-white/85">{formatFromPrice(stats.minPrice)}</span>
                    </span>
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-white/90 text-ink transition-[background-color,translate] duration-500 ease-glide group-hover:translate-x-0.5 group-hover:bg-gold">
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
        <section aria-labelledby="moi-cap-nhat" className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
          <SectionHeading
            id="moi-cap-nhat"
            title="Phòng mới cập nhật"
            description="Tòa nhà vừa lên TTHOME trong những ngày gần đây."
            href="/tim-kiem?sort=newest"
            linkLabel="Xem phòng mới"
            className="reveal"
          />
          <RoomRow rooms={newest} label="Phòng mới cập nhật" />
        </section>
      ) : null}

      <section aria-labelledby="phong-cach" className="border-y border-line/70 bg-cream py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <SectionHeading id="phong-cach" title="Tìm phòng theo phong cách sống" center className="reveal" />
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {LIFESTYLES.map(({ icon: Icon, title, note, href }, i) => (
              <li key={title} style={stagger(i)} className="reveal">
                <Link
                  href={href}
                  className="group glass-line flex h-full flex-col items-center gap-3 rounded-[28px] bg-white px-4 pt-6 pb-5 text-center shadow-[var(--shadow-soft)] transition-[box-shadow,translate] duration-500 ease-glide hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--color-gold),0_0_0_5px_rgb(217_155_75/0.12),0_18px_36px_-16px_rgb(217_155_75/0.55)] active:scale-[0.98] motion-reduce:hover:translate-y-0"
                >
                  <span
                    aria-hidden
                    className="grid size-14 place-items-center rounded-full bg-gold-soft text-gold-deep transition-[background-color,color,rotate,scale] duration-500 ease-out-expo group-hover:-rotate-8 group-hover:scale-110 group-hover:bg-gold group-hover:text-on-primary motion-reduce:group-hover:rotate-0"
                  >
                    <Icon className="size-6 [stroke-width:1.75]" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="vi-sao" className="bg-white py-20">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
          <div className="reveal">
            <h2 id="vi-sao" className="text-[1.75rem] leading-tight font-bold sm:text-[2.375rem]">
              Vì sao chọn TTHOME?
            </h2>
            <p className="mt-3 max-w-md text-muted">Biết rõ phòng trước khi đi xem, để buổi xem phòng là bước quyết định chứ không phải bước dò hỏi.</p>
            <Magnetic strength={0.2} className="mt-7">
              <Link href="/tim-kiem" className={buttonStyles({ variant: "secondary", size: "lg", className: "rounded-full" })}>
                Bắt đầu tìm phòng
              </Link>
            </Magnetic>
          </div>
          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} style={stagger(i)} className="reveal flex gap-4">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold-deep">
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
        <section aria-labelledby="cam-nang" className="border-y border-line/70 bg-cream py-20">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <SectionHeading
              id="cam-nang"
              title="Cẩm nang thuê phòng"
              description="Một chút chuẩn bị để tìm phòng nhẹ nhàng hơn."
              href="/tin-tuc"
              linkLabel="Xem tất cả bài viết"
              className="reveal"
            />
            <ul
              aria-label="Bài viết mới"
              className="scrollbar-none -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
            >
              {posts.map((post, i) => (
                <li key={post.slug} style={stagger(i)} className="reveal w-[82vw] shrink-0 snap-start sm:w-[360px] md:w-auto">
                  <article className="group glass-line relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-[var(--shadow-soft)] transition-[box-shadow,translate] duration-500 ease-glide hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] motion-reduce:hover:translate-y-0">
                    <div className="relative aspect-[16/10] overflow-hidden bg-ivory">
                      <Image
                        src={post.cover}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 400px, 82vw"
                        className="object-cover transition-transform duration-600 ease-glide group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                      />
                      <span className="absolute top-3 left-3 rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs font-semibold text-gold-ink backdrop-blur-md">{post.category.name}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs text-muted">
                        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>, {post.readMinutes} phút đọc
                      </p>
                      <h3 className="mt-2 text-lg leading-snug font-bold text-ink">
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
          </div>
        </section>
      ) : null}

      <section aria-labelledby="chu-nha" className="mx-auto max-w-[1280px] px-4 pt-20 pb-4 sm:px-6">
        <div className="bg-grain reveal relative isolate overflow-hidden rounded-[28px] px-6 py-14 text-white shadow-[0_30px_60px_-30px_rgb(28_26_23/0.6)] sm:px-12 md:py-20">
          <div aria-hidden className="absolute -right-6 -bottom-10 -z-10 opacity-[0.12] sm:right-10">
            <BrandLogo variant="mark" height={300} />
          </div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-[#f3d3a2] backdrop-blur">
            <BadgePercent aria-hidden className="size-4" />
            Chụp ảnh và đăng tin miễn phí
          </p>
          <h2 id="chu-nha" className="mt-4 max-w-xl text-[2rem] leading-[1.1] font-extrabold text-white sm:text-[2.75rem]">
            Bạn có phòng trống cần cho thuê?
          </h2>
          <p className="mt-4 max-w-lg text-white/75">Gửi thông tin phòng để TTHOME hỗ trợ tiếp cận khách thuê phù hợp.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/ky-gui" className={buttonStyles({ size: "lg", className: "rounded-full px-8" })}>
                Ký gửi phòng
              </Link>
            </Magnetic>
            <Link
              href="/chinh-sach/chinh-sach-ky-gui"
              className={buttonStyles({
                variant: "ghost",
                size: "lg",
                className: "rounded-full text-white ring-1 ring-white/30 ring-inset hover:bg-white/10 hover:text-white active:scale-[0.97]",
              })}
            >
              Xem chính sách ký gửi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
