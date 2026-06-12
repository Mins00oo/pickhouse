import { photosApi } from '@/api/photos.api';
import { photoUploader } from '../photoUploader';

jest.mock('@/api/photos.api');

describe('photoUploader', () => {
  it('uploads directly and returns the remote URL', async () => {
    (photosApi.upload as jest.Mock).mockResolvedValueOnce({
      id: 'p1',
      houseId: 'h1',
      remoteUrl: '/uploads/p1.jpg',
      createdAt: '',
    });

    await expect(
      photoUploader.upload({
        localUri: 'file:///tmp/a.jpg',
        mimeType: 'image/jpeg',
        houseId: 'h1',
        photoId: 'p1',
      }),
    ).resolves.toBe('/uploads/p1.jpg');
  });
});
