import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";

/**
 * DELETE /api/vendor/closures/[id]
 * Remove a closure date.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // TODO: Replace with Supabase delete once schema is applied
  // 1. Fetch the closure to verify it belongs to this vendor
  // 2. Delete the row

  return NextResponse.json({
    success: true,
    message: "休業日を削除しました",
    deleted_id: id,
  });
}
