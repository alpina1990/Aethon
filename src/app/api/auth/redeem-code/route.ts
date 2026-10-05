import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit code' }, { status: 400 });
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the invite code
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite code' }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 });
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json({ error: 'This invite code has already been used' }, { status: 400 });
    }

    // Mark the code as used
    await supabaseAdmin
      .from('invite_codes')
      .update({ used_count: invite.used_count + 1 })
      .eq('id', invite.id);

    // Create or update the user's profile with the new role and facility
    const profileUpdate: any = {
      id: user.id,
      role: invite.kind,
      facility_id: invite.facility_id,
      full_name: user.user_metadata?.full_name || user.email || 'User'
    };

    if (invite.kind === 'family' && invite.resident_id) {
      profileUpdate.resident_id = invite.resident_id;
    }

    // We also generate a random 4-digit nurse_id if they are a caregiver or staff
    if (invite.kind === 'caregiver' || invite.kind === 'staff') {
      profileUpdate.nurse_id = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const { error: upsertError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileUpdate);

    if (upsertError) throw upsertError;

    // Create join request record for audit trail
    await supabaseAdmin.from('join_requests').insert([{
      user_id: user.id,
      facility_id: invite.facility_id,
      code_id: invite.id,
      status: 'approved',
      decided_by: invite.created_by,
      decided_at: new Date().toISOString()
    }]);

    let redirectUrl = '/family';
    if (invite.kind === 'superadmin') {
      redirectUrl = '/superadmin';
    } else if (invite.kind === 'admin' || invite.kind === 'staff' || invite.kind === 'caregiver') {
      redirectUrl = '/management';
    }

    return NextResponse.json({ success: true, redirectUrl });
  } catch (error: any) {
    console.error('Redeem error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
