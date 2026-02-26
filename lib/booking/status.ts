import type { ReservationStatus } from "@/types/booking";

const VALID_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_use", "cancelled", "no_show"],
  in_use: ["completed"],
  completed: [],
  cancelled: [],
  no_show: ["confirmed"],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStatuses(current: ReservationStatus): ReservationStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}
