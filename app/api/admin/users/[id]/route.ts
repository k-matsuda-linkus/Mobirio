import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { isSandboxMode } from "@/lib/sandbox";
import { mockUsers, mockReservations } from "@/lib/mock";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  if (isSandboxMode()) {
    const user = mockUsers.find((u) => u.id === id);
    if (!user) {
      return NextResponse.json(
        { error: "Not found", message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const userReservations = mockReservations.filter((r) => r.user_id === id);
    const totalSpent = userReservations
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.total_amount, 0);

    return NextResponse.json({
      data: {
        user,
        stats: {
          total_reservations: userReservations.length,
          completed_reservations: userReservations.filter((r) => r.status === "completed").length,
          total_spent: totalSpent,
        },
        reservations: userReservations.slice(0, 20),
      },
      message: "OK",
    });
  }

  // 本番: Supabase
  try {
    const supabase = createAdminSupabaseClient();

    const [userResult, reservationsResult] = await Promise.all([
      supabase.from("users").select("*").eq("id", id).single(),
      supabase
        .from("reservations")
        .select(
          "id, status, total_amount, start_datetime, end_datetime, created_at, bike:bikes(id, name, model), vendor:vendors(id, name)"
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (userResult.error || !userResult.data) {
      return NextResponse.json(
        { error: "Not found", message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const reservations = reservationsResult.data || [];

    // 全予約の集計
    const { data: allResData } = await supabase
      .from("reservations")
      .select("total_amount, status")
      .eq("user_id", id);

    const allRes = allResData || [];
    const totalSpent = allRes
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.total_amount, 0);

    return NextResponse.json({
      data: {
        user: userResult.data,
        stats: {
          total_reservations: allRes.length,
          completed_reservations: allRes.filter((r) => r.status === "completed").length,
          total_spent: totalSpent,
        },
        reservations,
      },
      message: "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}
