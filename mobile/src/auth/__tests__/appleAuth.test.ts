import * as Apple from 'expo-apple-authentication';
import { appleAuth } from '../appleAuth';

describe('appleAuth', () => {
  it('signIn returns identityToken and nullable displayName from Apple', async () => {
    (Apple.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'apple-id-token-xyz',
      user: 'apple_user',
      fullName: { givenName: '길동', familyName: '홍' },
    });
    const credential = await appleAuth.signIn();
    expect(credential).toEqual({
      idToken: 'apple-id-token-xyz',
      displayName: '길동 홍',
    });
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
