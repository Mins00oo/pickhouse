import { login, logout } from '@react-native-seoul/kakao-login';
import { kakaoAuth } from '../kakaoAuth';

describe('kakaoAuth', () => {
  it('signIn returns idToken from Kakao login', async () => {
    (login as jest.Mock).mockResolvedValueOnce({
      accessToken: 'kakao-access',
      idToken: 'kakao-id-token-xyz',
      refreshToken: 'kakao-refresh',
    });
    const token = await kakaoAuth.signIn();
    expect(token).toBe('kakao-id-token-xyz');
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
