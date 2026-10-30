import { photo } from "./listings";
import type { Faq, Policy, Post, PostCategory } from "./types";

export const POST_CATEGORIES: PostCategory[] = [
  { slug: "kinh-nghiem-thue-phong", name: "Kinh nghiệm thuê phòng" },
  { slug: "khu-vuc-song", name: "Sống ở Cần Thơ" },
  { slug: "chu-nha", name: "Dành cho chủ nhà" },
  { slug: "thi-truong", name: "Thị trường cho thuê" },
];

const cat = (slug: string) => POST_CATEGORIES.find((c) => c.slug === slug) as PostCategory;

export const POSTS: Post[] = [
  {
    slug: "kinh-nghiem-thue-phong-tro-sinh-vien-2026",
    title: "Thuê phòng trọ sinh viên năm 2026: 9 điều cần kiểm tra trước khi đặt cọc",
    excerpt: "Từ đồng hồ điện riêng đến điều khoản hoàn cọc, đây là danh sách chúng tôi dùng khi dẫn khách đi xem phòng.",
    category: cat("kinh-nghiem-thue-phong"),
    tags: ["sinh viên", "đặt cọc", "hợp đồng"],
    author: "Ngọc Hân",
    publishedAt: "2026-10-24",
    readMinutes: 7,
    cover: photo(2, 1400),
    status: "published",
    views: 8420,
    sections: [
      {
        heading: "Xem phòng vào hai khung giờ khác nhau",
        paragraphs: [
          "Buổi trưa cho bạn biết phòng có bị hắt nắng hay không. Buổi tối cho bạn biết hẻm có ồn, có đủ đèn và xe có dễ vào không.",
          "Nếu chỉ đi được một lần, hãy hỏi người đang thuê ở tầng đó về tiếng ồn và giờ đóng cổng.",
        ],
      },
      {
        heading: "Hỏi rõ cách tính điện nước",
        paragraphs: [
          "Giá điện phổ biến ở Cần Thơ hiện từ 3.500 đến 3.800 đ mỗi kWh. Phòng có đồng hồ riêng và chụp số đầu kỳ cùng chủ nhà sẽ tránh tranh cãi khi trả phòng.",
          "Nước thường tính theo đầu người, khoảng 80.000 đ mỗi tháng. Trên TTHOME, giá niêm yết của mỗi phòng đã ghi rõ các khoản này.",
        ],
      },
      {
        heading: "Đọc kỹ điều khoản hoàn cọc",
        paragraphs: [
          "Hợp đồng cần ghi số ngày báo trước khi trả phòng, các trường hợp bị trừ cọc và thời hạn hoàn tiền.",
          "Chụp ảnh hiện trạng phòng ngay ngày nhận và gửi cho chủ nhà qua Zalo để có mốc thời gian.",
        ],
      },
    ],
  },
  {
    slug: "song-gan-dai-hoc-can-tho",
    title: "Sống gần Đại học Cần Thơ: chọn khu nào để đi học dưới 15 phút",
    excerpt: "So sánh Xuân Khánh, Hưng Lợi và An Khánh về giá, đường đi và chỗ ăn uống.",
    category: cat("khu-vuc-song"),
    tags: ["Ninh Kiều", "sinh viên"],
    author: "Minh Khoa",
    publishedAt: "2026-10-18",
    readMinutes: 6,
    cover: photo(8, 1400),
    status: "published",
    views: 5110,
    sections: [
      { heading: "Xuân Khánh", paragraphs: ["Sát cổng chính Đại học Cần Thơ, giá phòng từ 2 triệu. Nhiều quán ăn sinh viên dọc đường 30 Tháng 4 và Mậu Thân."] },
      { heading: "Hưng Lợi", paragraphs: ["Đối diện khu II, giá thấp hơn khoảng 10% nhưng một số hẻm hay ngập khi triều cường."] },
    ],
  },
  {
    slug: "chu-nha-chuan-bi-phong-truoc-khi-ky-gui",
    title: "Chủ nhà nên chuẩn bị gì trước khi ký gửi phòng",
    excerpt: "Ảnh đẹp giúp phòng cho thuê nhanh hơn, nhưng thông tin rõ ràng mới giữ được khách thuê lâu.",
    category: cat("chu-nha"),
    tags: ["ký gửi", "chủ nhà"],
    author: "Thu Trang",
    publishedAt: "2026-10-10",
    readMinutes: 5,
    cover: photo(11, 1400),
    status: "published",
    views: 2280,
    sections: [
      { heading: "Dọn phòng trước buổi chụp", paragraphs: ["Đội TTHOME chụp ảnh miễn phí. Phòng gọn, đủ đèn và mở cửa sổ sẽ có ảnh sáng và thật."] },
      { heading: "Ghi giá đã gồm những gì", paragraphs: ["Khách thuê so sánh tổng chi phí mỗi tháng, không chỉ tiền phòng."] },
    ],
  },
  {
    slug: "gia-thue-phong-tro-quy-4-2026",
    title: "Giá thuê phòng trọ quý 4/2026: Ninh Kiều và Cái Răng tăng nhẹ",
    excerpt: "Số liệu từ hơn 400 phòng TTHOME đang quản lý ở Cần Thơ cho thấy studio quanh trường đại học tăng 3–5%.",
    category: cat("thi-truong"),
    tags: ["giá thuê", "thị trường"],
    author: "Ban biên tập TTHOME",
    publishedAt: "2026-10-02",
    readMinutes: 4,
    cover: photo(14, 1400),
    status: "published",
    views: 3760,
    sections: [{ heading: "Studio quanh trường tăng giá", paragraphs: ["Nhu cầu đầu năm học đẩy giá studio quanh Đại học Cần Thơ, Y Dược và FPT lên 3–5% so với quý trước."] }],
  },
  {
    slug: "nuoi-meo-trong-phong-tro",
    title: "Nuôi mèo trong phòng trọ: thỏa thuận gì với chủ nhà",
    excerpt: "Phí vệ sinh, cam kết thiệt hại và cách giữ phòng sạch mùi khi trả phòng.",
    category: cat("kinh-nghiem-thue-phong"),
    tags: ["thú cưng"],
    author: "Ngọc Hân",
    publishedAt: "2026-09-26",
    readMinutes: 5,
    cover: photo(17, 1400),
    status: "published",
    views: 1990,
    sections: [{ heading: "Ghi vào hợp đồng", paragraphs: ["Thỏa thuận số lượng thú cưng, phí vệ sinh khi trả phòng và trách nhiệm khi có hư hỏng."] }],
  },
  {
    slug: "thue-phong-gan-khu-do-thi-nam-can-tho",
    title: "Thuê phòng ở khu đô thị Nam Cần Thơ: Hưng Phú hay Hưng Thạnh",
    excerpt: "So sánh giá phòng và thời gian qua cầu Hưng Lợi vào trung tâm Ninh Kiều.",
    category: cat("khu-vuc-song"),
    tags: ["Cái Răng", "khu đô thị"],
    author: "Minh Khoa",
    publishedAt: "2026-09-15",
    readMinutes: 6,
    cover: photo(5, 1400),
    status: "draft",
    views: 0,
    sections: [{ heading: "Hưng Phú", paragraphs: ["Giá cao hơn nhưng đường rộng, ít ngập và nhiều tiện ích mới."] }],
  },
];

