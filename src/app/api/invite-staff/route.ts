import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('role, facility_id')
      .eq('id', user.id)
      .single();

    if (!inviterProfile || (inviterProfile.role !== 'admin' && inviterProfile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden: only admins can invite staff' }, { status: 403 });
    }

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // WORKAROUND: The iOS database schema has a strict check constraint on invite_codes requiring a resident_id.
    // To invite staff, we must use a dummy System resident for this facility.
    let dummyResidentId = null;
    const { data: existingDummy } = await supabaseAdmin
      .from('residents')
      .select('id')
      .eq('facility_id', inviterProfile.facility_id)
      .eq('first_name', 'System')
      .eq('last_name', 'Staff Access')
      .limit(1)
      .single();

    if (existingDummy) {
      dummyResidentId = existingDummy.id;
    } else {
      const { data: newDummy, error: dummyErr } = await supabaseAdmin
        .from('residents')
        .insert([{
          first_name: 'System',
          last_name: 'Staff Access',
          facility_id: inviterProfile.facility_id,
          care_stage: 'Independent'
        }])
        .select('id')
        .single();
      if (dummyErr) throw dummyErr;
      dummyResidentId = newDummy.id;
    }

    // Generate 6-digit alphanumeric code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Insert into invite_codes
    const { error: dbError } = await supabaseAdmin
      .from('invite_codes')
      .insert([
        {
          code: code,
          kind: role,
          facility_id: inviterProfile.facility_id,
          resident_id: dummyResidentId, // Bypass check constraint
          created_by: user.id,
          max_uses: 1,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

    if (dbError) throw dbError;

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'Aethon Health <invites@resend.dev>',
          to: email.trim(),
          subject: 'You have been invited to Aethon Health',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #0ea5e9;">Aethon Health Invitation</h2>
              <p>You have been invited as a <strong>${role}</strong>.</p>
              <p>To join, log in to the Aethon Web Dashboard and enter the following 6-digit access code:</p>
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 14px;">This code expires in 7 days and can only be used once.</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, code });

  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
