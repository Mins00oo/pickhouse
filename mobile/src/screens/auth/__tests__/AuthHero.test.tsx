import { render } from '@testing-library/react-native';
import { AuthHero } from '../AuthHero';

describe('AuthHero', () => {
  it('renders the sample house cards and feature labels', () => {
    const { getByText } = render(<AuthHero />);

    expect(getByText('망원동 투룸')).toBeTruthy();
    expect(getByText('성수동 오피스텔')).toBeTruthy();
    expect(getByText('사진 기록')).toBeTruthy();
    expect(getByText('별점 평가')).toBeTruthy();
    expect(getByText('한눈 비교')).toBeTruthy();
  });
});
