import * as AppleAuthentication from 'expo-apple-authentication';

export const appleAuth = {
  async isAvailable(): Promise<boolean> {
    return AppleAuthentication.isAvailableAsync();
  },

  async signIn(): Promise<string> {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token');
    }
    return credential.identityToken;
  },
};
