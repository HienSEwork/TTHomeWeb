/** Shapes of report-service and the list endpoints the dashboard reads, plus pure helpers to turn them into view data. */

export type DashboardResponse = {
  from: string;
  to: string;
  vacantRooms: number | null;
  totalRooms: number | null;
  upcomingAppointments: number | null;
  appointmentsToConfirm: number | null;
  newCustomers: number | null;
  newConsultRequests: number | null;
  pendingConsignments: number | null;
  unavailable: string[];
};

export type InventoryFigures = { projects: number; rooms: number; vacant: number; reserved: number; rented: number; hidden: number };
export type ProjectFigures = { id: string; name: string; totalRooms: number; vacantCount: number; occupancy: number; minPrice: number | null };

export type ReportOverview = {
  from: string;
  to: string;
  traffic: { visitors: number; views: number; viewsByDay: { day: string; count: number }[]; eventsByName: Record<string, number> } | null;
  appointments: { created: number; createdByStatus: Record<string, number>; upcomingOpen: number; pendingConfirmation: number } | null;
  bookingRate: number | null;
  customers: {
    newCustomers: number;
    bySource: Record<string, number>;
    byStage: Record<string, number>;
    newConsultRequests: number;
    consultRequestsByStatus: Record<string, number>;
  } | null;
  inventory: InventoryFigures | null;
  projects: ProjectFigures[] | null;
  unavailable: string[];
};

export type AppointmentDto = {
  id: string;
  code: string;
  projectId: string;
  roomId: string | null;
  mode: "in_person" | "online";
  scheduledAt: string;
  status: "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "no_show";
  staffId: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

export type SubmissionDto = {
  id: string;
  code: string;
  landlordName: string;
  addressText: string;
  roomCount: number | null;
  expectedPriceMin: number | null;
  createdAt: string;
};

export type ConsultDto = {
  id: string;
  fullName: string | null;
  phone: string;
  areaText: string | null;
  budgetMax: number | null;
  moveInDate: string | null;
  createdAt: string;
};

export type NamedDto = { id: string; name?: string; fullName?: string | null };

const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 3_600_000;

/** Calendar day (YYYY-MM-DD) in Vietnam time. */
export function vnDay(at: Date): string {
  return new Date(at.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** [start, end) of a Vietnam calendar day as instants. */
export function vnDayBounds(day: string): { from: string; to: string } {
  const start = new Date(`${day}T00:00:00+07:00`);
  return { from: start.toISOString(), to: new Date(start.getTime() + DAY_MS).toISOString() };
}

/** The last `days` Vietnam days ending today, oldest first, with zero for days that had no views. */
export function dailySeries(points: { day: string; count: number }[], now: Date, days = 30): { day: string; value: number }[] {
  const byDay = new Map(points.map((p) => [p.day, p.count]));
  return Array.from({ length: days }, (_, i) => {
    const day = vnDay(new Date(now.getTime() - (days - 1 - i) * DAY_MS));
    return { day, value: byDay.get(day) ?? 0 };
  });
}

/** Lookup of id to display name, for lists that only carry ids. */
export function nameIndex(items: NamedDto[] | null | undefined): Map<string, string> {
  return new Map((items ?? []).map((i) => [i.id, i.name ?? i.fullName ?? ""]));
}

/** Labels of the services that did not answer, for a single notice above the page. */
const SERVICE_LABEL: Record<string, string> = {
  listing: "phòng",
  booking: "lịch hẹn",
  crm: "khách hàng",
  consignment: "ký gửi",
  report: "báo cáo",
};

export function unavailableLabels(names: string[]): string[] {
  return [...new Set(names.map((n) => SERVICE_LABEL[n.toLowerCase()] ?? n))];
}

/** Map a backend count map onto known keys, largest first, dropping zeros. */
export function breakdown<K extends string>(counts: Record<string, number> | undefined, labels: Record<K, string>): { label: string; value: number }[] {
  return (Object.keys(labels) as K[])
    .map((k) => ({ label: labels[k], value: counts?.[k] ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}
