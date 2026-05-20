import { House } from '@/types';
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
    body: { contractStartDate: string; contractEndDate: string; landlordMemo?: string },
  ): Promise<void> {
    await getApiClient().post(`/houses/${id}/promote-to-residence`, body);
  },
};
