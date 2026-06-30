import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/supabaseClient";

export type AppRole = "admin" | "supervisor" | "planejador" | "executante";

type AuthState = {
  user: User | null;
  loading: boolean;
  role: AppRole | null;
  approved: boolean;
  roleLoading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  role: null,
  approved: false,
  roleLoading: true,
  refreshRole: async () => {},
  signOut: async () => {},
});

const ROLE_PRIORITY: AppRole[] = ["admin", "supervisor", "planejador", "executante"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [approved, setApproved] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  async function fetchRole(uid: string | null) {
    if (!uid) {
      setRole(null);
      setApproved(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("role, approved")
      .eq("user_id", uid);
    if (!data || data.length === 0) {
      setRole(null);
      setApproved(false);
    } else {
      const approvedRows = data.filter((r: any) => r.approved);
      const pick = ROLE_PRIORITY.find((r) => approvedRows.some((row: any) => row.role === r));
      if (pick) {
        setRole(pick);
        setApproved(true);
      } else {
        // tem registro porem nao aprovado
        const pending = ROLE_PRIORITY.find((r) => data.some((row: any) => row.role === r));
        setRole(pending ?? "executante");
        setApproved(false);
      }
    }
    setRoleLoading(false);
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const u = data.user ?? null;
      setUser(u);
      setLoading(false);
      fetchRole(u?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      fetchRole(u?.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function refreshRole() {
    await fetchRole(user?.id ?? null);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, role, approved, roleLoading, refreshRole, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
