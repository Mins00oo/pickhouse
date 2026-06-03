import { AnchorPlace } from '@/types';
import { getApiClient } from './client';

export const anchorPlacesApi = {
  async list(): Promise<AnchorPlace[]> {
    const res = await getApiClient().get<AnchorPlace[]>('/anchor-places');
    return res.data;
  },

  async create(body: AnchorPlace): Promise<AnchorPlace> {
    const res = await getApiClient().post<AnchorPlace>('/anchor-places', body);
    return res.data;
  },

  async update(id: string, patch: Partial<AnchorPlace>): Promise<AnchorPlace> {
    const res = await getApiClient().patch<AnchorPlace>(`/anchor-places/${id}`, patch);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/anchor-places/${id}`);
  },
};
