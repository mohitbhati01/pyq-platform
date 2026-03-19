import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
  reputation: number;
  isAdmin: boolean;
  bio?: string;
  skills: string[];
  subjects: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  // C-3 fix: refreshToken is kept in memory only (not persisted to localStorage)
  // to reduce XSS attack surface. It will be lost on page refresh but the user
  // can re-authenticate via the refresh endpoint if needed.
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'pyq-auth',
      // C-3 fix: Only persist user info and accessToken.
      // refreshToken intentionally excluded from localStorage to reduce XSS risk.
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
    }
  )
);
