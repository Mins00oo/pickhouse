import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateHouseRequest, House, HouseDraft, HouseRequestFields, UpdateHouseRequest } from '@/types';
import { housesApi } from '@/api/houses.api';
import { useAuthStore } from '@/stores/authStore';

const HOUSES_KEY = ['houses'] as const;

type ClientOnlyHouseFields = {
  id?: unknown;
  photoIds?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function omitUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function normalizeApiInstant(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00.000Z`;
  }
  return value;
}

function toHouseRequestFields(
  input: Partial<HouseRequestFields> & ClientOnlyHouseFields,
): UpdateHouseRequest {
  return omitUndefined({
    address: input.address,
    dealType: input.dealType,
    deposit: input.deposit,
    rent: input.rent,
    maintenanceFee: input.maintenanceFee,
    area: input.area,
    builtYear: input.builtYear,
    floor: input.floor,
    totalFloor: input.totalFloor,
    availableFrom: input.availableFrom,
    stationDistance: input.stationDistance,
    rooms: input.rooms,
    bathrooms: input.bathrooms,
    hasBalcony: input.hasBalcony,
    hasElevator: input.hasElevator,
    hasParking: input.hasParking,
    options: input.options,
    security: input.security,
    garbage: input.garbage,
    waterPressure: input.waterPressure,
    sunlight: input.sunlight,
    noise: input.noise,
    insulation: input.insulation,
    ventilation: input.ventilation,
    moisture: input.moisture,
    neighborhood: input.neighborhood,
    firstImpression: input.firstImpression,
    memo: input.memo,
    nickname: input.nickname,
    visitedAt: normalizeApiInstant(input.visitedAt),
    roomType: input.roomType,
    floorType: input.floorType,
    direction: input.direction,
    maintenanceIncludes: input.maintenanceIncludes,
    utilityEstimates: input.utilityEstimates,
    fullOption: input.fullOption,
    contractedAt: normalizeApiInstant(input.contractedAt),
  });
}

function toCreateHouseRequest(draft: HouseDraft): CreateHouseRequest {
  return {
    ...toHouseRequestFields(draft),
    dealType: draft.dealType,
    deposit: draft.deposit,
    rent: draft.dealType === 'JEONSE' ? 0 : (draft.rent ?? 0),
  } as CreateHouseRequest;
}

function toUpdateHouseRequest(patch: Partial<House> & ClientOnlyHouseFields): UpdateHouseRequest {
  return toHouseRequestFields(patch);
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
    mutationFn: async (draft: HouseDraft) => housesApi.create(toCreateHouseRequest(draft)),
    onSuccess: (created) => {
      qc.setQueryData(['house', created.id], created);
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
    },
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<House> & ClientOnlyHouseFields }) =>
      housesApi.update(id, toUpdateHouseRequest(patch)),
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
