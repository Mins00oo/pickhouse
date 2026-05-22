import { render, fireEvent } from '@testing-library/react-native';
import { AppleSignInButton } from '../AppleSignInButton';

describe('AppleSignInButton', () => {
  it('renders on iOS and fires onPress', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(<AppleSignInButton onPress={onPress} />);

    expect(getByText('Apple로 로그인')).toBeTruthy();
    fireEvent.press(getByTestId('apple-sign-in'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
