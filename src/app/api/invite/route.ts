import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
    const { email, residentId, residentName } = await request.json();

    if (!email || !residentId) {
      return NextResponse.json({ error: 'Email and Resident ID are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('facility_id')
      .eq('id', user.id)
      .single();

    if (!profile?.facility_id) {
       return NextResponse.json({ error: 'User not attached to a facility' }, { status: 400 });
    }

    // Insert into Supabase
    const { error: dbError } = await supabase
      .from('family_invitations')
      .insert([
        {
          email: email.trim(),
          resident_id: residentId,
          facility_id: profile.facility_id
        }
      ]);

    if (dbError) {
      // Ignore unique constraint if we are just resending
      if (dbError.code !== '23505') { 
         console.error('DB Error:', dbError);
         return NextResponse.json({ error: 'Failed to save invitation' }, { status: 500 });
      }
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://aethon-amber.vercel.app'}/login`;

    // 2. Create a beautiful HTML email template
    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #0f172a; margin-bottom: 0;">Aethon<span style="color: #0284c7; font-weight: 300;">Health</span></h1>
        </div>
        
        <div style="padding: 30px 0; color: #334155; line-height: 1.6;">
          <h2 style="color: #0f172a; font-size: 20px;">You've been invited to the Family Portal</h2>
          <p>Hello,</p>
          <p>You have been invited by the care team to access the Aethon Health Family Portal for <strong>${residentName || 'your loved one'}</strong>.</p>
          <p>Through the portal, you will be able to:</p>
          <ul style="color: #475569;">
            <li>View daily care updates and timelines</li>
            <li>Monitor real-time health vitals and trends</li>
            <li>Message the care team directly</li>
          </ul>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${loginUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Access Family Portal
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">
            To sign in, please click the button above and select "Sign in with Google" using this email address (<strong>${email}</strong>).
          </p>
        </div>
        
        <div style="padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>Built with Swiss Precision. Securely hosted in Switzerland.</p>
          <p>© ${new Date().getFullYear()} Alpina Health / Aethon Health</p>
        </div>
      </div>
    `;

    // 3. Send the email using Resend (DISABLED FOR NOW)
    // const { data, error: sendError } = await resend.emails.send({
    //   from: 'Aethon Health <onboarding@resend.dev>',
    //   to: email,
    //   subject: `Invitation to view care updates for ${residentName || 'your loved one'}`,
    //   html: htmlEmail,
    // });
    
    // if (sendError) {
    //   console.error('Resend Error:', sendError);
    //   return NextResponse.json({ error: sendError.message }, { status: 500 });
    // }

    // Mock success since email sending is disabled
    return NextResponse.json({ success: true, data: { id: 'mock-id' } });

  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
