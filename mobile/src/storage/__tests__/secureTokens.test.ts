import * as SecureStore from 'expo-secure-store';
import { secureTokens } from '../secureTokens';

describe('secureTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveTokens writes access + refresh under expected keys', async () => {
    await secureTokens.save({ accessToken: 'a', refreshToken: 'r' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_access_token', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_refresh_token', 'r');
  });

  it('load returns both tokens when present', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('a')
      .mockResolvedValueOnce('r');
    const t = await secureTokens.load();
    expect(t).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('load returns null when access is missing', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('r');
    const t = await secureTokens.load();
    expect(t).toBeNull();
  });

  it('clear deletes both keys', async () => {
    await secureTokens.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_refresh_token');
  });
});
