import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ph_access_token';
const REFRESH_KEY = 'ph_refresh_token';
const USER_KEY = 'ph_user';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const secureTokens = {
  async save(t: Tokens): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, t.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken);
  },

  async load(): Promise<Tokens | null> {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    // Remove profile data left by older app versions.
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
