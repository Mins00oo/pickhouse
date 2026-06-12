import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { AuthScreen } from '../AuthScreen';
import { authService } from '@/auth/authService';
import { appleAuth } from '@/auth/appleAuth';

jest.mock('@/auth/authService');
jest.mock('@/auth/appleAuth', () => ({
  appleAuth: {
    isAvailable: jest.fn().mockResolvedValue(false),
  },
}));

beforeEach(() => jest.clearAllMocks());

describe('AuthScreen', () => {
  it('shows welcome copy and a Kakao button', async () => {
    const { getByTestId } = render(<AuthScreen />);

    await waitFor(() => expect(appleAuth.isAvailable).toHaveBeenCalled());

    expect(getByTestId('kakao-sign-in')).toBeTruthy();
  });

  it('Kakao button calls loginWithKakao', async () => {
    (authService.loginWithKakao as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByTestId } = render(<AuthScreen />);

    await waitFor(() => expect(appleAuth.isAvailable).toHaveBeenCalled());
    fireEvent.press(getByTestId('kakao-sign-in'));

    await waitFor(() => expect(authService.loginWithKakao).toHaveBeenCalled());
  });

  it('does not show an alert when Apple login is cancelled', async () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (appleAuth.isAvailable as jest.Mock).mockResolvedValueOnce(true);
    (authService.loginWithApple as jest.Mock).mockRejectedValueOnce({
      code: 'ERR_REQUEST_CANCELED',
      message: 'The user canceled the authorization attempt',
    });

    try {
      const { getByTestId } = render(<AuthScreen />);

      await waitFor(() => expect(getByTestId('apple-sign-in')).toBeTruthy());
      fireEvent.press(getByTestId('apple-sign-in'));

      await waitFor(() => expect(authService.loginWithApple).toHaveBeenCalled());
      expect(alertSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOs, configurable: true });
    }
  });

  it('does not show an alert when Kakao login is cancelled', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (authService.loginWithKakao as jest.Mock).mockRejectedValueOnce(
      new Error('User cancelled login'),
    );
    const { getByTestId } = render(<AuthScreen />);

    await waitFor(() => expect(appleAuth.isAvailable).toHaveBeenCalled());
    fireEvent.press(getByTestId('kakao-sign-in'));

    await waitFor(() => expect(authService.loginWithKakao).toHaveBeenCalled());
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows a backend message when Kakao login fails for another reason', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (authService.loginWithKakao as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          code: 'INVALID_ID_TOKEN',
          message: 'Kakao ID token invalid',
          data: null,
        },
      },
      message: 'Request failed with status code 401',
    });
    const { getByTestId } = render(<AuthScreen />);

    await waitFor(() => expect(appleAuth.isAvailable).toHaveBeenCalled());
    fireEvent.press(getByTestId('kakao-sign-in'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('로그인 실패'), 'Kakao ID token invalid'),
    );
  });
});
