import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="확인" onPress={onPress} />);
    fireEvent.press(getByText('확인'));
    expect(onPress).toHaveBeenCalled();
  });

  it('disabled button does not call onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="저장" onPress={onPress} disabled />);
    fireEvent.press(getByText('저장'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
