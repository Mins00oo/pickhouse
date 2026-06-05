import { photosApi } from '../photos.api';
import { setApiClient } from '../client';
import axios from 'axios';

const adapter = jest.fn();
beforeEach(() => {
  adapter.mockReset();
  const client = axios.create({ baseURL: 'http://test' });
  client.defaults.adapter = adapter;
  setApiClient(client);
});

describe('photosApi', () => {
  let appendSpy: jest.SpyInstance;

  beforeEach(() => {
    appendSpy = jest.spyOn(FormData.prototype, 'append');
  });

  afterEach(() => {
    appendSpy.mockRestore();
  });

  it('upload POSTs multipart to /photos/upload', async () => {
    adapter.mockResolvedValueOnce({
      data: { id: 'p1', houseId: 'h1', remoteUrl: '/uploads/p1.jpg', takenAt: null, createdAt: '2026-05-19T00:00:00Z' },
      status: 201, headers: {}, config: {},
    });
    const result = await photosApi.upload({
      localUri: 'file:///tmp/p.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
    });
    expect(adapter.mock.calls[0]![0].url).toBe('/photos/upload');
    expect(adapter.mock.calls[0]![0].method).toBe('post');
    expect(result.id).toBe('p1');
    expect(result.remoteUrl).toBe('/uploads/p1.jpg');
  });

  it('upload includes a client-generated photo id when supplied', async () => {
    adapter.mockResolvedValueOnce({
      data: { id: 'p1', houseId: 'h1', remoteUrl: '/uploads/p1.jpg', takenAt: null, createdAt: '2026-05-19T00:00:00Z' },
      status: 201, headers: {}, config: {},
    });

    await photosApi.upload({
      localUri: 'file:///tmp/p.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
      photoId: 'p1',
    });

    expect(appendSpy).toHaveBeenCalledWith('id', 'p1');
  });

});
