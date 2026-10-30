import { APPOINTMENTS, DEMO_ACCOUNTS, PROJECTS, SUBMISSIONS, type Project, type Room } from "@tthome/data";

/** The demo user; the account pages are only reachable with the demo session cookie. */
export const CURRENT_USER = {
  name: DEMO_ACCOUNTS.user.name,
  phone: DEMO_ACCOUNTS.user.phone,
  email: DEMO_ACCOUNTS.user.email,
  joinedAt: "2026-08-14",
  wantedArea: "ninh-kieu",
  budget: "2.5-3.5",
  isLandlord: true,
};

export type SavedRoom = { room: Room; project: Project; savedPrice: number };

/** Rooms the user saved, with the price at the time of saving so we can show changes. */
export function savedRooms(): SavedRoom[] {
  const picks: [number, number, number][] = [
    [3, 0, 200_000],
    [7, 1, 0],
    [2, 0, -300_000],
    [15, 2, 0],
  ];
  return picks.flatMap(([p, r, delta]) => {
    const project = PROJECTS[p];
    const room = project?.rooms[r];
    return project && room ? [{ project, room, savedPrice: room.price + delta }] : [];
  });
}

export function myAppointments() {
  return APPOINTMENTS.filter((_, i) => i % 6 === 0 || i === 13).map((a) => ({ ...a, customer: CURRENT_USER.name }));
}

export type LandlordRoom = { code: string; name: string; building: string; price: number; vacant: boolean; views: number };

export function landlordListings() {
  const submissions = SUBMISSIONS.filter((s) => ["published", "need_info", "submitted"].includes(s.status)).slice(0, 3);
  const rooms: LandlordRoom[] = [
    { code: "PNH101", name: "Phòng 101", building: "5 Lý Tự Trọng, Ninh Kiều", price: 5_800_000, vacant: true, views: 214 },
    { code: "PNH102", name: "Phòng 102", building: "5 Lý Tự Trọng, Ninh Kiều", price: 6_100_000, vacant: false, views: 168 },
    { code: "PNH201", name: "Phòng 201", building: "5 Lý Tự Trọng, Ninh Kiều", price: 6_300_000, vacant: true, views: 301 },
    { code: "PNH202", name: "Phòng 202", building: "5 Lý Tự Trọng, Ninh Kiều", price: 5_900_000, vacant: true, views: 96 },
  ];
  return { submissions, rooms };
}
