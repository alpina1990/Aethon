"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useFamilyResident() {
  const [residentId, setResidentId] = useState<string | null>(null);
  const [residentInfo, setResidentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasNoInvite, setHasNoInvite] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAccess() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          setLoading(false); 
          return; 
        }

        // The iOS schema stores the resident_id directly in user_profiles
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('resident_id')
          .eq('id', user.id)
          .single();

        if (!profile?.resident_id) {
          setHasNoInvite(true);
          setLoading(false);
          return;
        }

        setResidentId(profile.resident_id);

        const { data: resData } = await supabase
          .from('residents')
          .select('*')
          .eq('id', profile.resident_id)
          .single();
          
        if (resData) setResidentInfo(resData);
      } catch (err) {
        console.error("Error fetching family resident:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccess();
  }, []);

  return { residentId, residentInfo, loading, hasNoInvite };
}
