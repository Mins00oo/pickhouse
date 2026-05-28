import { createApiClient } from '../client';

describe('apiClient', () => {
  it('adds Bearer header when token provided', async () => {
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'abc',
      onUnauthorized: async () => null,
    });
    const adapter = jest.fn().mockResolvedValue({
      data: {},
      status: 200,
      headers: {},
      config: {},
    });
    client.defaults.adapter = adapter;
    await client.get('/me');
    const cfg = adapter.mock.calls[0]![0];
    expect(cfg.headers.Authorization).toBe('Bearer abc');
  });

  it('on 401 calls onUnauthorized and retries with new token', async () => {
    let calls = 0;
    const onUnauthorized = jest.fn().mockResolvedValue('newtoken');
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'oldtoken',
      onUnauthorized,
    });
    const adapter = jest.fn().mockImplementation((cfg) => {
      calls += 1;
      if (calls === 1) {
        const err: any = new Error('401');
        err.response = { status: 401, data: {}, headers: {}, config: cfg };
        err.config = cfg;
        return Promise.reject(err);
      }
      return Promise.resolve({ data: { ok: true }, status: 200, headers: {}, config: cfg });
    });
    client.defaults.adapter = adapter;
    const res = await client.get('/me');
    expect(res.data).toEqual({ ok: true });
    expect(onUnauthorized).toHaveBeenCalled();
    expect(adapter.mock.calls[1]![0].headers.Authorization).toBe('Bearer newtoken');
  });

  it('does not refresh when /auth/login returns 401', async () => {
    const onUnauthorized = jest.fn().mockResolvedValue('newtoken');
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'oldtoken',
      onUnauthorized,
    });
    const adapter = jest.fn().mockImplementation((cfg) => {
      const err: any = new Error('401');
      err.response = { status: 401, data: {}, headers: {}, config: cfg };
      err.config = cfg;
      return Promise.reject(err);
    });
    client.defaults.adapter = adapter;

    await expect(client.post('/auth/login', { provider: 'kakao', idToken: 'id' })).rejects.toThrow('401');

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it('does not refresh when /auth/refresh returns 401', async () => {
    const onUnauthorized = jest.fn().mockResolvedValue('newtoken');
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => 'oldtoken',
      onUnauthorized,
    });
    const adapter = jest.fn().mockImplementation((cfg) => {
      const err: any = new Error('401');
      err.response = { status: 401, data: {}, headers: {}, config: cfg };
      err.config = cfg;
      return Promise.reject(err);
    });
    client.defaults.adapter = adapter;

    await expect(client.post('/auth/refresh', { refreshToken: 'r' })).rejects.toThrow('401');

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(adapter).toHaveBeenCalledTimes(1);
  });
});
