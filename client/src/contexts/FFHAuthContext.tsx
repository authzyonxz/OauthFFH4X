import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface FFHUser {
  id: number;
  username: string;
  role: "admin" | "reseller";
  credits: number;
  plan?: string | null;
  accountExpiresAt?: Date | null;
}

interface FFHAuthContextType {
  user: FFHUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const FFHAuthContext = createContext<FFHAuthContextType | null>(null);

export function FFHAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FFHUser | null>(null);
  const [loading, setLoading] = useState(true);

  const meQuery = trpc.ffhAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = trpc.ffhAuth.login.useMutation();
  const logoutMutation = trpc.ffhAuth.logout.useMutation();

  useEffect(() => {
    if (!meQuery.isLoading) {
      setUser(meQuery.data as FFHUser | null);
      setLoading(false);
    }
  }, [meQuery.data, meQuery.isLoading]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginMutation.mutateAsync({ username, password });
    setUser(result.user as FFHUser);
    meQuery.refetch();
  }, [loginMutation, meQuery]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
  }, [logoutMutation]);

  const refetch = useCallback(() => {
    meQuery.refetch();
  }, [meQuery]);

  return (
    <FFHAuthContext.Provider value={{ user, loading, login, logout, refetch }}>
      {children}
    </FFHAuthContext.Provider>
  );
}

export function useFFHAuth() {
  const ctx = useContext(FFHAuthContext);
  if (!ctx) throw new Error("useFFHAuth must be used within FFHAuthProvider");
  return ctx;
}
