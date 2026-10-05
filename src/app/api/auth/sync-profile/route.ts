import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Auth session is already set by the client component's getSession()
    // and passed via cookies securely to this server route!
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let finalRole = 'family'; // Default secure role

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const targetEmail = user.email?.toLowerCase().trim() || '';

    const SUPER_ADMIN_EMAILS = [
      'flynn@alpinahealth.ch',
      'divesh@alpinahealth.ch',
      'selena@alpinahealth.ch',
      'info@alpinahealth.ch'
    ];

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('staff_invitations')
      .select('role, facility_id')
      .ilike('email', targetEmail)
      .single();

    let facilityId = null;

    if (SUPER_ADMIN_EMAILS.includes(targetEmail)) {
      finalRole = 'superadmin';
    } else if (invite) {
      finalRole = invite.role === 'admin' ? 'admin' : 'caregiver';
      facilityId = invite.facility_id;
      await supabaseAdmin.from('staff_invitations').delete().ilike('email', targetEmail);
    } else {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, facility_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'caregiver') {
        finalRole = profile.role;
      }
      facilityId = profile?.facility_id || null;
    }
    
    const profileUpdate: any = {
      id: user.id,
      role: finalRole,
      full_name: user.user_metadata?.full_name || user.email || 'User'
    };
    
    if (facilityId) {
      profileUpdate.facility_id = facilityId;
    }

    await supabaseAdmin.from('user_profiles').upsert(profileUpdate);

    let redirectUrl = '/family';
    if (finalRole === 'superadmin') {
      redirectUrl = '/superadmin';
    } else if (finalRole === 'admin' || finalRole === 'staff' || finalRole === 'caregiver') {
      redirectUrl = '/management';
    }

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err: any) {
    console.error("Profile sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
