import { House, Residence } from '@/types';
import { getApiClient } from './client';

export const housesApi = {
  async list(): Promise<House[]> {
    const res = await getApiClient().get<House[]>('/houses');
    return res.data;
  },

  async get(id: string): Promise<House> {
    const res = await getApiClient().get<House>(`/houses/${id}`);
    return res.data;
  },

  async create(body: House): Promise<House> {
    const res = await getApiClient().post<House>('/houses', body);
    return res.data;
  },

  async update(id: string, patch: Partial<House>): Promise<House> {
    const res = await getApiClient().patch<House>(`/houses/${id}`, patch);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/houses/${id}`);
  },

  async promoteToResidence(
    id: string,
    body: {
      name: string;
      contractStartDate: string;
      contractEndDate: string;
      eraLabel?: string;
      isFavorite?: boolean;
      isCurrent?: boolean;
      landlordMemo?: string;
      meterReadings?: {
        electricity?: number;
        water?: number;
        gas?: number;
        recordedAt?: string;
      };
      moveInPhotoIds?: string[];
      contractPhotoId?: string;
    },
  ): Promise<Residence> {
    const res = await getApiClient().post<Residence>(`/houses/${id}/promote-to-residence`, body);
    return res.data;
  },
};
