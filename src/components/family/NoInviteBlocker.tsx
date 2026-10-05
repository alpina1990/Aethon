"use client";

import { useState } from "react";
import { Heart, LogOut, KeyRound, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function NoInviteBlocker() {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid invite code');
      }
      
      // Force a hard navigation to reload layout and data
      window.location.href = data.redirectUrl || '/family';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-900/50">
      
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Heart className="w-10 h-10 text-rose-500" />
      </div>
      
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        You're Almost There
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium">
        To protect our residents' privacy, you need a 6-digit invite code from the care facility to access this dashboard.
      </p>

      <div className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 mb-8">
        <form onSubmit={handleRedeem} className="space-y-4">
          <div>
            <label className="block text-left text-xs font-bold text-slate-900 dark:text-zinc-100 mb-2">
              Enter Invite Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A9X2KL"
                className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-center text-xl font-black tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-zinc-700 placeholder:font-normal placeholder:tracking-normal transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-sm font-semibold text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Redeem Code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <button 
        onClick={handleSignOut}
        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold text-sm transition-colors"
      >
        Sign out and use a different account
      </button>
    </div>
  );
}
