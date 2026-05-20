import { Residence } from '@/types';
import { getApiClient } from './client';

export const residencesApi = {
  async list(): Promise<Residence[]> {
    const res = await getApiClient().get<Residence[]>('/residences');
    return res.data;
  },
  async get(id: string): Promise<Residence> {
    const res = await getApiClient().get<Residence>(`/residences/${id}`);
    return res.data;
  },
};
