import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthScreen } from '../AuthScreen';
import { authService } from '@/auth/authService';

jest.mock('@/auth/authService');

beforeEach(() => jest.clearAllMocks());

describe('AuthScreen', () => {
  it('shows welcome copy and a Kakao button', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText(/카카오로 시작하기/)).toBeTruthy();
  });

  it('Kakao button calls loginWithKakao', async () => {
    (authService.loginWithKakao as jest.Mock).mockResolvedValueOnce(undefined);
    const { getByText } = render(<AuthScreen />);
    fireEvent.press(getByText(/카카오로 시작하기/));
    await waitFor(() => expect(authService.loginWithKakao).toHaveBeenCalled());
  });
});
