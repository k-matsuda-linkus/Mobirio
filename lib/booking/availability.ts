import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DayAvailability } from "@/types/booking";
import type { DbBike, Reservation, VendorHoliday, VendorBusinessHour } from "@/types/database";

export interface AvailabilityCheckResult {
  available: boolean;
  conflictingReservations: string[];
  nextAvailable: string | null;
  reason?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export async function checkAvailability(
  bikeId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityCheckResult> {
  const supabase = await createServerSupabaseClient();

  // Get bike and vendor info
  const { data: bikeData, error: bikeError } = await supabase
    .from("bikes")
    .select("id, vendor_id, is_available")
    .eq("id", bikeId)
    .single();

  if (bikeError || !bikeData) {
    return {
      available: false,
      conflictingReservations: [],
      nextAvailable: null,
      reason: "バイクが見つかりません",
    };
  }

  const bike = bikeData as Pick<DbBike, "id" | "vendor_id" | "is_available">;

  if (!bike.is_available) {
    return {
      available: false,
      conflictingReservations: [],
      nextAvailable: null,
      reason: "このバイクは現在予約を受け付けていません",
    };
  }

  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  // Check for conflicting reservations
  const { data: conflictsData, error: conflictError } = await supabase
    .from("reservations")
    .select("id, start_datetime, end_datetime")
    .eq("bike_id", bikeId)
    .in("status", ["pending", "confirmed", "in_use"])
    .or(
      `and(start_datetime.lt.${endDate},end_datetime.gt.${startDate})`
    );

  if (conflictError) {
    return {
      available: false,
      conflictingReservations: [],
      nextAvailable: null,
      reason: "空き状況の確認に失敗しました",
    };
  }

  const conflicts = (conflictsData || []) as Pick<Reservation, "id" | "start_datetime" | "end_datetime">[];

  if (conflicts.length > 0) {
    // Find next available slot
    const sortedConflicts = conflicts.sort(
      (a, b) =>
        new Date(a.end_datetime).getTime() - new Date(b.end_datetime).getTime()
    );
    const lastConflict = sortedConflicts[sortedConflicts.length - 1];
    const nextAvailable = lastConflict.end_datetime;

    return {
      available: false,
      conflictingReservations: conflicts.map((c) => c.id),
      nextAvailable,
      reason: "指定期間に既存の予約があります",
    };
  }

  // Check vendor holidays
  const startDateOnly = startDate.split("T")[0];
  const endDateOnly = endDate.split("T")[0];

  const { data: holidaysData } = await supabase
    .from("vendor_holidays")
    .select("date, reason")
    .eq("vendor_id", bike.vendor_id)
    .gte("date", startDateOnly)
    .lte("date", endDateOnly);

  const holidays = (holidaysData || []) as Pick<VendorHoliday, "date" | "reason">[];

  if (holidays.length > 0) {
    return {
      available: false,
      conflictingReservations: [],
      nextAvailable: null,
      reason: `指定期間に休業日が含まれています: ${holidays[0].date}`,
    };
  }

  // Check business hours
  const dayOfWeek = startDateTime.getDay();
  const { data: businessHoursData } = await supabase
    .from("vendor_business_hours")
    .select("open_time, close_time, is_closed")
    .eq("vendor_id", bike.vendor_id)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (businessHoursData) {
    const businessHours = businessHoursData as Pick<VendorBusinessHour, "open_time" | "close_time" | "is_closed">;
    if (businessHours.is_closed) {
      return {
        available: false,
        conflictingReservations: [],
        nextAvailable: null,
        reason: "指定の曜日は休業日です",
      };
    }

    const startHour = startDateTime.getHours();
    const startMinute = startDateTime.getMinutes();
    const [openHour, openMinute] = businessHours.open_time.split(":").map(Number);
    const [closeHour, closeMinute] = businessHours.close_time.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    if (startMinutes < openMinutes || startMinutes >= closeMinutes) {
      return {
        available: false,
        conflictingReservations: [],
        nextAvailable: null,
        reason: `開始時刻は営業時間内（${businessHours.open_time}〜${businessHours.close_time}）にしてください`,
      };
    }
  }

  return {
    available: true,
    conflictingReservations: [],
    nextAvailable: null,
  };
}

export async function getAvailableBikes(
  vendorId: string,
  startDate: string,
  endDate: string
): Promise<{ id: string; name: string }[]> {
  const supabase = await createServerSupabaseClient();

  // Get all available bikes for this vendor
  const { data: bikesData } = await supabase
    .from("bikes")
    .select("id, name")
    .eq("vendor_id", vendorId)
    .eq("is_available", true);

  const bikes = (bikesData || []) as Pick<DbBike, "id" | "name">[];

  if (bikes.length === 0) {
    return [];
  }

  // Check availability for each bike
  const availableBikes: { id: string; name: string }[] = [];

  for (const bike of bikes) {
    const result = await checkAvailability(bike.id, startDate, endDate);
    if (result.available) {
      availableBikes.push({ id: bike.id, name: bike.name });
    }
  }

  return availableBikes;
}

export async function getBikeAvailabilityCalendar(
  bikeId: string,
  startDate: string,
  endDate: string
): Promise<DayAvailability[]> {
  const supabase = await createServerSupabaseClient();
  const result: DayAvailability[] = [];

  // Get bike info
  const { data: bikeData } = await supabase
    .from("bikes")
    .select("vendor_id, is_available")
    .eq("id", bikeId)
    .single();

  if (!bikeData) {
    return result;
  }

  const bike = bikeData as Pick<DbBike, "vendor_id" | "is_available">;

  // Get all reservations in the date range
  const { data: reservationsData } = await supabase
    .from("reservations")
    .select("start_datetime, end_datetime")
    .eq("bike_id", bikeId)
    .in("status", ["pending", "confirmed", "in_use"])
    .gte("end_datetime", startDate)
    .lte("start_datetime", endDate);

  const reservations = (reservationsData || []) as Pick<Reservation, "start_datetime" | "end_datetime">[];

  // Get holidays
  const { data: holidaysData } = await supabase
    .from("vendor_holidays")
    .select("date")
    .eq("vendor_id", bike.vendor_id)
    .gte("date", startDate.split("T")[0])
    .lte("date", endDate.split("T")[0]);

  const holidays = (holidaysData || []) as Pick<VendorHoliday, "date">[];
  const holidaySet = new Set(holidays.map((h) => h.date));

  // Get business hours
  const { data: businessHoursData } = await supabase
    .from("vendor_business_hours")
    .select("day_of_week, is_closed")
    .eq("vendor_id", bike.vendor_id);

  const businessHours = (businessHoursData || []) as Pick<VendorBusinessHour, "day_of_week" | "is_closed">[];
  const closedDays = new Set(
    businessHours.filter((bh) => bh.is_closed).map((bh) => bh.day_of_week)
  );

  // Generate calendar
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    let status: DayAvailability["status"] = "available";

    if (!bike.is_available) {
      status = "unavailable";
    } else if (holidaySet.has(dateStr)) {
      status = "unavailable";
    } else if (closedDays.has(dayOfWeek)) {
      status = "unavailable";
    } else if (reservations.length > 0) {
      // Check if any reservation overlaps this day
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dateStr);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasReservation = reservations.some((r) => {
        const rStart = new Date(r.start_datetime);
        const rEnd = new Date(r.end_datetime);
        return rStart < dayEnd && rEnd > dayStart;
      });

      if (hasReservation) {
        status = "booked";
      }
    }

    result.push({ date: dateStr, status });
  }

  return result;
}
