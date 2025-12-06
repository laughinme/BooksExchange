import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { logoutRequest, refreshSession } from "@/shared/api/auth";
import {
  setAccessToken,
  subscribeAccessToken,
} from "@/shared/api/axiosInstance";

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
        const data = await refreshSession();
        setAccessToken(data.access_token);
      } catch (error) {
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

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // ignore logout errors
    } finally {
      setAccessToken(null);
      queryClient.clear();
    }
  };

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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
