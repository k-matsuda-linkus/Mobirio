import type { NotificationType } from "@/types/database";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/** 通知を1件作成 */
export async function createNotification(
  supabase: SupabaseClient,
  params: NotificationParams
) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }

  return { error };
}

/** 通知を一括作成 */
export async function createNotifications(
  supabase: SupabaseClient,
  notifications: NotificationParams[]
) {
  if (notifications.length === 0) return { error: null };

  const rows = notifications.map((n) => ({
    user_id: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link ?? null,
  }));

  const { error } = await supabase.from("notifications").insert(rows);

  if (error) {
    console.error("Failed to create notifications:", error);
  }

  return { error };
}
