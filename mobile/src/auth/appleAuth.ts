import * as AppleAuthentication from 'expo-apple-authentication';
import { SocialLoginCredential } from '@/types';

export const appleAuth = {
  async isAvailable(): Promise<boolean> {
    return AppleAuthentication.isAvailableAsync();
  },

  async signIn(): Promise<SocialLoginCredential> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token');
    }
    const formattedName = credential.fullName
      ? AppleAuthentication.formatFullName(credential.fullName).trim()
      : '';
    return {
      idToken: credential.identityToken,
      displayName: formattedName || null,
    };
  },
};
