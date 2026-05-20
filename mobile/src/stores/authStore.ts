import { create } from 'zustand';
import { User } from '@/types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setSession: (s: { user: User; accessToken: string; refreshToken: string }) => void;
  updateTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setStatus: (s: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'unknown',
  setSession: ({ user, accessToken, refreshToken }) =>
    set({ user, accessToken, refreshToken, status: 'authenticated' }),
  updateTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  setStatus: (status) => set({ status }),
  clear: () =>
    set({ user: null, accessToken: null, refreshToken: null, status: 'unauthenticated' }),
}));
