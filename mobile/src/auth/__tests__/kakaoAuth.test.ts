import { login, logout } from '@react-native-seoul/kakao-login';
import { kakaoAuth } from '../kakaoAuth';

describe('kakaoAuth', () => {
  it('signIn returns idToken from Kakao login', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'kakao-access',
      idToken: 'kakao-id-token-xyz',
      refreshToken: 'kakao-refresh',
    });
    const credential = await kakaoAuth.signIn();
    expect(credential).toEqual({
      idToken: 'kakao-id-token-xyz',
      displayName: null,
    });
  });

  it('throws when idToken is missing', async () => {
    (login as jest.Mock).mockResolvedValueOnce({ accessToken: 'x' });
    await expect(kakaoAuth.signIn()).rejects.toThrow(/idToken/);
  });

  it('signOut calls kakao logout', async () => {
    (logout as jest.Mock).mockResolvedValueOnce(undefined);
    await kakaoAuth.signOut();
    expect(logout).toHaveBeenCalled();
  });
});
