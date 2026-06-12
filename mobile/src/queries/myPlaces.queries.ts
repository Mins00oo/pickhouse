import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Address, MyPlace, PlaceType, TransportMode } from '@/types';
import { myPlacesApi } from '@/api/myPlaces.api';
import { attachCoords } from '@/integrations/kakaoGeocode';
import { useAuthStore } from '@/stores/authStore';

const MY_PLACES_KEY = ['myPlaces'] as const;

export function useMyPlaces() {
  const authenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: MY_PLACES_KEY,
    enabled: authenticated,
    queryFn: () => myPlacesApi.list(),
  });
}

export interface SavePlaceInput {
  id?: string;
  placeType: PlaceType;
  address: Address;
  transport: TransportMode;
  isPrimary: boolean;
  label?: string;
}

export function useSavePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SavePlaceInput) => {
      const address =
        typeof input.address.latitude === 'number' && typeof input.address.longitude === 'number'
          ? input.address
          : await attachCoords(input.address);
      const now = new Date().toISOString();
      const fields = {
        placeType: input.placeType,
        label: input.label,
        address,
        transport: input.transport,
        isPrimary: input.isPrimary,
        updatedAt: now,
      };

      if (input.id) {
        return myPlacesApi.update(input.id, fields);
      }

      const place: MyPlace = {
        id: Crypto.randomUUID(),
        ...fields,
        createdAt: now,
      };
      return myPlacesApi.create(place);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PLACES_KEY });
    },
  });
}

export function useRemovePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => myPlacesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_PLACES_KEY });
    },
  });
}
