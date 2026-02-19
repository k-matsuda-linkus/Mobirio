import {
  format,
  parseISO,
  differenceInHours,
  differenceInDays,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { ja } from "date-fns/locale";

// ============================================================
// Date formatting helpers
// ============================================================

export function formatDate(date: string | Date, fmt: string = "yyyy/MM/dd"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: ja });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "yyyy/MM/dd HH:mm");
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

export function getRentalHours(startDate: string | Date, endDate: string | Date): number {
  const s = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const e = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return differenceInHours(e, s);
}

export function getRentalDays(startDate: string | Date, endDate: string | Date): number {
  const s = typeof startDate === "string" ? parseISO(startDate) : startDate;
  const e = typeof endDate === "string" ? parseISO(endDate) : endDate;
  return differenceInDays(e, s);
}

export function addDaysToDate(date: string | Date, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return addDays(d, days);
}

// ============================================================
// Business hours helpers (migrated from businessHours.ts)
// ============================================================

export interface BusinessHoursEntry {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  open: string;      // "09:00"
  close: string;     // "18:00"
  isClosed: boolean;
}

export interface ParsedBusinessHours {
  [dayOfWeek: number]: { open: string; close: string; isClosed: boolean };
}

/** Parse business hours JSON from the database into a structured format */
export function parseBusinessHours(hoursJson: BusinessHoursEntry[] | string | null): ParsedBusinessHours {
  if (!hoursJson) return {};
  const entries: BusinessHoursEntry[] =
    typeof hoursJson === "string" ? JSON.parse(hoursJson) : hoursJson;
  const result: ParsedBusinessHours = {};
  for (const entry of entries) {
    result[entry.dayOfWeek] = {
      open: entry.open,
      close: entry.close,
      isClosed: entry.isClosed,
    };
  }
  return result;
}

/** Get business hours for a specific date */
export function getBusinessHoursForDate(
  hours: ParsedBusinessHours,
  date: Date
): { open: string; close: string; isClosed: boolean } | null {
  const dayOfWeek = date.getDay();
  return hours[dayOfWeek] ?? null;
}

/** Generate time options (30-min intervals) within business hours */
export function generateTimeOptions(
  openTime: string = "09:00",
  closeTime: string = "18:00",
  intervalMinutes: number = 30
): string[] {
  const options: string[] = [];
  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    options.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    currentMinutes += intervalMinutes;
  }
  return options;
}

/** Check if a given time is within business hours */
export function isWithinBusinessHours(
  hours: ParsedBusinessHours,
  date: Date
): boolean {
  const dayHours = getBusinessHoursForDate(hours, date);
  if (!dayHours || dayHours.isClosed) return false;
  const timeStr = format(date, "HH:mm");
  return timeStr >= dayHours.open && timeStr <= dayHours.close;
}

/** Get business close time for a given date */
export function getBusinessCloseTime(
  hours: ParsedBusinessHours,
  date: Date
): string | null {
  const dayHours = getBusinessHoursForDate(hours, date);
  if (!dayHours || dayHours.isClosed) return null;
  return dayHours.close;
}

/** Format business hours for display */
export function formatBusinessHours(hours: ParsedBusinessHours): string[] {
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return dayNames.map((name, i) => {
    const entry = hours[i];
    if (!entry || entry.isClosed) return name + ": 定休日";
    return [name, entry.open, entry.close].join(' ');
  });
}
