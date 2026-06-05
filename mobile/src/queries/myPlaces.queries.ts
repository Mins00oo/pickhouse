import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Address, MyPlace, PlaceType, TransportMode } from '@/types';
import { myPlacesRepo } from '@/db/myPlaces.repo';
import { myPlacesApi } from '@/api/myPlaces.api';
import { syncQueue } from '@/sync/syncQueue';
import { attachCoords } from '@/integrations/kakaoGeocode';
import { useAuthStore } from '@/stores/authStore';
import { lastWriteWins } from '@/sync/conflictResolution';

const MY_PLACES_KEY = ['myPlaces'] as const;

export function useMyPlaces() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: MY_PLACES_KEY,
    enabled: Boolean(userId),
    queryFn: async () => {
      const local = userId ? await myPlacesRepo.listActive(userId) : [];
      try {
        const remote = await myPlacesApi.list();
        return mergeMyPlaces(local, remote);
      } catch {
        return local;
      }
    },
  });
}

function mergeMyPlaces(local: MyPlace[], remote: MyPlace[]): MyPlace[] {
  const byId = new Map<string, MyPlace>();
  for (const p of remote) byId.set(p.id, p);
  for (const p of local) {
    const r = byId.get(p.id);
    byId.set(p.id, lastWriteWins(p, r ?? null));
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export interface SavePlaceInput {
  /** 있으면 수정, 없으면 신규. */
  id?: string;
  placeType: PlaceType;
  address: Address;
  transport: TransportMode;
  isPrimary: boolean;
  label?: string;
}

/** 내 장소 추가/수정(공통). 주 통근지로 지정하면 같은 타입의 다른 주 통근지는 자동 해제. */
export function useSavePlace() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? 'unknown';
  return useMutation({
    mutationFn: async (input: SavePlaceInput) => {
      // 장소 검색 결과엔 보통 좌표가 이미 있다. 없을 때만 지오코딩 폴백.
      const withCoords =
        typeof input.address.latitude === 'number' && typeof input.address.longitude === 'number'
          ? input.address
          : await attachCoords(input.address);
      const now = new Date().toISOString();
      const isUpdate = Boolean(input.id);
      const id = input.id ?? Crypto.randomUUID();
      const place: MyPlace = {
        id,
        placeType: input.placeType,
        label: input.label,
        address: withCoords,
        transport: input.transport,
        isPrimary: input.isPrimary,
        createdAt: now, // upsert는 충돌 시 created_at을 갱신하지 않음(최초 값 유지).
        updatedAt: now,
      };
      await myPlacesRepo.upsert(place, userId);
      if (place.isPrimary) {
        await myPlacesRepo.clearPrimaryExcept(userId, place.placeType, id);
      }
      if (isUpdate) {
        await syncQueue.queueMyPlaceUpdate(id, place);
      } else {
        await syncQueue.queueMyPlaceCreate(place);
      }
      return place;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PLACES_KEY });
    },
  });
}

export function useRemovePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await myPlacesRepo.softDelete(id);
      await syncQueue.queueMyPlaceDelete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PLACES_KEY });
    },
  });
}
