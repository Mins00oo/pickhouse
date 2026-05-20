import { User } from './user';

export type AuthProvider = 'apple' | 'kakao';

export interface LoginRequest {
  provider: AuthProvider;
  idToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
