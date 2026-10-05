"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, Check, Shield, Mail, KeyRound, Copy, Trash2, X, Users, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function StaffPage() {
  const supabase = createClient();
  const [staff, setStaff] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Provision State
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("caregiver");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{name: string, id: string, pin: string} | null>(null);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("caregiver");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.active) setStaff(data.active);
      if (data.pending) setPending(data.pending.filter((i: any) => i.used_count < i.max_uses));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newStaffName, role: newStaffRole })
      });
      const data = await res.json();
      
      if (res.ok) {
        setGeneratedCreds({
          name: newStaffName,
          id: data.nurse_id,
          pin: data.temp_pin
        });
        fetchStaff();
      } else {
        alert(data.error || "Failed to provision staff");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsProvisioning(false);
      setNewStaffName("");
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await fetch('/api/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      
      if (res.ok) {
        setGeneratedInviteCode(data.code);
        fetchStaff();
      } else {
        alert(data.error || "Failed to invite staff");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsInviting(false);
      setInviteEmail("");
    }
  };

  return (
    <main className="p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 max-w-[1200px] mx-auto w-full pb-20 lg:pb-32 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Staff & Caregivers</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Manage web access and tablet login credentials for your nursing staff.</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 md:gap-3">
          <button
            onClick={() => {
              setGeneratedCreds(null);
              setIsProvisionModalOpen(true);
            }}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm text-sm font-bold"
          >
            <KeyRound className="h-4 w-4" />
            <span>Tablet PIN</span>
          </button>
          <button
            onClick={() => {
              setGeneratedInviteCode(null);
              setIsInviteModalOpen(true);
            }}
            className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm font-bold"
          >
            <Mail className="h-4 w-4" />
            <span>Invite via Email</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Staff Section */}
          <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/20">
              <h3 className="font-bold text-slate-900 dark:text-white">Active Staff Directory</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-transparent text-slate-500 dark:text-zinc-500 font-semibold border-b border-slate-100 dark:border-zinc-800/50">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Nurse ID</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-500">
                        No caregivers found.
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex w-full md:w-auto items-center gap-2 md:gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-600 dark:text-zinc-300 uppercase shrink-0">
                              {member.full_name?.substring(0, 2) || 'ST'}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{member.full_name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-zinc-900/50 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {member.nurse_id ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-mono text-xs font-bold border border-blue-100 dark:border-blue-800/30">
                              <Shield className="h-3 w-3" />
                              {member.nurse_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic text-xs">No Tablet ID</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invites Section */}
          {pending.length > 0 && (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/20 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Pending Web Invites</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {pending.map((invite) => (
                  <div key={invite.id} className="flex flex-col bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-700 shadow-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500">
                        {invite.kind}
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 mb-1">Invite Code</p>
                      <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                        <code className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{invite.code}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(invite.code);
                            alert("Copied to clipboard!");
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provision Tablet Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
            <button 
              onClick={() => setIsProvisionModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            </button>
            
            {generatedCreds ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tablet Provisioned!</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-8">
                  Hand these credentials to <strong>{generatedCreds.name}</strong>. They can use these to log into the Android App.
                </p>
                
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-8">
                  <div className="mb-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nurse ID</div>
                    <div className="text-4xl font-mono font-black text-slate-900 dark:text-white tracking-[0.1em]">{generatedCreds.id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary PIN</div>
                    <div className="text-4xl font-mono font-black text-blue-600 dark:text-blue-400 tracking-[0.1em]">{generatedCreds.pin}</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProvisionStaff} className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 border border-slate-200 dark:border-zinc-800">
                    <KeyRound className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Provision Tablet ID</h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 mt-0.5">Generate a Nurse ID for Android access.</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
                      placeholder="e.g. Sarah Connor"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none text-slate-900 dark:text-white"
                    >
                      <option value="caregiver">Caregiver / Nurse</option>
                      <option value="staff">Administrative Staff</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProvisioning || !newStaffName.trim()}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProvisioning ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate ID"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Invite Email Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500 dark:text-zinc-500" />
            </button>
            
            {generatedInviteCode ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invite Sent!</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-8">
                  They will receive an email with this 6-digit code to join the dashboard.
                </p>
                
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-8">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Web Invite Code</div>
                  <div className="text-5xl font-mono font-black text-slate-900 dark:text-white tracking-[0.1em]">{generatedInviteCode}</div>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteStaff} className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/30">
                    <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Invite via Email</h2>
                    <p className="text-xs font-semibold text-slate-500 dark:text-zinc-500 mt-0.5">Send a 6-digit access code for Web Login.</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-white"
                      placeholder="e.g. nurse@aethon.local"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none text-slate-900 dark:text-white"
                    >
                      <option value="caregiver">Caregiver / Nurse</option>
                      <option value="staff">Administrative Staff</option>
                      <option value="admin">Facility Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isInviting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}



