import { photosApi } from '@/api/photos.api';
import { photosRepo } from '@/db/photos.repo';

export interface UploadInput {
  localUri: string;
  mimeType: string;
  houseId?: string;
  residenceId?: string;
  photoId: string;
}

export const photoUploader = {
  async upload(input: UploadInput): Promise<string> {
    await photosRepo.markUploading(input.photoId);
    try {
      const result = await photosApi.upload({
        localUri: input.localUri,
        mimeType: input.mimeType,
        houseId: input.houseId,
        residenceId: input.residenceId,
      });
      await photosRepo.updateRemoteUrl(input.photoId, result.remoteUrl);
      return result.remoteUrl;
    } catch (e) {
      await photosRepo.markFailed(input.photoId);
      throw e;
    }
  },
};
