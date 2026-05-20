import { render, fireEvent } from '@testing-library/react-native';
import { StarRating } from '../StarRating';

describe('StarRating', () => {
  it('renders 5 star slots', () => {
    const { getAllByRole } = render(<StarRating value={0} onChange={() => {}} />);
    expect(getAllByRole('button').length).toBe(5);
  });

  it('tapping a star reports its value', () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(<StarRating value={0} onChange={onChange} />);
    fireEvent.press(getAllByRole('button')[2]!);
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
