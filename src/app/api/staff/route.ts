import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Verify user is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, facility_id')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'superadmin' && profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch active staff (ONLY for this facility)
    const { data: activeStaff } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, role, nurse_id')
      .in('role', ['admin', 'staff', 'caregiver'])
      .eq('facility_id', profile.facility_id);

    // 3. Fetch pending invites (ONLY for this facility)
    const { data: pendingInvites } = await supabaseAdmin
      .from('staff_invitations')
      .select('id, email, role, created_at')
      .eq('facility_id', profile.facility_id);

    return NextResponse.json({ 
      active: activeStaff || [],
      pending: pendingInvites || []
    });

  } catch (error: any) {
    console.error('Staff fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { full_name, role } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('user_profiles').select('role, facility_id').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only admins can provision staff IDs' }, { status: 403 });
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Generate unique 4-digit ID
    let nurseId = '';
    let isUnique = false;
    while (!isUnique) {
      nurseId = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: existing } = await supabaseAdmin.from('user_profiles').select('id').eq('nurse_id', nurseId).single();
      if (!existing) isUnique = true;
    }

    // Generate random 4-digit PIN
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    const email = `staff_${nurseId}@aethon.local`;
    const password = `PIN-${tempPin}`;

    // Create user in Supabase Auth
    const { data: newUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (authErr) throw authErr;

    // Insert into user_profiles
    const { error: profileErr } = await supabaseAdmin.from('user_profiles').upsert({
      id: newUser.user.id,
      full_name,
      role: role || 'caregiver',
      facility_id: profile.facility_id,
      nurse_id: nurseId
    });

    if (profileErr) throw profileErr;

    return NextResponse.json({ 
      success: true, 
      nurse_id: nurseId, 
      temp_pin: tempPin 
    });

  } catch (error: any) {
    console.error('Provisioning error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
