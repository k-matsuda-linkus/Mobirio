import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("DELETE /api/vendor/closures/[id]", `vendor=${vendor.id}, id=${id}`);
    return NextResponse.json({ success: true, message: "休業日を削除しました", deleted_id: id });
  }

  const { error } = await supabase
    .from("vendor_closures")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "休業日を削除しました", deleted_id: id });
}
