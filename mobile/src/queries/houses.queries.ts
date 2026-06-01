import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { House, HouseDraft } from '@/types';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';
import { syncQueue } from '@/sync/syncQueue';
import { useAuthStore } from '@/stores/authStore';
import { lastWriteWins } from '@/sync/conflictResolution';

const HOUSES_KEY = ['houses'] as const;

export function useHouses() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: HOUSES_KEY,
    enabled: Boolean(userId),
    queryFn: async () => {
      const local = userId ? await housesRepo.listActive(userId) : [];
      try {
        const remote = await housesApi.list();
        return mergeHouses(local, remote);
      } catch {
        return local;
      }
    },
  });
}

function mergeHouses(local: House[], remote: House[]): House[] {
  const byId = new Map<string, House>();
  for (const h of remote) byId.set(h.id, h);
  for (const h of local) {
    const r = byId.get(h.id);
    byId.set(h.id, lastWriteWins(h, r ?? null));
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useHouse(id: string | undefined) {
  return useQuery({
    queryKey: ['house', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const local = await housesRepo.findById(id);
      try {
        const remote = await housesApi.get(id);
        return lastWriteWins(local ?? remote, remote);
      } catch {
        if (!local) throw new Error('not found');
        return local;
      }
    },
  });
}

export function useCreateHouse() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? 'unknown';
  return useMutation({
    mutationFn: async (draft: HouseDraft) => {
      const now = new Date().toISOString();
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
      await housesRepo.insert(house, userId);
      await syncQueue.queueHouseCreate(house);
      return house;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
    },
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<House> }) => {
      const existing = await housesRepo.findById(id);
      if (!existing) throw new Error('house not found locally');
      const updated: House = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await housesRepo.update(updated);
      await syncQueue.queueHouseUpdate(id, patch);
      return updated;
    },
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: HOUSES_KEY });
      qc.invalidateQueries({ queryKey: ['house', h.id] });
    },
  });
}

export function useDeleteHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await housesRepo.softDelete(id);
      await syncQueue.queueHouseDelete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSES_KEY }),
  });
}
