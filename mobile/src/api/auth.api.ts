import { LoginRequest, LoginResponse, RefreshResponse, User } from '@/types';
import { getApiClient } from './client';

export const authApi = {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await getApiClient().post<LoginResponse>('/auth/login', body);
    return res.data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const res = await getApiClient().post<RefreshResponse>('/auth/refresh', { refreshToken });
    return res.data;
  },

  async me(): Promise<User> {
    const res = await getApiClient().get<User>('/me');
    return res.data;
  },
};
