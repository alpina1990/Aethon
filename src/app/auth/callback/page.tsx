"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    let isMounted = true;
    const syncSession = async () => {
      try {
        const supabase = createClient();
        
        const code = searchParams.get('code');
        const errParam = searchParams.get('error');
        const errDesc = searchParams.get('error_description');
        
        if (errParam) {
           throw new Error(`OAuth Error: ${errParam} - ${errDesc}`);
        }

        let step = "Initial";
        if (code) {
          step = "Exchanging code...";
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
             setDebugInfo({ exchangeErr });
             throw exchangeErr;
          }
        }

        step = "Getting session...";
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!session) {
          step = "Waiting for hash fragment...";
          session = await new Promise((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
              if (newSession) {
                subscription.unsubscribe();
                resolve(newSession);
              }
            });
            setTimeout(() => {
              subscription.unsubscribe();
              resolve(null);
            }, 2500);
          });
        }

        if (!session) {
          setDebugInfo({ url: window.location.href, code });
          throw new Error("No active session found. Supabase did not return a session.");
        }

        const role = searchParams.get('role') || 'family';

        step = "Syncing profile on server...";
        const res = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role })
        });

        if (!res.ok) {
          const errData = await res.json();
          setDebugInfo({ syncErr: errData });
          throw new Error(errData.error || "Failed to sync profile");
        }

        const { redirectUrl } = await res.json();
        
        if (isMounted) {
          router.push(redirectUrl);
        }
      } catch (err: any) {
        console.error("Callback error:", err);
        if (isMounted) setError(err.message);
      }
    };

    syncSession();
    return () => { isMounted = false; };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="p-8 max-w-2xl w-full bg-white rounded-2xl shadow-sm text-center border border-red-100">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-red-600 mb-6 font-semibold">{error}</p>
          
          <div className="bg-gray-100 p-4 rounded text-left text-xs text-gray-700 font-mono mb-6 overflow-auto">
             <p>Debug Info:</p>
             <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

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
    <Suspense fallback={<div />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
