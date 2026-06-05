import { PlaceType, TransportMode } from '@/types';
import { colors } from '@/theme';

// 내 장소 타입별 표시 라벨 / 아이콘 / 색상. DB엔 영문 코드, 라벨·색상 매핑은 여기서.
export const PLACE_META: Record<
  PlaceType,
  { label: string; icon: string; emoji: string; color: string; soft: string }
> = {
  WORKPLACE: { label: '직장', icon: 'briefcase', emoji: '🏢', color: colors.primary, soft: colors.primarySoft },
  SCHOOL: { label: '학교', icon: 'school', emoji: '🎓', color: colors.school, soft: colors.schoolSoft },
  OTHER: { label: '기타', icon: 'location', emoji: '📍', color: colors.coral, soft: '#FCEFE7' },
};

// 시트/목록에서 보여줄 순서(직장 → 학교 → 기타).
export const PLACE_ORDER: PlaceType[] = ['WORKPLACE', 'SCHOOL', 'OTHER'];

// 이동수단 표시 라벨 / 아이콘(Ionicons). 통근시간 계산 기준. (자전거 제외)
export const TRANSPORT_META: Record<TransportMode, { label: string; icon: string }> = {
  TRANSIT: { label: '대중교통', icon: 'subway' },
  CAR: { label: '자동차', icon: 'car' },
  WALK: { label: '도보', icon: 'walk' },
};

export const TRANSPORT_ORDER: TransportMode[] = ['TRANSIT', 'CAR', 'WALK'];
