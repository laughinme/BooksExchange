import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { logoutRequest, refreshSession } from "@/shared/api/auth";
import {
  setAccessToken,
  subscribeAccessToken,
} from "@/shared/api/axiosInstance";
import { getCsrfToken } from "@/shared/lib/cookies";

type AuthContextValue = {
  token: string | null;
  isAuthReady: boolean;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAccessToken(setTokenState);

    const bootstrap = async () => {
      try {
        const csrf = getCsrfToken();
        if (!csrf) {
          setIsAuthReady(true);
          return;
        }
        const data = await refreshSession();
        setAccessToken(data.access_token);
      } catch {
        setAccessToken(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    bootstrap();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!token) {
      queryClient.clear();
    }
  }, [queryClient, token]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // ignore logout errors
    } finally {
      setAccessToken(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthReady,
      setToken: setAccessToken,
      logout,
    }),
    [isAuthReady, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
