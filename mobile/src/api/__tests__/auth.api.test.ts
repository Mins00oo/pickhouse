import axios from 'axios';
import { authApi } from '../auth.api';
import { setApiClient } from '../client';

describe('authApi', () => {
  it('login posts the new device-aware request', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r' },
      status: 200,
      headers: {},
      config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);

    await authApi.login({
      provider: 'APPLE',
      idToken: 'token123',
      deviceId: 'device-1',
      displayName: null,
    });

    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/login');
    expect(JSON.parse(cfg.data)).toEqual({
      provider: 'APPLE',
      idToken: 'token123',
      deviceId: 'device-1',
      displayName: null,
    });
  });

  it('refresh posts refreshToken and deviceId', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'newA', refreshToken: 'newR' },
      status: 200,
      headers: {},
      config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);

    await authApi.refresh({ refreshToken: 'oldR', deviceId: 'device-1' });

    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/refresh');
    expect(JSON.parse(cfg.data)).toEqual({ refreshToken: 'oldR', deviceId: 'device-1' });
  });

  it('uses /users/me for profile requests', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { nickname: 'picker', createdAt: '2026-01-01T00:00:00' },
      status: 200,
      headers: {},
      config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);

    const profile = await authApi.me();

    expect(adapter.mock.calls[0]![0].url).toBe('/users/me');
    expect(profile.nickname).toBe('picker');
  });
});
