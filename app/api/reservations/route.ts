import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { checkAvailability } from "@/lib/booking/availability";
import { validateBooking } from "@/lib/booking/validation";
import { calculateRentalPrice, getCDWPriceForClass, getVehicleClassFromDisplacement } from "@/lib/booking/pricing";
import type { RentalDuration, DbBike, Option, Reservation, ReservationOption, ReservationStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("reservations")
    .select(
      `
      *,
      bike:bikes(id, name, model, manufacturer, image_urls),
      vendor:vendors(id, name, slug)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status as ReservationStatus);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, message: "OK" });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user, supabase } = authResult;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const {
    bikeId,
    vendorId,
    startDatetime,
    endDatetime,
    options = [],
    cdw = false,
    notes,
  } = body;

  // Validation
  const validation = validateBooking({
    bikeId,
    vendorId,
    startDatetime,
    endDatetime,
    options,
    cdw,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation error", errors: validation.errors },
      { status: 400 }
    );
  }

  // Check availability
  const availability = await checkAvailability(bikeId, startDatetime, endDatetime);

  if (!availability.available) {
    return NextResponse.json(
      {
        error: "Unavailable",
        message: availability.reason || "指定期間は予約できません",
        conflictingReservations: availability.conflictingReservations,
        nextAvailable: availability.nextAvailable,
      },
      { status: 409 }
    );
  }

  // Get bike details for pricing
  const { data: bikeData, error: bikeError } = await supabase
    .from("bikes")
    .select("*")
    .eq("id", bikeId)
    .single();

  if (bikeError || !bikeData) {
    return NextResponse.json(
      { error: "Not found", message: "バイクが見つかりません" },
      { status: 404 }
    );
  }

  const bike = bikeData as DbBike;

  // Calculate rental duration and price
  const startDate = new Date(startDatetime);
  const endDate = new Date(endDatetime);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const priceResult = calculateRentalPrice(bike, hours);
  const baseAmount = priceResult.baseAmount;

  let rentalDuration: RentalDuration = priceResult.rentalDuration;
  // 32h超の場合、DBのRentalDuration型に合わせる
  if (hours > 32) {
    rentalDuration = "24h";
  }

  // Calculate option prices
  let optionAmount = 0;
  const optionDetails: { optionId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

  if (options.length > 0) {
    const { data: optionData } = await supabase
      .from("options")
      .select("*")
      .in("id", options)
      .eq("vendor_id", vendorId)
      .eq("is_active", true);

    if (optionData) {
      const days = Math.max(1, priceResult.days || 1);
      for (const opt of optionData as Option[]) {
        const unitPrice = opt.price_per_day || opt.price_per_use || 0;
        const subtotal = opt.price_per_day ? unitPrice * days : unitPrice;
        optionAmount += subtotal;
        optionDetails.push({
          optionId: opt.id,
          quantity: opt.price_per_day ? days : 1,
          unitPrice,
          subtotal,
        });
      }
    }
  }

  // CDW: クラス別料金（NOCは事故時のみ発生のため予約時は0）
  const vehicleClass = getVehicleClassFromDisplacement(bike.displacement);
  const days = Math.max(1, priceResult.days || 1);
  const cdwPerDay = getCDWPriceForClass(vehicleClass);
  const cdwAmount = cdw ? cdwPerDay * days : 0;
  const nocAmount = 0; // NOCは事故時のみ — 予約時の料金に含めない

  const totalAmount = baseAmount + optionAmount + cdwAmount + nocAmount;

  // Create reservation
  const insertData = {
    user_id: user.id,
    bike_id: bikeId,
    vendor_id: vendorId,
    start_datetime: startDatetime,
    end_datetime: endDatetime,
    rental_duration: rentalDuration,
    status: "pending" as const,
    base_amount: baseAmount,
    option_amount: optionAmount,
    cdw_amount: cdwAmount,
    cdw_enabled: cdw,
    noc_amount: nocAmount,
    total_amount: totalAmount,
    notes: notes || null,
  };

  const { data: reservationData, error: reservationError } = await supabase
    .from("reservations")
    .insert(insertData as any)
    .select()
    .single();

  const reservation = reservationData as Reservation | null;

  if (reservationError) {
    return NextResponse.json(
      { error: "Database error", message: reservationError.message },
      { status: 500 }
    );
  }

  // Insert reservation options
  if (optionDetails.length > 0 && reservation) {
    const optionInserts: Omit<ReservationOption, "id" | "created_at">[] = optionDetails.map((od) => ({
      reservation_id: reservation.id,
      option_id: od.optionId,
      quantity: od.quantity,
      unit_price: od.unitPrice,
      subtotal: od.subtotal,
    }));

    await supabase.from("reservation_options").insert(optionInserts as any);
  }

  return NextResponse.json(
    {
      success: true,
      message: "予約が作成されました",
      data: {
        id: reservation?.id,
        status: reservation?.status,
        totalAmount: totalAmount,
        created_at: reservation?.created_at,
      },
    },
    { status: 201 }
  );
}
