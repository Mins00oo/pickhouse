import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
});
