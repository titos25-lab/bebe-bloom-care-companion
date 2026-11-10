import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
}

export function useBaby() {
  return useQuery({
    queryKey: ["baby"],
    queryFn: async () => {
      const { data, error } = await supabase.from("babies").select("*").order("created_at").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      return data;
    },
  });
}

export function useIsPremium() {
  return useQuery({
    queryKey: ["premium"],
    queryFn: async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return false;
      // Administrators have permanent Premium access without a paid subscription.
      const { data: admin } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      if (admin) return true;
      const { data } = await supabase.rpc("is_premium", { _user_id: u.id });
      return !!data;
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      return !!data;
    },
  });
}
