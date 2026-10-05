"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Search, MapPin, UserPlus, Loader2, X, Check } from "lucide-react";

type ClientData = {
  id: string;
  first_name: string;
  last_name: string;
  room_number: string | null;
  care_stage: string;
  last_note: { date: string; task: string } | null;
};

const formatCareStage = (stage?: string) => {
  if (!stage) return 'New Client';
  return stage
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    room_number: "",
    care_stage: "Independent"
  });

  const supabase = createClient();

  const fetchClients = async () => {
    const { data } = await supabase.from('residents').select(`
      id, first_name, last_name, room_number, care_stage,
      visit_notes ( visit_type, created_at, tasks_completed, notes )
    `);

    if (data) {
      const formatted = data.map((r: any) => {
        const notes = (r.visit_notes || []).filter((n: any) => !n.visit_type?.toLowerCase().startsWith('handover'));
        notes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return {
          id: r.id,
          first_name: r.first_name,
          last_name: r.last_name,
          room_number: r.room_number,
          care_stage: r.care_stage,
          last_note: notes.length > 0 ? {
            date: new Date(notes[0].created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            task: notes[0].notes || notes[0].tasks_completed || 'Update logged'
          } : null
        };
      });
      setClients(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('facility_id')
      .eq('id', user.id)
      .single();
      
    if (!profile?.facility_id) {
       console.error("No facility ID found for user");
       setIsSubmitting(false);
       return;
    }
    
    await supabase.from('residents').insert([{
      first_name: newClient.first_name,
      last_name: newClient.last_name,
      room_number: newClient.room_number,
      care_stage: newClient.care_stage,
      facility_id: profile.facility_id
    }]);

    await fetchClients(); // Refresh list to get new client
    
    // Silently sync billing quantity with Stripe
    fetch('/api/billing/sync', { method: 'POST' }).catch(console.error);
    
    setIsSubmitting(false);
    setIsModalOpen(false);
    setNewClient({ first_name: "", last_name: "", room_number: "", care_stage: "Independent" }); // reset
  };

  const filteredClients = clients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.room_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <main className="p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 max-w-[1200px] mx-auto w-full pb-20 lg:pb-32">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 animate-fade-in-up">
          <div className="hidden md:block">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Client Directory</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-500 dark:text-zinc-400 mt-1">
              Manage residents and invite family members.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[42px] pl-10 pr-4 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-2xl h-96 flex items-center justify-center animate-fade-in-up delay-100 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up delay-100">
            
            {/* Add New Client Card */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-50 dark:bg-zinc-900/50 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-3 md:gap-4 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:bg-zinc-900 dark:hover:bg-slate-800 dark:bg-zinc-900 transition-all border-dashed border-2 border-slate-300 dark:border-slate-700 min-h-[160px] md:min-h-[200px] group cursor-pointer btn-press"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all shadow-sm">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-slate-500 dark:text-slate-500 dark:text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">Admit New Client</p>
            </button>

            {/* Render Clients */}
            {filteredClients.map((c, i) => (
              <Link href={`/management/clients/${c.id}`} key={c.id} className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 md:p-6 hover:shadow-md hover:border-slate-300 dark:border-slate-700 transition-all flex flex-col justify-between min-h-[160px] md:min-h-[200px] shadow-sm group" style={{animationDelay: `${i * 50}ms`}}>
                <div>
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center border border-slate-200 dark:border-zinc-800 group-hover:border-slate-300 dark:border-slate-700 transition-colors">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base">{c.first_name[0]}{c.last_name[0]}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-800 shadow-sm">
                      {formatCareStage(c.care_stage)}
                    </span>
                  </div>
                  
                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">{c.first_name} {c.last_name}</h3>
                  
                  <div className="flex items-center gap-3 mt-2 md:mt-3">
                    <div className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-slate-500 dark:text-zinc-400">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {c.care_stage === 'FACILITY' || c.care_stage === 'Facility' ? (c.room_number ? `Room ${c.room_number}` : 'No Room Assigned') : (c.room_number || 'Home Address Pending')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 md:pt-4 border-t border-slate-100 dark:border-zinc-800/50 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs font-medium text-slate-400">Latest update</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[120px] text-right">
                    {c.last_note ? `${c.last_note.date} - ${c.last_note.task}` : "No notes yet"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Admit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-fade-in-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/30">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Admit New Client</h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 mt-0.5">Add a resident to the facility.</p>
              </div>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">First Name</label>
                  <input 
                    type="text" required
                    value={newClient.first_name}
                    onChange={e => setNewClient({...newClient, first_name: e.target.value})}
                    className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Last Name</label>
                  <input 
                    type="text" required
                    value={newClient.last_name}
                    onChange={e => setNewClient({...newClient, last_name: e.target.value})}
                    className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">
                  {newClient.care_stage === 'FACILITY' || newClient.care_stage === 'Facility' ? 'Room / Bed Number' : 'Home Address / Care Zone'}
                </label>
                <input 
                  type="text" required
                  placeholder={newClient.care_stage === 'FACILITY' || newClient.care_stage === 'Facility' ? 'e.g. Room 204, Bed B' : 'e.g. Bahnhofstrasse 12, Zurich'}
                  value={newClient.room_number}
                  onChange={e => setNewClient({...newClient, room_number: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Care Stage</label>
                <select 
                  value={newClient.care_stage}
                  onChange={e => setNewClient({...newClient, care_stage: e.target.value})}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none text-slate-900 dark:text-white"
                >
                  <option value="Independent">Independent</option>
                  <option value="Home care">Home care</option>
                  <option value="Facility">Facility</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Admit Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Inline icon
function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

