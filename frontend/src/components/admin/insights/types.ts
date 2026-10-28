// Mirrors the Java records of report-service; a null figure means its service did not answer.
export type DashboardData = {
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

export type DayCount = { day: string; count: number };
export type TrafficFigures = { visitors: number; views: number; viewsByDay: DayCount[]; eventsByName: Record<string, number> };
export type AppointmentFigures = { created: number; createdByStatus: Record<string, number>; upcomingOpen: number; pendingConfirmation: number };
export type CustomerFigures = {
  newCustomers: number;
  bySource: Record<string, number>;
  byStage: Record<string, number>;
  newConsultRequests: number;
  consultRequestsByStatus: Record<string, number>;
};
export type InventoryFigures = { projects: number; rooms: number; vacant: number; reserved: number; rented: number; hidden: number };
export type ProjectFigures = { id: string; name: string; totalRooms: number; vacantCount: number; occupancy: number; minPrice: number | null };

export type ReportOverview = {
  from: string;
  to: string;
  traffic: TrafficFigures;
  appointments: AppointmentFigures | null;
  bookingRate: number | null;
  customers: CustomerFigures | null;
  inventory: InventoryFigures | null;
  projects: ProjectFigures[] | null;
  unavailable: string[];
};

export type AuditEntry = {
  id: string;
  actorId: string | null;
  actorIp: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export type PageResponse<T> = { items: T[]; page: number; size: number; total: number };
