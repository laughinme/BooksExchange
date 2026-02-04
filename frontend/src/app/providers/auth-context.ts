import { createContext } from "react";

export type AuthContextValue = {
  token: string | null;
  isAuthReady: boolean;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
