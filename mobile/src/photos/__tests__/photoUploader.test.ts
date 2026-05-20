import { photoUploader } from '../photoUploader';
import { photosApi } from '@/api/photos.api';
import { photosRepo } from '@/db/photos.repo';

jest.mock('@/api/photos.api');
jest.mock('@/db/photos.repo');

beforeEach(() => jest.clearAllMocks());

describe('photoUploader', () => {
  it('upload happy path: markUploading -> multipart upload -> updateRemoteUrl', async () => {
    (photosApi.upload as jest.Mock).mockResolvedValueOnce({
      id: 'p1',
      houseId: 'h1',
      remoteUrl: '/uploads/p1.jpg',
      createdAt: '',
    });

    const remoteUrl = await photoUploader.upload({
      localUri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
      photoId: 'p1',
    });

    expect(photosRepo.markUploading).toHaveBeenCalledWith('p1');
    expect(photosApi.upload).toHaveBeenCalledWith({
      localUri: 'file:///tmp/a.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
    });
    expect(photosRepo.updateRemoteUrl).toHaveBeenCalledWith('p1', '/uploads/p1.jpg');
    expect(remoteUrl).toBe('/uploads/p1.jpg');
  });

  it('marks failed on upload error', async () => {
    (photosApi.upload as jest.Mock).mockRejectedValueOnce(new Error('boom'));

    await expect(photoUploader.upload({
      localUri: 'file:///tmp/b.jpg',
      mimeType: 'image/jpeg',
      houseId: 'h1',
      photoId: 'p2',
    })).rejects.toThrow(/boom/);
    expect(photosRepo.markFailed).toHaveBeenCalledWith('p2');
  });
});
