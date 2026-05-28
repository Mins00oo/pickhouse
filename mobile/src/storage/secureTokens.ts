import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';

const ACCESS_KEY = 'ph_access_token';
const REFRESH_KEY = 'ph_refresh_token';
const USER_KEY = 'ph_user';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredSession extends Tokens {
  user?: User;
}

function parseUser(value: string | null): User | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<User>;
    return typeof parsed.id === 'string' && typeof parsed.createdAt === 'string'
      ? (parsed as User)
      : undefined;
  } catch {
    return undefined;
  }
}

export const secureTokens = {
  async save(t: StoredSession): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, t.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken);
    if (t.user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(t.user));
    }
  },

  async load(): Promise<StoredSession | null> {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    const user = parseUser(await SecureStore.getItemAsync(USER_KEY));
    if (!access || !refresh) return null;
    return user
      ? { accessToken: access, refreshToken: refresh, user }
      : { accessToken: access, refreshToken: refresh };
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
