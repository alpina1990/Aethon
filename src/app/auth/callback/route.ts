import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Custom param we passed from the login button to know where to route them
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Fetch the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        let finalRole = 'family'; // Default secure role

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Check if they were invited as staff using Service Role
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

        if (inviteError && inviteError.code !== 'PGRST116') {
           console.error("Invite fetch error:", inviteError);
           return NextResponse.redirect(`${origin}/family?err=invite_fetch_failed_${encodeURIComponent(inviteError.message)}`);
        }

        let facilityId = null;

        if (SUPER_ADMIN_EMAILS.includes(targetEmail)) {
          finalRole = 'superadmin';
        } else if (invite) {
          // Grant them the invited role
          finalRole = invite.role === 'admin' ? 'admin' : 'caregiver';
          facilityId = invite.facility_id;

          // Consume the invite
          await supabaseAdmin
            .from('staff_invitations')
            .delete()
            .ilike('email', targetEmail);
        } else {
          // If no invite, check if they already have a profile with a staff role
          const { data: profile, error: profileErr } = await supabaseAdmin
            .from('user_profiles')
            .select('role, facility_id')
            .eq('id', user.id)
            .single();
            
          if (profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'caregiver') {
            finalRole = profile.role;
          }
          facilityId = profile?.facility_id || null;
        }
        
        // Ensure they have a profile so the strict middleware RBAC doesn't block them
        const profileUpdate: any = {
          id: user.id,
          role: finalRole,
          full_name: user.user_metadata?.full_name || user.email || 'User'
        };
        
        if (facilityId) {
          profileUpdate.facility_id = facilityId;
        }

        const { error: upsertErr } = await supabaseAdmin.from('user_profiles').upsert(profileUpdate);

        if (upsertErr) {
           return NextResponse.redirect(`${origin}/family?err=upsert_failed_${encodeURIComponent(upsertErr.message)}`);
        }

        if (finalRole === 'superadmin') {
          const response = NextResponse.redirect(`${origin}/superadmin`)
          response.cookies.delete('demo_role')
          return response
        } else if (finalRole === 'admin' || finalRole === 'staff' || finalRole === 'caregiver') {
          const response = NextResponse.redirect(`${origin}/management`)
          response.cookies.delete('demo_role')
          return response
        } else {
          const response = NextResponse.redirect(`${origin}/family`)
          response.cookies.delete('demo_role')
          return response
        }
      }
      
      const response = NextResponse.redirect(`${origin}/family?err=no_user`)
      response.cookies.delete('demo_role')
      return response
    } else {
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=No+auth+code+provided`)
}
