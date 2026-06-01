import { useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputFocusEventData,
  TextInputSelectionChangeEventData,
  TextStyle,
  type KeyboardTypeOptions,
} from 'react-native';

type Selection = { start: number; end: number };

const digitsOnly = (s: string) => s.replace(/[^0-9]/g, '');
const identity = (s: string) => s;

export interface NumericInputProps {
  /** 정규화된 raw 값 (콤마 없는 숫자 문자열) */
  value: string;
  /** raw 값으로 콜백 (콤마 제거됨) */
  onChangeText: (raw: string) => void;
  /** raw → 표시 문자열 (예: 천단위 콤마). 기본 identity */
  format?: (raw: string) => string;
  /** 입력에서 허용 문자만 남김. 기본 숫자만 */
  sanitize?: (input: string) => string;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  placeholderTextColor?: string;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * 숫자 입력 공용 컴포넌트.
 * - `selection`을 제어해 **재포커스 시 커서가 맨 앞으로 튀는 RN 버그**를 막는다(포커스/변경 시 커서를 끝으로).
 * - `format`으로 콤마 등 표시 포맷을 적용하되 부모에는 항상 raw 숫자를 전달한다.
 */
export function NumericInput({
  value,
  onChangeText,
  format = identity,
  sanitize = digitsOnly,
  keyboardType = 'number-pad',
  placeholder,
  placeholderTextColor = '#C7C3B8',
  testID,
  accessibilityLabel,
  style,
}: NumericInputProps) {
  const display = format(value);
  const [selection, setSelection] = useState<Selection>({
    start: display.length,
    end: display.length,
  });

  const caretToEnd = (text: string) => {
    const end = text.length;
    setSelection({ start: end, end });
  };

  return (
    <TextInput
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={display}
      selection={selection}
      onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) =>
        setSelection(e.nativeEvent.selection)
      }
      onFocus={(_e: NativeSyntheticEvent<TextInputFocusEventData>) => caretToEnd(display)}
      onChangeText={(text) => {
        const raw = sanitize(text);
        onChangeText(raw);
        caretToEnd(format(raw));
      }}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      style={style}
    />
  );
}
