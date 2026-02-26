import { NextRequest, NextResponse } from 'next/server';
import { isSandboxMode } from '@/lib/sandbox';
import { mockUsers } from '@/lib/mock/users';

export async function GET(request: NextRequest) {
  // Sandbox モード
  if (isSandboxMode()) {
    const user = mockUsers[0];
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  }

  // Supabase モード
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'customer',
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
