import { render, fireEvent } from '@testing-library/react-native';
import { NumericInput } from '../NumericInput';
import { formatThousands } from '@/screens/houses/houseMapUtils';

describe('formatThousands', () => {
  it('groups thousands and leaves empty / non-numeric alone', () => {
    expect(formatThousands('100000000')).toBe('100,000,000');
    expect(formatThousands('1000')).toBe('1,000');
    expect(formatThousands('')).toBe('');
    expect(formatThousands('abc')).toBe('abc');
  });
});

describe('NumericInput', () => {
  it('reports a sanitized raw value (digits only) on change', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <NumericInput testID="num" value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByTestId('num'), '1,2a3');
    expect(onChangeText).toHaveBeenCalledWith('123');
  });

  it('displays the formatted value while reporting raw', () => {
    const { getByTestId } = render(
      <NumericInput testID="num" value="1000000" onChangeText={jest.fn()} format={formatThousands} />,
    );
    expect(getByTestId('num').props.value).toBe('1,000,000');
  });

  it('moves the caret to the end on focus (fixes jump-to-front)', () => {
    const { getByTestId } = render(
      <NumericInput testID="num" value="12345" onChangeText={jest.fn()} />,
    );
    const input = getByTestId('num');
    // user taps into the middle
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 1, end: 1 } } });
    expect(input.props.selection).toEqual({ start: 1, end: 1 });
    // re-focusing snaps the caret to the end instead of index 0
    fireEvent(input, 'focus', { nativeEvent: {} });
    expect(getByTestId('num').props.selection).toEqual({ start: 5, end: 5 });
  });

  it('respects an explicit caret tap via onSelectionChange', () => {
    const { getByTestId } = render(
      <NumericInput testID="num" value="12345" onChangeText={jest.fn()} />,
    );
    const input = getByTestId('num');
    fireEvent(input, 'selectionChange', { nativeEvent: { selection: { start: 2, end: 2 } } });
    expect(getByTestId('num').props.selection).toEqual({ start: 2, end: 2 });
  });

  it('keeps the caret at the end of the formatted value after editing', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <NumericInput testID="num" value="1000" onChangeText={onChangeText} format={formatThousands} />,
    );
    fireEvent.changeText(getByTestId('num'), '12000');
    expect(onChangeText).toHaveBeenCalledWith('12000');
    // format('12000') === '12,000' (length 6) → caret at 6
    expect(getByTestId('num').props.selection).toEqual({ start: 6, end: 6 });
  });
});
