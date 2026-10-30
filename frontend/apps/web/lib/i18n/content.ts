import type { Faq, Policy, Post, PostCategory, Project } from "@tthome/data";
import type { Lang } from "./index";

/*
 * English versions of the longer mock content (articles, policies, FAQ, building blurbs and offers), used only
 * by the web app. Proper names (buildings, streets, wards, districts, people) stay as they are. Anything without
 * an English entry falls back to the Vietnamese original.
 */

type Section = { heading: string; paragraphs: string[] };

const CATEGORY_EN: Record<string, string> = {
  "kinh-nghiem-thue-phong": "Renting tips",
  "khu-vuc-song": "Living in Can Tho",
  "chu-nha": "For landlords",
  "thi-truong": "Rental market",
};

const TAG_EN: Record<string, string> = {
  "sinh viên": "students",
  "đặt cọc": "deposits",
  "hợp đồng": "contracts",
  "Ninh Kiều": "Ninh Kiều",
  "ký gửi": "listing",
  "chủ nhà": "landlords",
  "giá thuê": "rent prices",
  "thị trường": "market",
  "thú cưng": "pets",
  "Cái Răng": "Cái Răng",
  "khu đô thị": "new urban areas",
};

const POST_EN: Record<string, { title: string; excerpt: string; sections: Section[] }> = {
  "kinh-nghiem-thue-phong-tro-sinh-vien-2026": {
    title: "Renting a student room in 2026: 9 things to check before paying a deposit",
    excerpt: "From a separate electricity meter to the deposit refund terms, this is the checklist we use when showing renters around.",
    sections: [
      {
        heading: "View the room at two different times",
        paragraphs: [
          "Midday tells you whether the room gets the harsh afternoon sun. Evening tells you whether the alley is noisy, well lit and easy to ride into.",
          "If you can only go once, ask the tenants on that floor about noise and what time the gate closes.",
        ],
      },
      {
        heading: "Ask exactly how utilities are charged",
        paragraphs: [
          "Electricity in Can Tho is usually 3,500 to 3,800 VND per kWh. A room with its own meter, and a photo of the starting reading taken with the landlord, avoids arguments when you move out.",
          "Water is usually charged per person, about 80,000 VND a month. On TTHOME, every room's listed price spells these out.",
        ],
      },
      {
        heading: "Read the deposit refund terms carefully",
        paragraphs: [
          "The lease should state how many days' notice you must give, what can be deducted from the deposit and when it will be refunded.",
          "Photograph the room's condition on move-in day and send the photos to the landlord on Zalo so there is a timestamp.",
        ],
      },
    ],
  },
  "song-gan-dai-hoc-can-tho": {
    title: "Living near Can Tho University: which area gets you to class in under 15 minutes",
    excerpt: "Xuân Khánh, Hưng Lợi and An Khánh compared on price, commute and places to eat.",
    sections: [
      { heading: "Xuân Khánh", paragraphs: ["Right by the main gate of Can Tho University, with rooms from 2M VND. Plenty of student eateries along 30 Tháng 4 and Mậu Thân streets."] },
      { heading: "Hưng Lợi", paragraphs: ["Opposite Campus II, about 10% cheaper, but some alleys flood at high tide."] },
    ],
  },
  "chu-nha-chuan-bi-phong-truoc-khi-ky-gui": {
    title: "What landlords should prepare before listing a room",
    excerpt: "Good photos rent a room faster, but clear information is what keeps tenants for the long run.",
    sections: [
      { heading: "Tidy up before the photo shoot", paragraphs: ["The TTHOME team takes photos for free. A tidy, well-lit room with the windows open gives bright, honest photos."] },
      { heading: "Say what the price includes", paragraphs: ["Renters compare the total monthly cost, not just the rent."] },
    ],
  },
  "gia-thue-phong-tro-quy-4-2026": {
    title: "Room rents in Q4 2026: Ninh Kiều and Cái Răng edge up",
    excerpt: "Data from more than 400 rooms TTHOME manages in Can Tho shows studios near universities up 3–5%.",
    sections: [{ heading: "Studios near campuses get pricier", paragraphs: ["Start-of-year demand pushed studio rents around Can Tho University, the University of Medicine and Pharmacy and FPT up 3–5% on the previous quarter."] }],
  },
  "nuoi-meo-trong-phong-tro": {
    title: "Keeping a cat in a rented room: what to agree with your landlord",
    excerpt: "Cleaning fees, damage commitments and how to leave the room odour-free when you move out.",
    sections: [{ heading: "Put it in the lease", paragraphs: ["Agree on the number of pets, the cleaning fee when you leave and who pays for any damage."] }],
  },
  "thue-phong-gan-khu-do-thi-nam-can-tho": {
    title: "Renting in South Can Tho New Urban Area: Hưng Phú or Hưng Thạnh",
    excerpt: "Room prices and the ride over Hưng Lợi Bridge into central Ninh Kiều, compared.",
    sections: [{ heading: "Hưng Phú", paragraphs: ["Pricier, but with wide roads, little flooding and lots of new amenities."] }],
  },
};

