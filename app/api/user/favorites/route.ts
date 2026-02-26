import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";
import { mockFavorites } from "@/lib/mock/favorites";
import { mockBikes } from "@/lib/mock/bikes";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user, supabase } = authResult;

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("GET /api/user/favorites", `user=${user.id}`);

    const userFavs = mockFavorites.filter((f) => f.user_id === user.id);
    const data = userFavs.map((fav) => {
      const bike = mockBikes.find((b) => b.id === fav.bike_id);
      return {
        id: fav.id,
        bike_id: fav.bike_id,
        created_at: fav.created_at,
        bike: bike
          ? {
              id: bike.id,
              name: bike.name,
              model: bike.model,
              manufacturer: bike.manufacturer,
              image_urls: bike.image_urls,
              daily_rate_1day: bike.daily_rate_1day,
              vehicle_class: bike.vehicle_class,
              vendor_id: bike.vendor_id,
            }
          : null,
      };
    });

    return NextResponse.json({ data });
  }

  const { data, error } = await supabase
    .from("favorites")
    .select(
      `
      id,
      bike_id,
      created_at,
      bike:bikes(id, name, model, manufacturer, image_urls, daily_rate_1day, vehicle_class, vendor_id)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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

  const { bike_id } = body;

  if (!bike_id) {
    return NextResponse.json(
      { error: "Validation error", message: "bike_id は必須です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("POST /api/user/favorites", `user=${user.id}, bike=${bike_id}`);
    return NextResponse.json(
      {
        success: true,
        message: "お気に入りに追加しました",
        data: {
          id: `fav-sandbox-${Date.now()}`,
          user_id: user.id,
          bike_id,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }

  // 重複チェック
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("bike_id", bike_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Conflict", message: "既にお気に入りに追加されています" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, bike_id })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: "お気に入りに追加しました", data },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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

  const { bike_id } = body;

  if (!bike_id) {
    return NextResponse.json(
      { error: "Validation error", message: "bike_id は必須です" },
      { status: 400 }
    );
  }

  // Sandbox モード
  if (isSandboxMode()) {
    sandboxLog("DELETE /api/user/favorites", `user=${user.id}, bike=${bike_id}`);
    return NextResponse.json({ success: true, message: "お気に入りから削除しました" });
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("bike_id", bike_id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "お気に入りから削除しました" });
}
