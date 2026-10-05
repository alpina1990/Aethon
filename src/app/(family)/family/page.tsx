"use client";

import { UpdatesFeed } from "@/components/family/UpdatesFeed";
import { useFamilyResident } from "@/hooks/useFamilyResident";
import { Heart, MessageCircle, MapPin, ShieldCheck, Loader2, Calendar as CalendarIcon, User } from "lucide-react";
import Link from "next/link";

export default function FamilyDashboard() {
  const { residentInfo, loading } = useFamilyResident();
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  if (loading) return (
    <div className="relative min-h-full pb-6">
      <main className="px-5 py-6 space-y-6 animate-pulse">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 h-[140px]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl h-[100px]" />
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl h-[100px]" />
        </div>
        <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl h-[200px]" />
      </main>
    </div>
  );

  const firstName = residentInfo?.first_name || "your loved one";
  const initial = firstName.charAt(0);
  
  // Format care stage safely
  const formatCareStage = (stage?: string) => {
    if (!stage) return "Care Plan Active";
    return stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="relative min-h-full pb-6">
      <main className="px-5 py-6">

        {/* Premium iOS-style Header Card */}
        <div className="animate-fade-in-up bg-white dark:bg-[#0a0a0a] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 mb-6 relative overflow-hidden">
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shadow-sky-500/20">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {firstName}&apos;s Day
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-500 mt-0.5">{today}</p>
            </div>
          </div>

          {/* Quick Status Pills */}
          <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">
                {formatCareStage(residentInfo?.care_stage)}
              </span>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 shrink-0">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-bold text-sky-700">
                Room {residentInfo?.room_number || "TBD"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Tiles */}
        <div className="animate-fade-in-up delay-100 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link 
            href="/family/messages" 
            className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-sky-200 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-100 transition-transform">
              <MessageCircle className="w-6 h-6 text-sky-600" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Message Team</span>
          </Link>
          
          <Link 
            href="/family/vitals" 
            className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-rose-200 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-100 transition-transform">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Health & Meds</span>
          </Link>
          
          <Link 
            href="/family/planner" 
            className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-indigo-200 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-100 transition-transform">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Visit Planner</span>
          </Link>
          
          <Link 
            href="/family/profile" 
            className="group bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-emerald-200 hover:shadow-md active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-transform">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Full Profile</span>
          </Link>
        </div>

        {/* Timeline Section */}
        <div className="animate-fade-in-up delay-200">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Today's Care Timeline</h2>
          </div>
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl p-2 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <UpdatesFeed />
          </div>
        </div>
      </main>
    </div>
  );
}
