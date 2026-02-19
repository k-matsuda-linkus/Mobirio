import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  // TODO: Implement middleware client
  return null as unknown as ReturnType<typeof createServerClient<Database>>;
}
