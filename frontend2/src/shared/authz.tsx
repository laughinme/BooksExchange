/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/use-auth";
import { profileQueryOptions } from "@/entities/profile/model/hooks";

type AuthzState = {
  roles: Set<string>;
  orgRoles: Set<string>;
  isReady: boolean;
};

const AuthzContext = createContext<AuthzState | null>(null);

export function useAuthz(): AuthzState {
  const ctx = useContext(AuthzContext);
  return (
    ctx ?? {
      roles: new Set<string>(),
      orgRoles: new Set<string>(),
      isReady: false,
    }
  );
}

export function useAuthzReady() {
  return useAuthz().isReady;
}

export function useHasRole(role: string) {
  const { roles } = useAuthz();
  return roles.has(role);
}

export function useHasAnyRole(roles: string[]) {
  const { roles: owned } = useAuthz();
  return roles.some((role) => owned.has(role));
}

export function hasRole(roles: Iterable<string> | undefined, role: string) {
  if (!roles) return false;
  for (const r of roles) {
    if (r === role) return true;
  }
  return false;
}

export function hasAnyRole(roles: Iterable<string> | undefined, expected: string[]) {
  if (!roles) return false;
  for (const r of roles) {
    if (expected.includes(r)) return true;
  }
  return false;
}

export function Require({
  roles,
  children,
  fallback = null,
}: {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const ok = useHasAnyRole(roles);
  return <>{ok ? children : fallback}</>;
}

export function AuthzProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthReady } = useAuth();

  const profileQuery = useQuery({
    ...profileQueryOptions(),
    enabled: isAuthReady && !!token,
  });

  const value = useMemo<AuthzState>(
    () => ({
      roles: new Set(profileQuery.data?.roles ?? []),
      orgRoles: new Set<string>(),
      isReady: isAuthReady && (profileQuery.isSuccess || profileQuery.isError || !token),
    }),
    [isAuthReady, profileQuery.data?.roles, profileQuery.isError, profileQuery.isSuccess, token],
  );

  return <AuthzContext.Provider value={value}>{children}</AuthzContext.Provider>;
}
