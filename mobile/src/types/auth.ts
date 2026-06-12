export type AuthProvider = 'APPLE' | 'KAKAO';

export interface LoginRequest {
  provider: AuthProvider;
  idToken: string;
  deviceId: string;
  displayName: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = TokenPair;
export type RefreshResponse = TokenPair;

export interface RefreshRequest {
  refreshToken: string;
  deviceId: string;
}

export type LogoutRequest = RefreshRequest;

export interface SocialLoginCredential {
  idToken: string;
  displayName: string | null;
}
