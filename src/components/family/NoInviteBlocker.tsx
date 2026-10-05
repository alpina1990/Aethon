"use client";

import { Heart, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function NoInviteBlocker() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-zinc-900/50">
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Heart className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
        No Active Invitation
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 leading-relaxed font-medium">
        Sorry, your account hasn't been linked to a resident yet. Please ask the care facility to send an invite code to this email address.
      </p>
      <button 
        onClick={handleSignOut}
        className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
