import { AnchorType } from '@/types';

// 거점 타입별 표시 라벨 / 아이콘. DB엔 영문 코드, 라벨 매핑은 여기서.
export const ANCHOR_META: Record<
  AnchorType,
  { label: string; icon: string; emoji: string }
> = {
  WORKPLACE: { label: '직장', icon: 'briefcase', emoji: '🏢' },
  SCHOOL: { label: '학교', icon: 'school', emoji: '🎓' },
};

// 시트에서 보여줄 순서(직장 → 학교).
export const ANCHOR_ORDER: AnchorType[] = ['WORKPLACE', 'SCHOOL'];
