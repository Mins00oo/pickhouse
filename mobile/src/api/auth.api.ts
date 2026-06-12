import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  UserProfile,
} from '@/types';
import { AxiosRequestConfig } from 'axios';
import { getApiClient } from './client';

const PUBLIC_REQUEST: AxiosRequestConfig = { skipAuth: true };

export const authApi = {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const res = await getApiClient().post<LoginResponse>('/auth/login', body, PUBLIC_REQUEST);
    return res.data;
  },

  async refresh(body: RefreshRequest): Promise<RefreshResponse> {
    const res = await getApiClient().post<RefreshResponse>('/auth/refresh', body, PUBLIC_REQUEST);
    return res.data;
  },

  async logout(body: LogoutRequest): Promise<void> {
    await getApiClient().post('/auth/logout', body, PUBLIC_REQUEST);
  },

  async me(): Promise<UserProfile> {
    const res = await getApiClient().get<UserProfile>('/users/me');
    return res.data;
  },

  async deleteMe(): Promise<void> {
    await getApiClient().delete('/users/me');
  },
};
