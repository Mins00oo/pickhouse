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

  it('unwraps unified successful responses to response.data', async () => {
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => null,
      onUnauthorized: async () => null,
    });
    client.defaults.adapter = jest.fn().mockResolvedValue({
      data: { success: true, data: { id: 'h1' }, error: null },
      status: 200,
      headers: {},
      config: {},
    });

    const res = await client.get('/houses/h1');

    expect(res.data).toEqual({ id: 'h1' });
  });

  it('uses unified error message when the server returns an error envelope', async () => {
    const client = createApiClient({
      baseURL: 'http://test',
      getAccessToken: async () => null,
      onUnauthorized: async () => null,
    });
    const err: any = new Error('Request failed with status code 404');
    err.response = {
      status: 404,
      data: {
        success: false,
        data: null,
        error: { code: 'HOUSE_NOT_FOUND', message: '집 정보를 찾을 수 없습니다.', details: {} },
      },
      headers: {},
      config: {},
    };
    err.config = {};
    client.defaults.adapter = jest.fn().mockRejectedValue(err);

    await expect(client.get('/houses/missing')).rejects.toThrow('집 정보를 찾을 수 없습니다.');
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