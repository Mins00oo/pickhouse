import { MyPlace } from '@/types';
import { getApiClient } from './client';

export const myPlacesApi = {
  async list(): Promise<MyPlace[]> {
    const res = await getApiClient().get<MyPlace[]>('/my-places');
    return res.data;
  },

  async create(body: MyPlace): Promise<MyPlace> {
    const res = await getApiClient().post<MyPlace>('/my-places', body);
    return res.data;
  },

  async update(id: string, patch: Partial<MyPlace>): Promise<MyPlace> {
    const res = await getApiClient().patch<MyPlace>(`/my-places/${id}`, patch);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/my-places/${id}`);
  },
};
