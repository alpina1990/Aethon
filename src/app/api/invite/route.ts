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

    const { email, residentId } = await request.json();

    if (!email || !residentId) {
      return NextResponse.json({ error: 'Email and Resident ID are required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('facility_id')
      .eq('id', user.id)
      .single();

    if (!profile?.facility_id) {
       return NextResponse.json({ error: 'User not attached to a facility' }, { status: 400 });
    }

    const { data: resident } = await supabase
      .from('residents')
      .select('first_name, last_name')
      .eq('id', residentId)
      .single();

    // Generate a 6-digit uppercase alphanumeric code
    const code = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Insert into the new iOS-compatible invite_codes table
    const { error: dbError } = await supabase
      .from('invite_codes')
      .insert([
        {
          code: code,
          kind: 'family',
          resident_id: residentId,
          facility_id: profile.facility_id,
          created_by: user.id,
          max_uses: 1,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
      ]);

    if (dbError) throw dbError;

    // Send the email via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Aethon Health <invites@resend.dev>',
        to: email.trim(),
        subject: You have been invited to Aethon Health,
        html: 
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
            <div style="background-color: #0ea5e9; padding: 12px; border-radius: 50%; width: 48px; height: 48px; margin: 0 auto 24px;">
              <svg fill="none" stroke="white" viewBox="0 0 24 24" style="width: 24px; height: 24px; margin-top: 12px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            <h1 style="color: #0f172a; margin-bottom: 8px;">Aethon Family Invite</h1>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 32px;">You have been invited to follow 's care updates.</p>
            
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="color: #475569; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 8px; margin-top: 0;">Your Invite Code</p>
              <div style="font-size: 36px; font-weight: 900; color: #0f172a; letter-spacing: 4px;"></div>
            </div>

            <p style="color: #64748b; font-size: 14px;">1. Go to <a href="" style="color: #0ea5e9;"></a></p>
            <p style="color: #64748b; font-size: 14px;">2. Sign in with Google using this email address</p>
            <p style="color: #64748b; font-size: 14px;">3. Enter your 6-digit code</p>
          </div>
        
      });
    }

    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
