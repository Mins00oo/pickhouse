import { Text, View } from 'react-native';
import { colors } from '@/theme';
import { FloorType } from '@/types';
import { FLOOR_TYPE_OPTIONS } from '../../wizardConstants';
import { SegmentedControl } from './SegmentedControl';
import { NumericInput } from './NumericInput';

export interface FloorTypeInputProps {
  value: FloorType;
  onChange: (t: FloorType) => void;
  floor: string;
  totalFloor: string;
  onChangeFloor: (t: string) => void;
  onChangeTotal: (t: string) => void;
}

function NumBox({
  label,
  value,
  onChangeText,
  unit = '층',
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  unit?: string;
  testID: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        height: 56,
        backgroundColor: colors.white,
        borderRadius: 13,
        borderWidth: 1.5,
        borderColor: colors.borderHard,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.muted, minWidth: 44 }}>
        {label}
      </Text>
      <NumericInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        sanitize={(s) => s.replace(/[^0-9-]/g, '')}
        keyboardType="numbers-and-punctuation"
        placeholder="-"
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
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink70 }}>{unit}</Text>
    </View>
  );
}

function Hint({ children }: { children: string }) {
  return (
    <View
      style={{
        flex: 1,
        height: 56,
        paddingHorizontal: 14,
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: colors.borderHard,
        borderStyle: 'dashed',
      }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.muted }}>{children}</Text>
    </View>
  );
}

export function FloorTypeInput({
  value,
  onChange,
  floor,
  totalFloor,
  onChangeFloor,
  onChangeTotal,
}: FloorTypeInputProps) {
  const activeIndex = FLOOR_TYPE_OPTIONS.findIndex((o) => o.code === value);
  return (
    <View>
      <SegmentedControl
        testIDPrefix="floor-type"
        options={FLOOR_TYPE_OPTIONS.map((o) => o.label)}
        value={activeIndex < 0 ? 0 : activeIndex}
        onChange={(i) => onChange(FLOOR_TYPE_OPTIONS[i]!.code)}
      />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {value === 'GROUND' ? (
          <>
            <NumBox
              label="해당 층"
              value={floor}
              onChangeText={onChangeFloor}
              testID="floor-current"
            />
            <NumBox label="전체 층" value={totalFloor} onChangeText={onChangeTotal} testID="floor-total" />
          </>
        ) : (
          <>
            <NumBox label="전체 층" value={totalFloor} onChangeText={onChangeTotal} testID="floor-total" />
            <Hint>
              {value === 'SEMI_BASEMENT'
                ? '반지하는 채광·습기 꼭 확인하세요'
                : '옥탑은 단열·방수 확인하세요'}
            </Hint>
          </>
        )}
      </View>
    </View>
  );
}
