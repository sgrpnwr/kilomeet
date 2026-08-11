import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';

type User = { id: string; email: string; name: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app startup, check if a token was saved from a previous session
  useEffect(() => {
    (async () => {
      const savedToken = await SecureStore.getItemAsync('token');
      if (savedToken) {
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
        setToken(savedToken);
        try {
          const res = await api.get('/me');
          setUser(res.data);
        } catch {
          // token expired/invalid — clear it
          await SecureStore.deleteItemAsync('token');
        }
      }
      setIsLoading(false);
    })();
  }, []);

  async function signup(email: string, password: string, name: string) {
    await api.post('/signup', { email, password, name });
    await login(email, password); // auto-login right after signup
  }

  async function login(email: string, password: string) {
    const res = await api.post('/login', { email, password });
    const { token: newToken, user: newUser } = res.data;

    await SecureStore.setItemAsync('token', newToken);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}