import { Text, View } from 'react-native';
import { colors } from '@/theme';
import { formatThousands } from '../../houseMapUtils';
import { NumericInput } from './NumericInput';

export interface AmountInputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  suffix?: string;
  placeholder?: string;
  testID?: string;
}

export function AmountInput({
  label,
  value,
  onChangeText,
  suffix = '만원',
  placeholder = '0',
  testID,
}: AmountInputProps) {
  return (
    <View
      style={{
        height: 56,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: value ? colors.borderHard : colors.borderSoft,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 8,
      }}
    >
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, minWidth: 42 }}>
          {label}
        </Text>
      ) : null}
      <NumericInput
        testID={testID ?? `amount-${label ?? 'input'}`}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        format={formatThousands}
        keyboardType="number-pad"
        placeholder={placeholder}
        style={{
          flex: 1,
          textAlign: 'right',
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.5,
          color: colors.inkStrong,
          padding: 0,
        }}
      />
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.ink70 }}>{suffix}</Text>
    </View>
  );
}