const FAQ_EN: Record<string, { group: string; question: string; answer: string }> = {
  f1: { group: "Viewing and renting", question: "Do viewings cost anything?", answer: "No. Book online or call the hotline, and TTHOME staff will show you around for free. You can see several rooms in one trip." },
  f2: { group: "Viewing and renting", question: "Does the listed price include utilities?", answer: "The listed price is the monthly rent. Electricity, water, service and parking fees are listed separately on each room page so you can work out the total cost." },
  f3: { group: "Viewing and renting", question: "Can I view a room online?", answer: "Yes. When booking, choose Online and a staff member will video call you on Zalo and walk around the room with you." },
  f4: { group: "Deposits and leases", question: "How much is the deposit usually?", answer: "Most rooms take one month's rent as a deposit. It is refunded when you leave on the notice date you gave and the room is undamaged." },
  f5: { group: "Deposits and leases", question: "What is the shortest lease?", answer: "It depends on the building, usually 6 months. Some serviced apartments accept 1–3 month leases at a higher price." },
  f6: { group: "Listing your room", question: "What does listing a room on TTHOME cost?", answer: "Listing, photos and viewings are free. TTHOME only charges a brokerage fee when the room is rented, at the rate in the listing agreement." },
  f7: { group: "Listing your room", question: "How soon does my room go online?", answer: "After you send the details, our team calls within 24 hours to confirm and book a photo shoot. Rooms usually go live within 2–3 working days." },
  f8: { group: "Account", question: "How do I delete my account?", answer: "Go to Account, then Profile, and choose Delete account. Personal data is deleted within 30 days under our privacy policy." },
};

const POLICY_EN: Record<string, { title: string; sections: Section[] }> = {
  "dieu-khoan-su-dung": {
    title: "Terms of use",
    sections: [
      { heading: "Scope", paragraphs: ["These terms apply to everyone who uses tthome.vn, including renters, landlords and partners."] },
      { heading: "Room information", paragraphs: ["TTHOME updates prices and availability from its internal management system. Prices may change; the final price is the one in the lease."] },
      { heading: "User responsibilities", paragraphs: ["Users give accurate contact details when booking and do not use the website for unlawful purposes."] },
    ],
  },
  "chinh-sach-bao-mat": {
    title: "Privacy policy",
    sections: [
      { heading: "Data we collect", paragraphs: ["Your name, phone number, email, rental needs and booking history, as you provide them."] },
      { heading: "How we use it", paragraphs: ["To advise you, confirm viewings and notify you about rooms you saved. We do not sell data to third parties."] },
      { heading: "Your rights", paragraphs: ["You can ask us to export or delete your personal data at any time, under Decree 13/2023/ND-CP and the Personal Data Protection Law."] },
    ],
  },
  "chinh-sach-ky-gui": {
    title: "Listing policy",
    sections: [
      { heading: "Which rooms we accept", paragraphs: ["Rooms in Can Tho City with valid property papers that meet fire safety requirements."] },
      { heading: "Service fee", paragraphs: ["The brokerage fee is 50% of one month's rent, charged only when a tenant signs a lease."] },
    ],
  },
  "quy-trinh-thue-phong": {
    title: "How renting works",
    sections: [
      { heading: "1. Book a viewing", paragraphs: ["Pick a room and a time slot on the website, or call the hotline."] },
      { heading: "2. View the room", paragraphs: ["Our staff show you the room in person or by video call."] },
      { heading: "3. Pay the deposit and sign", paragraphs: ["You sign the lease with the landlord; TTHOME keeps a copy to help if there is a dispute."] },
      { heading: "4. Move in", paragraphs: ["Check the room's condition, photograph the meter readings and collect the keys."] },
    ],
  },
};

