import { create } from 'zustand';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  setSession: (s: { accessToken: string; refreshToken: string }) => void;
  updateTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setStatus: (s: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  status: 'unknown',
  setSession: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken, status: 'authenticated' }),
  updateTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),
  setStatus: (status) => set({ status }),
  clear: () =>
    set({ accessToken: null, refreshToken: null, status: 'unauthenticated' }),
}));
