import { MobileNav } from "@/components/ui/MobileNav";
import { createClient } from "@/utils/supabase/server";
import { NoInviteBlocker } from "@/components/family/NoInviteBlocker";
import { redirect } from "next/navigation";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if they are actually linked to a resident
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('resident_id')
    .eq('id', user.id)
    .single();

  const hasNoInvite = !profile?.resident_id;

  return (
    <div className="min-h-[100dvh] bg-slate-100 dark:bg-zinc-900 flex justify-center">
      {/* Mobile App Container Frame */}
      <div className="w-full max-w-[640px] bg-slate-50 dark:bg-zinc-900/50 min-h-[100dvh] relative shadow-2xl overflow-hidden border-x border-slate-200 dark:border-zinc-800/60 flex flex-col z-0">
        
        {hasNoInvite ? (
          <NoInviteBlocker />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pb-[72px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
              {children}
            </div>
            <MobileNav />
          </>
        )}
      </div>
    </div>
  );
}
