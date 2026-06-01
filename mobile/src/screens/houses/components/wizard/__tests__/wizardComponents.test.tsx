import { render, fireEvent } from '@testing-library/react-native';
import { SegmentedControl } from '../SegmentedControl';
import { Chips } from '../Chips';
import { TriStateRow } from '../TriStateRow';
import { SwitchRow } from '../SwitchRow';
import { AmountInput } from '../AmountInput';
import { PyeongInput } from '../PyeongInput';
import { FloorTypeInput } from '../FloorTypeInput';
import { DirectionPicker } from '../DirectionPicker';
import { StepTabs } from '../StepTabs';
import { BottomBar } from '../BottomBar';

describe('SegmentedControl', () => {
  it('reports the tapped index', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SegmentedControl testIDPrefix="dealtype" options={['월세', '전세']} value={0} onChange={onChange} />,
    );
    fireEvent.press(getByTestId('dealtype-전세'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('Chips', () => {
  it('multi-select toggles by index', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <Chips
        testIDPrefix="maint-include"
        multi
        options={['수도', '전기', '가스', '인터넷']}
        value={[0]}
        onToggle={onToggle}
      />,
    );
    fireEvent.press(getByTestId('maint-include-가스'));
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('single-select reports index', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <Chips testIDPrefix="roomtype" options={['원룸', '투룸']} value={-1} onToggle={onToggle} />,
    );
    fireEvent.press(getByTestId('roomtype-투룸'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });
});

describe('TriStateRow', () => {
  it('reports the chosen level (좋음=3)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TriStateRow icon="sunny-outline" label="햇빛" onChange={onChange} />,
    );
    fireEvent.press(getByTestId('condition-햇빛-좋음'));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.press(getByTestId('condition-햇빛-나쁨'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe('SwitchRow', () => {
  it('toggles on press', () => {
    const onToggle = jest.fn();
    const { getByTestId } = render(
      <SwitchRow icon="home-outline" label="엘리베이터" value={false} onToggle={onToggle} />,
    );
    fireEvent.press(getByTestId('switch-엘리베이터'));
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('AmountInput', () => {
  it('strips non-numeric characters', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <AmountInput label="보증금" value="" onChangeText={onChangeText} testID="amount-보증금" />,
    );
    fireEvent.changeText(getByTestId('amount-보증금'), '1,2a3');
    expect(onChangeText).toHaveBeenCalledWith('123');
  });
});

describe('PyeongInput', () => {
  it('shows ㎡ conversion and applies presets', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<PyeongInput value="9" onChange={onChange} />);
    expect(getByTestId('pyeong-sqm').props.children.join('')).toContain('29.8');
    fireEvent.press(getByTestId('pyeong-preset-12'));
    expect(onChange).toHaveBeenCalledWith('12');
  });
});

describe('FloorTypeInput', () => {
  const baseProps = {
    floor: '3',
    totalFloor: '5',
    onChangeFloor: jest.fn(),
    onChangeTotal: jest.fn(),
  };

  it('GROUND shows both current and total floor inputs', () => {
    const { getByTestId } = render(
      <FloorTypeInput value="GROUND" onChange={jest.fn()} {...baseProps} />,
    );
    expect(getByTestId('floor-current')).toBeTruthy();
    expect(getByTestId('floor-total')).toBeTruthy();
  });

  it('SEMI_BASEMENT hides current floor and keeps total', () => {
    const { getByTestId, queryByTestId } = render(
      <FloorTypeInput value="SEMI_BASEMENT" onChange={jest.fn()} {...baseProps} />,
    );
    expect(queryByTestId('floor-current')).toBeNull();
    expect(getByTestId('floor-total')).toBeTruthy();
  });

  it('changing type reports the floor-type code', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <FloorTypeInput value="GROUND" onChange={onChange} {...baseProps} />,
    );
    fireEvent.press(getByTestId('floor-type-옥탑'));
    expect(onChange).toHaveBeenCalledWith('ROOFTOP');
  });
});

describe('DirectionPicker', () => {
  it('reports the direction code', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<DirectionPicker onChange={onChange} />);
    fireEvent.press(getByTestId('direction-남동향'));
    expect(onChange).toHaveBeenCalledWith('SOUTHEAST');
  });
});

describe('StepTabs', () => {
  it('jumps to the tapped step', () => {
    const onJump = jest.fn();
    const { getByTestId } = render(<StepTabs step={1} onJump={onJump} onClose={jest.fn()} />);
    fireEvent.press(getByTestId('add-step-tab-구조'));
    expect(onJump).toHaveBeenCalledWith(3);
  });

  it('close button fires onClose', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<StepTabs step={1} onJump={jest.fn()} onClose={onClose} />);
    fireEvent.press(getByTestId('wizard-close'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('BottomBar', () => {
  it('non-last step shows save + next', () => {
    const onSave = jest.fn();
    const onNext = jest.fn();
    const { getByTestId } = render(
      <BottomBar step={1} saving={false} onSave={onSave} onNext={onNext} />,
    );
    fireEvent.press(getByTestId('next-button'));
    expect(onNext).toHaveBeenCalled();
    fireEvent.press(getByTestId('save-button'));
    expect(onSave).toHaveBeenCalled();
  });

  it('last step shows only the save button', () => {
    const { getByTestId, queryByTestId } = render(
      <BottomBar step={4} saving={false} onSave={jest.fn()} onNext={jest.fn()} />,
    );
    expect(getByTestId('save-button')).toBeTruthy();
    expect(queryByTestId('next-button')).toBeNull();
  });
});
