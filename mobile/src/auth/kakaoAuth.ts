import { login, logout } from '@react-native-seoul/kakao-login';
import { SocialLoginCredential } from '@/types';

export const kakaoAuth = {
  async signIn(): Promise<SocialLoginCredential> {
    const result = await login();
    if (!result.idToken) {
      throw new Error('Kakao login did not return an idToken');
    }
    return { idToken: result.idToken, displayName: null };
  },

  async signOut(): Promise<void> {
    try {
      await logout();
    } catch {
      // logout fails silently if not logged in
    }
  },
};
