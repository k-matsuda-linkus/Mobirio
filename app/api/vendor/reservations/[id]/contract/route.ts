import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * POST /api/vendor/reservations/[id]/contract
 * Generate a rental contract PDF for a reservation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { vendor } = authResult;

  let body: { language?: "ja" | "en" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", message: "リクエストボディが不正です" },
      { status: 400 }
    );
  }

  const language = body.language ?? "ja";
  const validLanguages = ["ja", "en"];

  if (!validLanguages.includes(language)) {
    return NextResponse.json(
      {
        error: "Bad request",
        message: "language は ja または en を指定してください",
      },
      { status: 400 }
    );
  }

  // TODO: Replace with actual contract PDF generation
  // 1. Fetch reservation and verify vendor ownership
  // 2. Fetch related data (user, bike, options, etc.)
  // 3. Generate PDF using a template
  // 4. Upload to storage and return URL
  // 5. Increment output_count

  const mockResponse = {
    reservation_id: id,
    vendor_id: vendor.id,
    language,
    url: `https://storage.example.com/contracts/${vendor.id}/${id}_${language}.pdf`,
    output_count: 1,
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json({
    data: mockResponse,
    message: "契約書を生成しました",
  });
}
