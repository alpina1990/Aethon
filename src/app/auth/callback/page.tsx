"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      try {
        const supabase = createClient();
        
        // This handles both ?code= (PKCE) and #access_token= (Implicit)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw new Error(sessionError?.message || "No active session found. Please try logging in again.");
        }

        const role = searchParams.get('role') || 'family';

        // Call our secure backend to sync the profile (superadmin, staff invites, etc)
        const res = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to sync profile");
        }

        const { redirectUrl } = await res.json();
        
        // Redirect to the correct dashboard
        router.push(redirectUrl);
      } catch (err: any) {
        console.error("Callback error:", err);
        setError(err.message);
      }
    };

    syncSession();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="p-8 max-w-md w-full bg-white rounded-2xl shadow-sm text-center border border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full bg-navy text-white rounded-xl py-3 font-semibold hover:bg-navy/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mb-4" />
      <p className="text-text-muted font-medium animate-pulse">Securing your session...</p>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mb-4" />
        <p className="text-text-muted font-medium animate-pulse">Loading...</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
