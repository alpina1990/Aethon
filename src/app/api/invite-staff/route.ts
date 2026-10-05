import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
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

    if (!inviterProfile || (inviterProfile.role !== 'superadmin' && inviterProfile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!inviterProfile.facility_id) {
       return NextResponse.json({ error: 'You are not attached to a facility' }, { status: 400 });
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: dbError } = await supabaseAdmin
      .from('invite_codes')
      .insert([
        {
          code: code,
          kind: role,
          facility_id: inviterProfile.facility_id,
          created_by: user.id,
          max_uses: 1,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

    if (dbError) throw dbError;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Aethon Health <invites@resend.dev>',
        to: email.trim(),
        subject: `You have been invited to join Aethon Health as ${role}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
            <div style="background-color: #0ea5e9; padding: 12px; border-radius: 50%; width: 48px; height: 48px; margin: 0 auto 24px;">
              <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width: 24px; height: 24px; margin-top: 12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <h1 style="color: #0f172a; margin-bottom: 8px;">Aethon Staff Invite</h1>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 32px;">You have been invited as a <strong>${role}</strong>.</p>
            
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="color: #475569; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; margin-top: 0;">Your Invite Code</p>
              <div style="font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: 4px;">${code}</div>
            </div>

            <p style="color: #64748b; font-size: 14px;">1. Go to <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #0ea5e9;">${process.env.NEXT_PUBLIC_SITE_URL}</a></p>
            <p style="color: #64748b; font-size: 14px;">2. Click "Facility Management"</p>
            <p style="color: #64748b; font-size: 14px;">3. Sign in with Google using this email address</p>
            <p style="color: #64748b; font-size: 14px;">4. Enter your 6-digit code</p>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