export function publishedPosts(): Post[] {
  return POSTS.filter((p) => p.status === "published").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug && p.status === "published");
}

export const FAQS: Faq[] = [
  { id: "f1", group: "Xem và thuê phòng", audience: "tenant", question: "Xem phòng có mất phí không?", answer: "Không. Bạn đặt lịch trên web hoặc gọi hotline, nhân viên TTHOME dẫn bạn đi xem miễn phí, có thể xem nhiều phòng trong một buổi." },
  { id: "f2", group: "Xem và thuê phòng", audience: "tenant", question: "Giá trên web đã gồm điện nước chưa?", answer: "Giá niêm yết là tiền phòng mỗi tháng. Điện, nước, phí dịch vụ và gửi xe được ghi riêng ở trang chi tiết từng phòng để bạn tính được tổng chi phí." },
  { id: "f3", group: "Xem và thuê phòng", audience: "tenant", question: "Tôi có thể xem phòng online không?", answer: "Có. Khi đặt lịch, chọn hình thức Xem online, nhân viên sẽ gọi video qua Zalo và đi quanh phòng cùng bạn." },
  { id: "f4", group: "Đặt cọc và hợp đồng", audience: "tenant", question: "Tiền cọc thường là bao nhiêu?", answer: "Phần lớn phòng cọc một tháng tiền phòng. Tiền cọc được hoàn khi trả phòng đúng hạn đã báo trước và phòng không hư hỏng." },
  { id: "f5", group: "Đặt cọc và hợp đồng", audience: "tenant", question: "Hợp đồng ngắn nhất bao lâu?", answer: "Tùy tòa nhà, thường từ 6 tháng. Một số căn hộ dịch vụ nhận hợp đồng 1–3 tháng với giá cao hơn." },
  { id: "f6", group: "Ký gửi phòng", audience: "landlord", question: "Ký gửi phòng trên TTHOME mất phí gì?", answer: "Đăng tin, chụp ảnh và dẫn khách đều miễn phí. TTHOME chỉ thu phí môi giới khi phòng được cho thuê thành công, theo mức ghi trong hợp đồng ký gửi." },
  { id: "f7", group: "Ký gửi phòng", audience: "landlord", question: "Bao lâu thì phòng được đăng lên web?", answer: "Sau khi bạn gửi thông tin, đội ngũ gọi xác nhận trong 24 giờ và hẹn chụp ảnh. Phòng thường được đăng trong 2–3 ngày làm việc." },
  { id: "f8", group: "Tài khoản", audience: "all", question: "Làm sao để xóa tài khoản?", answer: "Vào Tài khoản, mục Hồ sơ, chọn Xóa tài khoản. Dữ liệu cá nhân được xóa trong 30 ngày theo chính sách bảo mật." },
];

