import { housesApi } from '../houses.api';
import { setApiClient } from '../client';
import axios from 'axios';

const adapter = jest.fn();
beforeEach(() => {
  adapter.mockReset();
  const client = axios.create({ baseURL: 'http://test' });
  client.defaults.adapter = adapter;
  setApiClient(client);
});

describe('housesApi', () => {
  it('list GETs /houses', async () => {
    adapter.mockResolvedValueOnce({ data: [], status: 200, headers: {}, config: {} });
    await housesApi.list();
    expect(adapter.mock.calls[0]![0].url).toBe('/houses');
    expect(adapter.mock.calls[0]![0].method).toBe('get');
  });

  it('create POSTs to /houses', async () => {
    adapter.mockResolvedValueOnce({ data: { id: 'h1' }, status: 201, headers: {}, config: {} });
    await housesApi.create({ id: 'h1' } as any);
    expect(adapter.mock.calls[0]![0].url).toBe('/houses');
    expect(adapter.mock.calls[0]![0].method).toBe('post');
  });

  it('update PATCHes /houses/{id}', async () => {
    adapter.mockResolvedValueOnce({ data: { id: 'h1' }, status: 200, headers: {}, config: {} });
    await housesApi.update('h1', { memo: 'x' } as any);
    expect(adapter.mock.calls[0]![0].url).toBe('/houses/h1');
    expect(adapter.mock.calls[0]![0].method).toBe('patch');
  });

  it('remove DELETEs /houses/{id}', async () => {
    adapter.mockResolvedValueOnce({ data: {}, status: 204, headers: {}, config: {} });
    await housesApi.remove('h1');
    expect(adapter.mock.calls[0]![0].url).toBe('/houses/h1');
    expect(adapter.mock.calls[0]![0].method).toBe('delete');
  });
});
