import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { House, HouseDraft } from '@/types';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

const HOUSES_KEY = ['houses'] as const;

// 서버 사진은 별도 업로드(/photos)로 관리하므로 house create/update payload에서는 제외한다.
function stripPhotoIds<T extends { photoIds?: unknown }>(payload: T): Omit<T, 'photoIds'> {
  const rest = { ...payload };
  delete (rest as { photoIds?: unknown }).photoIds;
  return rest;
}

export function useHouses() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: HOUSES_KEY,
    enabled: Boolean(userId),
    queryFn: () => housesApi.list(),
  });
}

export function useHouse(id: string | undefined) {
  return useQuery({
    queryKey: ['house', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) throw new Error('missing id');
      return housesApi.get(id);
    },
  });
}

export function useCreateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: HouseDraft) => {
      const now = new Date().toISOString();
      // 클라이언트에서 UUID를 생성해 전송하면 백엔드가 그대로 저장한다(중복 시 CONFLICT).
      // → 생성 직후 이 id로 조회/수정이 가능하다.
      const house: House = {
        id: draft.id ?? Crypto.randomUUID(),
        address: draft.address,
        dealType: draft.dealType,
        deposit: draft.deposit,
        rent: draft.rent,
        maintenanceFee: draft.maintenanceFee,
        area: draft.area,
        builtYear: draft.builtYear,
        floor: draft.floor,
        totalFloor: draft.totalFloor,
        availableFrom: draft.availableFrom,
        stationDistance: draft.stationDistance,
        rooms: draft.rooms,
        bathrooms: draft.bathrooms,
        hasBalcony: draft.hasBalcony,
        hasElevator: draft.hasElevator,
        hasParking: draft.hasParking,
        options: draft.options,
        security: draft.security,
        garbage: draft.garbage,
        waterPressure: draft.waterPressure,
        sunlight: draft.sunlight,
        noise: draft.noise,
        insulation: draft.insulation,
        ventilation: draft.ventilation,
        moisture: draft.moisture,
        neighborhood: draft.neighborhood,
        firstImpression: draft.firstImpression,
        memo: draft.memo,
        nickname: draft.nickname,
        visitedAt: draft.visitedAt,
        roomType: draft.roomType,
        floorType: draft.floorType,
        direction: draft.direction,
        maintenanceIncludes: draft.maintenanceIncludes,
        utilityEstimates: draft.utilityEstimates,
        fullOption: draft.fullOption,
        photoIds: draft.photoIds ?? [],
        createdAt: now,
        updatedAt: now,
      };
      return housesApi.create(stripPhotoIds(house) as House);
    },
    onSuccess: (created) => {
      qc.setQueryData(['house', created.id], created);
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
    },
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<House> }) =>
      housesApi.update(id, stripPhotoIds(patch)),
    onSuccess: (updated) => {
      qc.setQueryData(['house', updated.id], updated);
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
      qc.invalidateQueries({ queryKey: ['house', updated.id] });
    },
  });
}

export function useDeleteHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => housesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}
