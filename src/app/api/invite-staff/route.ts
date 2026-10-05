import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

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

    if (!profile?.facility_id) {
      return NextResponse.json({ error: 'Your account is not linked to a facility.' }, { status: 400 });
    }

    // Insert into Supabase using the Service Role Key to bypass strict RLS
    // (We already verified their admin permissions above)
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from('staff_invitations')
      .insert([
        {
          email: email.trim().toLowerCase(),
          role: role,
          invited_by: user.id,
          facility_id: profile.facility_id
        }
      ]);

    if (dbError) {
      if (dbError.code !== '23505') { 
         console.error('DB Error:', dbError);
         return NextResponse.json({ error: 'Database Error: ' + dbError.message }, { status: 500 });
      }
    }

    // Email sending has been removed per request.
    // The invitation is now purely database-driven. When the user logs in with this email,
    // the system will detect the pending invite and instantly upgrade their role.

    return NextResponse.json({ success: true, message: 'Invitation saved successfully' });

  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save invitation' }, { status: 500 });
  }
}
