import type { AppointmentStatus, SubmissionStatus } from "@tthome/data";

/** Which consignment statuses a reviewer can move to from each status (mirrors consignment-service StatusMachine). */
export const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  submitted: ["approved", "need_info", "rejected"],
  need_info: ["approved", "rejected"],
  approved: ["published", "rejected"],
  published: [],
  rejected: [],
  withdrawn: [],
};

export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "rescheduled", "cancelled"],
  confirmed: ["completed", "no_show", "rescheduled", "cancelled"],
  rescheduled: ["confirmed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canMove<S extends string>(table: Record<S, S[]>, from: S, to: S): boolean {
  return table[from].includes(to);
}

export type ReviewEntry = { at: string; by: string; text: string };

export type ReviewAction = { type: "decide"; code: string; to: SubmissionStatus; by: string; at: string; reason: string };

const DECISION_TEXT: Record<SubmissionStatus, string> = {
  approved: "Duyệt, hẹn đội chụp ảnh.",
  need_info: "Yêu cầu bổ sung",
  rejected: "Từ chối",
  published: "Đã đăng phòng lên web.",
  submitted: "Gửi lại",
  withdrawn: "Chủ nhà rút",
};

/** Apply a reviewer decision; illegal transitions leave the list unchanged. */
export function reviewReducer<T extends { code: string; status: SubmissionStatus; log: ReviewEntry[]; note: string }>(
  state: T[],
  action: ReviewAction,
): T[] {
  return state.map((s) => {
    if (s.code !== action.code || !canMove(SUBMISSION_TRANSITIONS, s.status, action.to)) return s;
    const text = action.reason ? `${DECISION_TEXT[action.to]}: ${action.reason}` : DECISION_TEXT[action.to];
    return { ...s, status: action.to, note: action.reason || s.note, log: [{ at: action.at, by: action.by, text }, ...s.log] };
  });
}
