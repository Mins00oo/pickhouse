import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseStackParamList, MainTabParamList } from './types';
import { colors } from '@/theme';

type TabName = keyof MainTabParamList;
const TAB_META: Record<TabName, { label: string; icon: string; iconOn: string; center?: boolean }> = {
  Map: { label: '지도', icon: 'navigate-outline', iconOn: 'navigate' },
  List: { label: '목록', icon: 'list-outline', iconOn: 'list' },
  AddHouseTab: { label: '집 추가', icon: 'add', iconOn: 'add', center: true },
  Compare: { label: '비교', icon: 'grid-outline', iconOn: 'grid' },
  My: { label: '마이', icon: 'person-outline', iconOn: 'person' },
};

/** 디자인 5탭 footer — 중앙 ＋집추가는 그린 부양 버튼(탭 전환 대신 HouseInput으로 이동). */
export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const openHouseInput = () => {
    const root =
      navigation.getParent<NavigationProp<HouseStackParamList>>() ??
      (navigation as unknown as NavigationProp<HouseStackParamList>);
    root.navigate('HouseInput', undefined);
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name as TabName];
        if (!meta) return null;
        const focused = state.index === index;

        if (meta.center) {
          return (
            <Pressable
              key={route.key}
              testID="tab-add-house"
              accessibilityRole="button"
              accessibilityLabel="집 추가"
              onPress={openHouseInput}
              style={styles.centerItem}
            >
              <View style={styles.centerButton}>
                <Ionicons name="add" size={24} color={colors.white} />
              </View>
              <Text style={styles.label}>{meta.label}</Text>
            </Pressable>
          );
        }

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.item}
          >
            <Ionicons
              name={(focused ? meta.iconOn : meta.icon) as never}
              size={23}
              color={focused ? colors.inkStrong : colors.muted}
            />
            <Text style={[styles.label, focused ? styles.labelOn : styles.labelOff]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  item: { flex: 1, alignItems: 'center', gap: 5 },
  centerItem: { alignItems: 'center', gap: 5, marginTop: -2 },
  centerButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: -0.2, color: colors.ink70 },
  labelOn: { color: colors.inkStrong, fontWeight: '700' },
  labelOff: { color: colors.muted },
});
