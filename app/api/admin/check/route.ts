import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { getPermissions } from "@/lib/admin";
import { enforceMinDelay } from "@/lib/admin";

export async function GET(request: NextRequest) {
  return enforceMinDelay(handleCheck(request), 200);
}

async function handleCheck(request: NextRequest) {
  const authResult = await requireAdmin(request);

  if (authResult instanceof NextResponse) {
    return NextResponse.json(
      { isAdmin: false, role: null, permissions: [] },
      { status: 200 }
    );
  }

  const { adminRole } = authResult;

  return NextResponse.json({
    isAdmin: true,
    role: adminRole,
    permissions: getPermissions(adminRole),
  });
}
