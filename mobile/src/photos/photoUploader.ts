import { photosApi } from '@/api/photos.api';
import { photosRepo } from '@/db/photos.repo';

export interface UploadInput {
  localUri: string;
  mimeType: string;
  houseId?: string;
  photoId: string;
}

export const photoUploader = {
  async upload(input: UploadInput): Promise<string> {
    await photosRepo.markUploading(input.photoId);
    try {
      const uploadInput = {
        localUri: input.localUri,
        mimeType: input.mimeType,
        photoId: input.photoId,
        ...(input.houseId ? { houseId: input.houseId } : {}),
      };
      const result = await photosApi.upload({
        ...uploadInput,
      });
      await photosRepo.updateRemoteUrl(input.photoId, result.remoteUrl);
      return result.remoteUrl;
    } catch (e) {
      await photosRepo.markFailed(input.photoId);
      throw e;
    }
  },
};
