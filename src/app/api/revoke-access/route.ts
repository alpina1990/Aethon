import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, residentId } = await request.json();

    if (!userId || !residentId) {
      return NextResponse.json({ error: 'User ID and residentId are required' }, { status: 400 });
    }

    // Verify the user is an admin or superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, facility_id')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update using service role to bypass RLS
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ resident_id: null })
      .eq('id', userId)
      .eq('resident_id', residentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Revoke access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
