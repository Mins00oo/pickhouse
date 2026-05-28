import { authApi } from '../auth.api';
import { setApiClient } from '../client';
import axios from 'axios';

describe('authApi', () => {
  it('login POSTs provider + idToken to /auth/login', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'a', refreshToken: 'r', user: { id: 'u1', authProviders: {}, createdAt: '' } },
      status: 200, headers: {}, config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);
    const res = await authApi.login({ provider: 'apple', idToken: 'token123' });
    expect(adapter).toHaveBeenCalled();
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/login');
    expect(JSON.parse(cfg.data)).toEqual({ provider: 'apple', idToken: 'token123' });
    expect(res.accessToken).toBe('a');
  });

  it('refresh POSTs refreshToken to /auth/refresh', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { accessToken: 'newA', refreshToken: 'newR' },
      status: 200, headers: {}, config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);
    const res = await authApi.refresh('oldR');
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/auth/refresh');
    expect(JSON.parse(cfg.data)).toEqual({ refreshToken: 'oldR' });
    expect(res.accessToken).toBe('newA');
  });

  it('me GETs /me for session restoration', async () => {
    const client = axios.create({ baseURL: 'http://test' });
    const adapter = jest.fn().mockResolvedValue({
      data: { id: 'u1', email: 'me@example.com', nickname: 'picker', createdAt: '2026-01-01T00:00:00Z' },
      status: 200, headers: {}, config: {},
    });
    client.defaults.adapter = adapter;
    setApiClient(client);

    const res = await authApi.me();

    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.url).toBe('/me');
    expect(res.id).toBe('u1');
    expect(res.nickname).toBe('picker');
  });
});
