import * as Apple from 'expo-apple-authentication';
import { appleAuth } from '../appleAuth';

describe('appleAuth', () => {
  it('signIn returns identityToken from Apple', async () => {
    (Apple.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'apple-id-token-xyz',
      user: 'apple_user',
    });
    const token = await appleAuth.signIn();
    expect(token).toBe('apple-id-token-xyz');
  });

  it('throws when Apple returns null identityToken', async () => {
    (Apple.signInAsync as jest.Mock).mockResolvedValueOnce({ identityToken: null });
    await expect(appleAuth.signIn()).rejects.toThrow(/identity token/);
  });

  it('isAvailable proxies expo isAvailableAsync', async () => {
    (Apple.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    expect(await appleAuth.isAvailable()).toBe(false);
  });
});
