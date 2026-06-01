import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Address } from '@/types';
import { colors } from '@/theme';

export interface AddressFieldProps {
  address: Address | null;
  detail: string;
  geocoding?: boolean;
  onSearch: () => void;
  onChangeDetail: (t: string) => void;
}

export function AddressField({ address, detail, geocoding, onSearch, onChangeDetail }: AddressFieldProps) {
  if (!address) {
    return (
      <Pressable
        testID="address-search"
        accessibilityRole="button"
        accessibilityLabel="주소 검색"
        onPress={onSearch}
        style={{
          height: 52,
          backgroundColor: colors.white,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 14,
          paddingRight: 6,
          gap: 10,
        }}
      >
        <Ionicons name="search" size={17} color={colors.muted} />
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', letterSpacing: -0.3, color: colors.muted }}>
          도로명, 지번, 건물명으로 검색
        </Text>
        <View
          style={{
            height: 38,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: colors.inkStrong,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>주소 검색</Text>
        </View>
      </Pressable>
    );
  }

  const hasCoords = typeof address.latitude === 'number' && typeof address.longitude === 'number';
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: colors.borderHard,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="navigate" size={15} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 }}>
            {address.roadAddress}
          </Text>
          {address.jibunAddress ? (
            <Text style={{ fontSize: 11.5, fontWeight: '500', color: colors.muted, marginTop: 2 }}>
              지번 {address.jibunAddress}
            </Text>
          ) : null}
          {geocoding ? (
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>위치 확인 중…</Text>
          ) : !hasCoords ? (
            <Text testID="address-no-coords" style={{ fontSize: 11, color: colors.coral, marginTop: 4 }}>
              지도 위치를 못 찾았어요 (저장은 가능)
            </Text>
          ) : null}
        </View>
        <Pressable
          testID="address-change"
          accessibilityRole="button"
          accessibilityLabel="주소 변경"
          onPress={onSearch}
          hitSlop={8}
        >
          <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.primary }}>변경</Text>
        </Pressable>
      </View>
      <View
        style={{
          height: 52,
          backgroundColor: colors.white,
          borderRadius: 13,
          borderWidth: 1.5,
          borderColor: detail ? colors.borderHard : colors.primary,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          testID="address-detail"
          accessibilityLabel="상세 주소"
          value={detail}
          onChangeText={onChangeDetail}
          placeholder="상세 주소 (동/호수 등)"
          placeholderTextColor="#C7C3B8"
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            letterSpacing: -0.3,
            color: colors.inkStrong,
            padding: 0,
          }}
        />
      </View>
    </View>
  );
}
