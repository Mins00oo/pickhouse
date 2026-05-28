import { getApiClient } from './client';

export interface PhotoUploadInput {
  localUri: string;
  mimeType: string;
  photoId?: string;
  houseId?: string;
  residenceId?: string;
  takenAt?: string;
}

interface PhotoUploadResponse {
  id: string;
  houseId?: string;
  residenceId?: string;
  remoteUrl: string;
  takenAt?: string;
  createdAt: string;
}

export const photosApi = {
  async upload(input: PhotoUploadInput): Promise<PhotoUploadResponse> {
    const filename = input.localUri.split('/').pop() ?? 'photo.jpg';
    const form = new FormData();
    form.append('file', {
      uri: input.localUri,
      name: filename,
      type: input.mimeType,
    } as unknown as Blob);
    if (input.photoId) form.append('id', input.photoId);
    if (input.houseId) form.append('houseId', input.houseId);
    if (input.residenceId) form.append('residenceId', input.residenceId);
    if (input.takenAt) form.append('takenAt', input.takenAt);

    const res = await getApiClient().post<PhotoUploadResponse>('/photos/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
