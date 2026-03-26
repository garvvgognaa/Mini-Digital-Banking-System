import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { api, loadStoredUser, saveStoredUser, setToken } from "../api/client";
import type { User } from "../api/types";

type AuthState = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email: email.trim(), password });
    flushSync(() => {
      setToken(res.token);
      saveStoredUser(res.user);
      setUser(res.user);
    });
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.register({
        name: input.name.trim(),
        email: input.email.trim(),
        password: input.password,
        phone: input.phone ?? null,
      });
      flushSync(() => {
        setToken(res.token);
        saveStoredUser(res.user);
        setUser(res.user);
      });
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    saveStoredUser(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
