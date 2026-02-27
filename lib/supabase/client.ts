import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// HMR による重複生成防止（window + module 二重キャッシュ）
const WINDOW_KEY = "__mobirio_supabase";
let moduleClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (typeof window !== "undefined" && (window as any)[WINDOW_KEY]) {
    return (window as any)[WINDOW_KEY] as ReturnType<typeof createBrowserClient<Database>>;
  }
  if (moduleClient) return moduleClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables not set: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
    );
  }

  const client = createBrowserClient<Database>(url, key);
  if (typeof window !== "undefined") (window as any)[WINDOW_KEY] = client;
  moduleClient = client;
  return client;
}
