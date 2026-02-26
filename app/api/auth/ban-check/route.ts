import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockUsers } from '@/lib/mock/users';

export async function GET(request: NextRequest) {
  // Sandbox モード
  if (isSandboxMode()) {
    const user = mockUsers[0];
    return NextResponse.json({ banned: user.is_banned });
  }

  // Supabase モード
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ banned: false });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_banned')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ banned: profile?.is_banned ?? false });
  } catch {
    return NextResponse.json({ banned: false });
  }
}
