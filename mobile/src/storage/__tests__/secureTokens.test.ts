import * as SecureStore from 'expo-secure-store';
import { secureTokens } from '../secureTokens';

describe('secureTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and loads the token pair', async () => {
    await secureTokens.save({ accessToken: 'a', refreshToken: 'r' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_access_token', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_refresh_token', 'r');

    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('a')
      .mockResolvedValueOnce('r');
    await expect(secureTokens.load()).resolves.toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    });
  });

  it('returns null when either token is missing', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('r');
    await expect(secureTokens.load()).resolves.toBeNull();
  });

  it('clears token keys and the legacy user key', async () => {
    await secureTokens.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_user');
  });
});
