import { CreateHouseRequest, House, UpdateHouseRequest } from '@/types';
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

  async create(body: CreateHouseRequest): Promise<House> {
    const res = await getApiClient().post<House>('/houses', body);
    return res.data;
  },

  async update(id: string, patch: UpdateHouseRequest): Promise<House> {
    const res = await getApiClient().patch<House>(`/houses/${id}`, patch);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/houses/${id}`);
  },
};
