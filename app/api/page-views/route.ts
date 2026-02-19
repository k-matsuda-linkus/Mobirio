import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/page-views
 * Record a page view event. This endpoint does not require authentication
 * since it is called from public-facing pages.
 */
export async function POST(request: NextRequest) {
  let body: {
    vendor_id?: string;
    bike_id?: string;
    page_type?: string;
    device_type?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  if (!body.vendor_id || !body.page_type) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "vendor_id と page_type は必須です",
      },
      { status: 400 }
    );
  }

  const validPageTypes = ["shop", "bike", "reservation"];
  if (!validPageTypes.includes(body.page_type)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "page_type は shop, bike, reservation のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  const validDeviceTypes = ["pc", "sp", "tablet"];
  if (body.device_type && !validDeviceTypes.includes(body.device_type)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "device_type は pc, sp, tablet のいずれかを指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with Supabase insert once schema is applied
  // const supabase = await createServerSupabaseClient();
  // await supabase.from("page_views").insert({
  //   vendor_id: body.vendor_id,
  //   bike_id: body.bike_id || null,
  //   page_type: body.page_type,
  //   device_type: body.device_type || "pc",
  //   viewed_at: new Date().toISOString(),
  // });

  const recorded = {
    id: `pv_${Date.now()}`,
    vendor_id: body.vendor_id,
    bike_id: body.bike_id ?? null,
    page_type: body.page_type,
    device_type: body.device_type ?? "pc",
    viewed_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { data: recorded, message: "OK" },
    { status: 201 }
  );
}
