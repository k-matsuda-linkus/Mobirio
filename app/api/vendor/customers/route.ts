import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/requireAuth";
import { isSandboxMode, sandboxLog } from "@/lib/sandbox";

const mockCustomers = [
  { id: "user_001", name: "田中太郎", email: "tanaka@example.com", total_rentals: 5, last_rental: "2025-05-15" },
  { id: "user_003", name: "佐藤次郎", email: "sato@example.com", total_rentals: 2, last_rental: "2025-04-20" },
];

export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendor, supabase } = authResult;

  if (isSandboxMode()) {
    sandboxLog("GET /api/vendor/customers", `vendor=${vendor.id}`);
    return NextResponse.json({ data: mockCustomers, message: "OK" });
  }

  const { data, error } = await supabase
    .from("reservations")
    .select("user_id, users(id, full_name, email)")
    .eq("vendor_id", vendor.id)
    .not("user_id", "is", null);

  if (error) {
    return NextResponse.json(
      { error: "Database error", message: error.message },
      { status: 500 }
    );
  }

  // ユーザーごとに集計
  const userMap = new Map<string, { id: string; name: string; email: string; total_rentals: number; last_rental: string }>();
  for (const row of (data ?? []) as unknown as Array<{ user_id: string; users: { id: string; full_name: string; email: string } | null }>) {
    const user = row.users;
    if (!user) continue;
    const existing = userMap.get(user.id);
    if (existing) {
      existing.total_rentals += 1;
    } else {
      userMap.set(user.id, {
        id: user.id,
        name: user.full_name,
        email: user.email,
        total_rentals: 1,
        last_rental: "",
      });
    }
  }

  return NextResponse.json({ data: Array.from(userMap.values()), message: "OK" });
}
