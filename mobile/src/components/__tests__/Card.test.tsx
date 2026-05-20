import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(<Card><Text>hi</Text></Card>);
    expect(getByText('hi')).toBeTruthy();
  });

  it('applies background color from theme', () => {
    const { getByTestId } = render(<Card testID="c"><Text>x</Text></Card>);
    const node = getByTestId('c');
    const styles = Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style) : node.props.style;
    expect(styles.backgroundColor).toBe('#ffffff');
  });
});
