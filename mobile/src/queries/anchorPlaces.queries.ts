import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Address, AnchorPlace, AnchorType } from '@/types';
import { anchorPlacesRepo } from '@/db/anchorPlaces.repo';
import { attachCoords } from '@/integrations/kakaoGeocode';
import { useAuthStore } from '@/stores/authStore';

const ANCHORS_KEY = ['anchorPlaces'] as const;

export function useAnchorPlaces() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ANCHORS_KEY,
    enabled: Boolean(userId),
    queryFn: async () => (userId ? anchorPlacesRepo.listActive(userId) : []),
  });
}

export interface SetAnchorInput {
  anchorType: AnchorType;
  address: Address;
  label?: string;
}

export function useSetAnchorPlace() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? 'unknown';
  return useMutation({
    mutationFn: async ({ anchorType, address, label }: SetAnchorInput) => {
      // 장소 검색 결과엔 보통 좌표가 이미 있다. 없을 때만 지오코딩 폴백.
      const withCoords =
        typeof address.latitude === 'number' && typeof address.longitude === 'number'
          ? address
          : await attachCoords(address);
      const now = new Date().toISOString();
      const place: AnchorPlace = {
        id: Crypto.randomUUID(),
        anchorType,
        label,
        address: withCoords,
        createdAt: now,
        updatedAt: now,
      };
      await anchorPlacesRepo.upsert(place, userId);
      return place;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ANCHORS_KEY });
    },
  });
}

export function useClearAnchorPlace() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? 'unknown';
  return useMutation({
    mutationFn: async (anchorType: AnchorType) => {
      await anchorPlacesRepo.clear(userId, anchorType);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ANCHORS_KEY });
    },
  });
}
