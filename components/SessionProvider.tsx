"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/auth";

type Session = { id: string; username: string; role: Role };
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ value, children }: { value: Session; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
export function useRole(): Role {
  return useContext(SessionContext)?.role ?? "player";
}
