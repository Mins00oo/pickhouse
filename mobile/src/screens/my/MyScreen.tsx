import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigationProp } from '@react-navigation/native';
import { getAuthErrorMessage } from '@/auth/authErrors';
import { authService } from '@/auth/authService';
import { HouseStackParamList, MainTabParamList } from '@/navigation/types';
import { useHouses } from '@/queries/houses.queries';
import { useMyPlaces } from '@/queries/myPlaces.queries';
import { useProfile } from '@/queries/profile.queries';
import { PLACE_META } from '@/screens/houses/placeMeta';
import { colors } from '@/theme';

type Props = BottomTabScreenProps<MainTabParamList, 'My'>;

export function MyScreen({ navigation }: Props) {
  const { data: houses = [] } = useHouses();
  const { data: places = [] } = useMyPlaces();
  const { data: profile } = useProfile();
  const [accountAction, setAccountAction] = useState<'logout' | 'delete' | null>(null);
  const registered = places.length > 0;

  const rootNav = () =>
    navigation.getParent<NavigationProp<HouseStackParamList>>() ??
    (navigation as unknown as NavigationProp<HouseStackParamList>);
  const openPlaces = () => rootNav().navigate('Places');
  const editPlace = (placeId: string) => rootNav().navigate('AddPlace', { placeId });
  const addPlace = () => rootNav().navigate('AddPlace', undefined);
  const joinedAt = profile?.createdAt.slice(0, 10).replaceAll('-', '.');

  const confirmLogout = () => {
    Alert.alert('로그아웃할까요?', '', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: () => {
          setAccountAction('logout');
          void authService.logout().catch((error) => {
            setAccountAction(null);
            Alert.alert('로그아웃 실패', getAuthErrorMessage(error));
          });
        },
      },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴 후 30일 동안 계정을 복구할 수 있습니다. 정말 탈퇴할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => {
            setAccountAction('delete');
            void authService
              .deleteAccount()
              .catch((error) => {
                setAccountAction(null);
                Alert.alert('회원 탈퇴 실패', getAuthErrorMessage(error));
              });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 프로필 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.nickname || '내 집 찾기'}</Text>
            <Text style={styles.profileSub}>
              {joinedAt ? `${joinedAt} 가입 · ` : ''}기록한 집 {houses.length}곳
            </Text>
          </View>
        </View>

        {/* 통근 기준지 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>통근 기준지</Text>
          {registered ? (
            <View style={styles.commuteCard}>
              {places.map((p, i) => {
                const meta = PLACE_META[p.placeType];
                return (
                  <Pressable
                    key={p.id}
                    testID={`my-place-row-${p.id}`}
                    accessibilityRole="button"
                    onPress={openPlaces}
                    style={[styles.placeRow, i < places.length - 1 && styles.placeRowDivider]}
                  >
                    <View style={[styles.placeIcon, { backgroundColor: meta.soft }]}>
                      <Ionicons name={meta.icon as never} size={19} color={meta.color} />
                    </View>
                    <View style={styles.placeMain}>
                      <View style={styles.placeBadges}>
                        <Text style={[styles.kindBadge, { backgroundColor: meta.soft, color: meta.color }]}>{meta.label}</Text>
                        {p.isPrimary ? <Text style={styles.primaryBadge}>주 통근지</Text> : null}
                      </View>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {p.label || meta.label}
                      </Text>
                    </View>
                    <Pressable
                      testID={`my-place-edit-${p.id}`}
                      accessibilityRole="button"
                      accessibilityLabel="장소 수정"
                      hitSlop={10}
                      onPress={() => editPlace(p.id)}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.muted} />
                    </Pressable>
                  </Pressable>
                );
              })}
              <Pressable testID="my-place-add" accessibilityRole="button" onPress={addPlace} style={styles.addRow}>
                <Ionicons name="add" size={15} color={colors.ink70} />
                <Text style={styles.addRowText}>장소 추가</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.guidanceCard}>
              <View style={styles.guidanceTop}>
                <View style={styles.guidanceIcon}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guidanceTitle}>직장·학교를 등록해 보세요</Text>
                  <Text style={styles.guidanceBody}>
                    등록하면 집 카드와 비교 화면에 <Text style={styles.guidanceStrong}>통근시간</Text>이 표시돼요. 가격·옵션만큼 중요한 출퇴근 거리를 함께 따져보세요.
                  </Text>
                </View>
              </View>
              <Pressable testID="my-register-myPlace" accessibilityRole="button" onPress={openPlaces} style={styles.guidanceBtn}>
                <Ionicons name="add" size={16} color={colors.white} />
                <Text style={styles.guidanceBtnText}>직장·학교 등록</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 기타 메뉴 */}
        <View style={styles.menu}>
          <MenuRow icon="heart-outline" label="찜한 집" />
          <MenuRow icon="list-outline" label="내가 기록한 집" value={String(houses.length)} onPress={() => navigation.navigate('List')} />
          <MenuRow icon="grid-outline" label="비교 목록" onPress={() => navigation.navigate('Compare')} />
          <MenuRow icon="options-outline" label="설정" />
          <MenuRow
            icon="log-out-outline"
            label={accountAction === 'logout' ? '로그아웃 중...' : '로그아웃'}
            onPress={accountAction ? undefined : confirmLogout}
          />
          <MenuRow
            icon="person-remove-outline"
            label={accountAction === 'delete' ? '탈퇴 처리 중...' : '회원 탈퇴'}
            destructive
            onPress={accountAction ? undefined : confirmDeleteAccount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  value,
  destructive = false,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon as never} size={18} color={destructive ? colors.danger : colors.ink70} />
      </View>
      <Text style={[styles.menuLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  headerTitle: { fontSize: 19, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4 },
  body: { paddingBottom: 32 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 18, backgroundColor: colors.white },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  profileName: { fontSize: 17, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.4 },
  profileSub: { fontSize: 12, fontWeight: '500', color: colors.muted, marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.ink70, letterSpacing: -0.3, marginBottom: 10 },
  commuteCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  placeRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  placeIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  placeMain: { flex: 1, minWidth: 0 },
  placeBadges: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kindBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden', fontSize: 9.5, fontWeight: '700' },
  primaryBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.inkStrong, color: colors.white, fontSize: 9.5, fontWeight: '700' },
  placeName: { fontSize: 14, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3, marginTop: 3 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, margin: 14, marginTop: 0, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderHard },
  addRowText: { fontSize: 13, fontWeight: '700', color: colors.ink70 },
  guidanceCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, padding: 16 },
  guidanceTop: { flexDirection: 'row', gap: 11, marginBottom: 13 },
  guidanceIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  guidanceTitle: { fontSize: 14.5, fontWeight: '700', color: colors.inkStrong, letterSpacing: -0.3 },
  guidanceBody: { fontSize: 12, fontWeight: '500', color: colors.muted, marginTop: 4, lineHeight: 18, letterSpacing: -0.2 },
  guidanceStrong: { color: colors.ink70, fontWeight: '700' },
  guidanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 13, backgroundColor: colors.primary },
  guidanceBtnText: { fontSize: 14, fontWeight: '700', color: colors.white, letterSpacing: -0.3 },
  menu: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  menuIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  menuLabel: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.inkStrong, letterSpacing: -0.3 },
  destructiveLabel: { color: colors.danger },
  menuValue: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
});
