import { login, logout } from '@react-native-seoul/kakao-login';

export const kakaoAuth = {
  async signIn(): Promise<string> {
    const result = await login();
    if (!result.idToken) {
      throw new Error('Kakao login did not return an idToken');
    }
    return result.idToken;
  },

  async signOut(): Promise<void> {
    try {
      await logout();
    } catch {
      // logout fails silently if not logged in
    }
  },
};