/** Building blurbs and offers by project code. */
const PROJECT_EN: Record<string, { description: string; promo?: string }> = {
  A1C3F2: { description: "A 6-storey building in a car-wide alley, a 5-minute walk to the main gate of Can Tho University. Rooms have large windows that catch the morning sun, a private kitchen and a private washing machine." },
  B7E410: { description: "A renovated townhouse in a quiet alley behind Vincom Xuân Khánh. The rooftop has space to dry laundry and sit out in the evening breeze." },
  C2D9A8: { description: "Serviced apartments 600 m from Campus II of Can Tho University. Lift, basement parking, an evening receptionist and weekly cleaning.", promo: "50% off the first month" },
  D4B1C7: { description: "In the 91B residential area, near the Central General Hospital. Ground-floor garden, dogs and cats welcome, and EV chargers in the basement." },
  E9F0B3: { description: "Affordable rooms for students of the University of Medicine and Pharmacy and Can Tho University. Bus no. 1 stops right at the end of the alley.", promo: "One month's service fee free" },
  F1A6D5: { description: "A 4-minute walk to the gate of Can Tho University of Medicine and Pharmacy. Shared rooms have private bunk beds and personal lockers." },
  G3C8E1: { description: "Dorm beds and rooms from 2M VND, opposite Campus II of Can Tho University. Electricity and water at the state rate." },
  H5D2F9: { description: "In the heart of Ninh Kiều, a 5-minute walk to Ninh Kiều Wharf and the night market. The rooftop has a laundry area and shared desks.", promo: "Free parking for 3 months" },
  J8A4C2: { description: "Overlooking the Hậu River, 1.5 km from the Ninh Kiều pedestrian bridge. Every unit has a balcony and its own washer-dryer." },
  K2E7B4: { description: "Freshly repainted rooms near An Hòa market. No curfew, fingerprint lock on every room." },
  L6B3D8: { description: "A quiet old neighbourhood with plenty of cafés and late-night food. Airy rooms with windows, a walk from Lưu Hữu Phước park.", promo: "300K VND/month off with a 12-month lease" },
  M1C9A6: { description: "Mezzanine studios for one, 10 minutes by motorbike from FPT University Can Tho." },
  N4F2E7: { description: "On Võ Văn Kiệt avenue, about 12 minutes to Can Tho airport. Spacious basement parking with e-scooter chargers." },
  P7D5B1: { description: "Good-value rooms for workers and engineers at Trà Nóc Industrial Park, under 5 minutes to work." },
  Q3A8C4: { description: "Near the Bình Thủy ancient house, in a quiet residential area. Dogs and cats welcome, with a large front yard.", promo: "500K VND off the deposit" },
  R9E1F3: { description: "High-ceilinged duplexes in South Can Tho New Urban Area, with a small rooftop pool. 10 minutes over Hưng Lợi Bridge to central Ninh Kiều." },
  S2B6D9: { description: "A private dormitory near Cái Răng floating market, with a study room and canteen. The bus to Can Tho University stops at the door.", promo: "First month free for new students" },
  T5C4A2: { description: "Opposite Sense City, a 7-minute walk to Ninh Kiều Wharf. Suits people working in the city centre." },
  U8D3E6: { description: "New rooms near Ô Môn market and the Ô Môn power plants, from 2M VND." },
  V4E2A9: { description: "A quiet garden house on Lộ Vòng Cung, 3 km from FPT University Can Tho. Large yard and free parking." },
};

const RULES_EN: Record<string, string> = {
  "Khách đến chơi đăng ký với quản lý sau 22:00.": "Visitors after 22:00 must register with the manager.",
  "Không hút thuốc trong phòng và hành lang.": "No smoking in rooms or corridors.",
  "Giữ yên lặng sau 23:00.": "Quiet hours after 23:00.",
  "Báo trước 30 ngày khi trả phòng để được hoàn cọc đầy đủ.": "Give 30 days' notice before moving out to get the full deposit back.",
};

export function localCategory(category: PostCategory, lang: Lang): PostCategory {
  return lang === "en" ? { ...category, name: CATEGORY_EN[category.slug] ?? category.name } : category;
}

export function localTag(tag: string, lang: Lang): string {
  return lang === "en" ? (TAG_EN[tag] ?? tag) : tag;
}

/** The post in the visitor's language. Slugs, dates and authors never change, so links keep working. */
export function localPost(post: Post, lang: Lang): Post {
  if (lang !== "en") return post;
  const tr = POST_EN[post.slug];
  return { ...post, ...(tr ?? {}), category: localCategory(post.category, lang) };
}

export function localFaq(faq: Faq, lang: Lang): Faq {
  const tr = lang === "en" ? FAQ_EN[faq.id] : undefined;
  return tr ? { ...faq, ...tr } : faq;
}

export function localPolicy(policy: Policy, lang: Lang): Policy {
  const tr = lang === "en" ? POLICY_EN[policy.slug] : undefined;
  return tr ? { ...policy, ...tr } : policy;
}

/** Description, offer and house rules of a building in the visitor's language. */
export function projectCopy(project: Project, lang: Lang): { description: string; promo: string | null; rules: string[] } {
  if (lang !== "en") return { description: project.description, promo: project.promo, rules: project.rules };
  const tr = PROJECT_EN[project.code];
  return {
    description: tr?.description ?? project.description,
    promo: project.promo ? (tr?.promo ?? project.promo) : null,
    rules: project.rules.map((r) => RULES_EN[r] ?? r),
  };
}

/** "Phòng 302" reads "Room 302" in English; other names are left alone. */
export function localRoomName(name: string, lang: Lang): string {
  return lang === "en" ? name.replace(/^Phòng /, "Room ") : name;
}
