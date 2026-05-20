import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Address } from '@/types';
import { KakaoAddressPicker } from '@/integrations/kakaoAddress';
import { colors, radii, spacing, typography } from '@/theme';

export interface AddressPickerProps {
  value: Address | null;
  onChange: (a: Address) => void;
}

export function AddressPicker({ value, onChange }: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.md,
          padding: spacing.lg,
          backgroundColor: colors.white,
        }}
      >
        <Text style={[typography.caption, { color: colors.inkMuted }]}>주소</Text>
        <Text style={[typography.body, { color: value ? colors.ink : colors.inkMuted }]}>
          {value?.roadAddress ?? '주소를 검색하세요'}
        </Text>
      </Pressable>
      <KakaoAddressPicker
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </View>
  );
}