export const POLICIES: Policy[] = [
  {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng",
    updatedAt: "2026-10-01",
    sections: [
      { heading: "Phạm vi áp dụng", paragraphs: ["Điều khoản này áp dụng cho mọi người dùng website tthome.vn, gồm người thuê, chủ nhà và cộng tác viên."] },
      { heading: "Thông tin phòng", paragraphs: ["TTHOME cập nhật giá và tình trạng phòng từ hệ thống quản lý nội bộ. Giá có thể thay đổi; giá cuối cùng là giá ghi trong hợp đồng thuê."] },
      { heading: "Trách nhiệm người dùng", paragraphs: ["Người dùng cung cấp thông tin liên hệ chính xác khi đặt lịch và không dùng website cho mục đích trái pháp luật."] },
    ],
  },
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    updatedAt: "2026-10-01",
    sections: [
      { heading: "Dữ liệu chúng tôi thu thập", paragraphs: ["Họ tên, số điện thoại, email, nhu cầu thuê và lịch sử đặt lịch do bạn cung cấp."] },
      { heading: "Mục đích sử dụng", paragraphs: ["Liên hệ tư vấn, xác nhận lịch hẹn và gửi thông báo về phòng bạn đã lưu. Chúng tôi không bán dữ liệu cho bên thứ ba."] },
      { heading: "Quyền của bạn", paragraphs: ["Bạn có thể yêu cầu xuất hoặc xóa dữ liệu cá nhân bất cứ lúc nào theo Nghị định 13/2023/NĐ-CP và Luật Bảo vệ dữ liệu cá nhân."] },
    ],
  },
  {
    slug: "chinh-sach-ky-gui",
    title: "Chính sách ký gửi",
    updatedAt: "2026-09-20",
    sections: [
      { heading: "Điều kiện nhận ký gửi", paragraphs: ["Phòng tại TP. Cần Thơ, có giấy tờ nhà hợp lệ và đáp ứng an toàn phòng cháy."] },
      { heading: "Phí dịch vụ", paragraphs: ["Phí môi giới bằng 50% một tháng tiền phòng, chỉ thu khi khách ký hợp đồng thuê."] },
    ],
  },
  {
    slug: "quy-trinh-thue-phong",
    title: "Quy trình thuê phòng",
    updatedAt: "2026-09-20",
    sections: [
      { heading: "1. Đặt lịch xem", paragraphs: ["Chọn phòng và khung giờ trên web, hoặc gọi hotline."] },
      { heading: "2. Xem phòng", paragraphs: ["Nhân viên dẫn bạn xem trực tiếp hoặc gọi video."] },
      { heading: "3. Đặt cọc và ký hợp đồng", paragraphs: ["Ký hợp đồng với chủ nhà, TTHOME giữ một bản để hỗ trợ khi có tranh chấp."] },
      { heading: "4. Nhận phòng", paragraphs: ["Kiểm tra hiện trạng, chụp số điện nước và nhận chìa khóa."] },
    ],
  },
];

export function getPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}
