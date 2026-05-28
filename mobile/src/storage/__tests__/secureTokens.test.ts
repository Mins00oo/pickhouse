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

  it('save writes a user snapshot when provided', async () => {
    const user = { id: 'u1', email: 'u@example.com', authProviders: {}, createdAt: '' };

    await secureTokens.save({ accessToken: 'a', refreshToken: 'r', user });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('ph_user', JSON.stringify(user));
  });

  it('load returns tokens and user snapshot when present', async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('a')
      .mockResolvedValueOnce('r')
      .mockResolvedValueOnce(JSON.stringify({
        id: 'u1',
        email: 'u@example.com',
        authProviders: {},
        createdAt: '',
      }));
    const t = await secureTokens.load();
    expect(t).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      user: {
        id: 'u1',
        email: 'u@example.com',
        authProviders: {},
        createdAt: '',
      },
    });
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
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ph_user');
  });
});
