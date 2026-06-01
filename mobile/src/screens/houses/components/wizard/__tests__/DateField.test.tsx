import { render, fireEvent } from '@testing-library/react-native';
import { DateField } from '../DateField';

describe('DateField', () => {
  it('renders the selected date in Korean and is closed initially', () => {
    const { getByText, queryByTestId } = render(
      <DateField value="2026-06-01" onChange={jest.fn()} />,
    );
    expect(getByText('2026년 6월 1일')).toBeTruthy();
    expect(queryByTestId('visited-at-calendar')).toBeNull();
  });

  it('opens the calendar and reports the picked ISO date', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<DateField value="2026-06-01" onChange={onChange} />);
    fireEvent.press(getByTestId('visited-at'));
    fireEvent.press(getByTestId('visited-at-calendar')); // mock calendar emits 2026-06-15
    expect(onChange).toHaveBeenCalledWith('2026-06-15');
  });

  it('shows a placeholder when no date is set', () => {
    const { getByText } = render(<DateField value="" onChange={jest.fn()} />);
    expect(getByText('날짜 선택')).toBeTruthy();
  });
});
