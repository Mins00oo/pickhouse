import { photosApi } from '@/api/photos.api';

export interface UploadInput {
  localUri: string;
  mimeType: string;
  houseId?: string;
  photoId: string;
}

export const photoUploader = {
  async upload(input: UploadInput): Promise<string> {
    const result = await photosApi.upload({
      localUri: input.localUri,
      mimeType: input.mimeType,
      photoId: input.photoId,
      ...(input.houseId ? { houseId: input.houseId } : {}),
    });
    return result.remoteUrl;
  },
};
