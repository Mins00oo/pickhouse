import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { photoUploader, UploadInput } from '@/photos/photoUploader';
import { Photo } from '@/types';
import { photosApi, PhotoResponse } from '@/api/photos.api';

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInput) => photoUploader.upload(input),
    onSuccess: (_url, vars) => {
      if (vars.houseId) {
        qc.invalidateQueries({ queryKey: ['house', vars.houseId] });
        qc.invalidateQueries({ queryKey: ['house-photos', vars.houseId] });
      }
    },
  });
}

function toPhoto(p: PhotoResponse): Photo {
  return {
    id: p.id,
    houseId: p.houseId,
    residenceId: p.residenceId,
    remoteUrl: p.remoteUrl,
    takenAt: p.takenAt,
    uploadStatus: 'uploaded',
    mimeType: '',
  };
}

/** 집에 연결된 사진을 백엔드에서 조회한다(다른 기기·재설치 후에도 서버에서 다시 읽어옴). */
export function useHousePhotos(houseId: string | undefined) {
  return useQuery({
    queryKey: ['house-photos', houseId],
    enabled: Boolean(houseId),
    queryFn: async (): Promise<Photo[]> => {
      if (!houseId) return [];
      const remote = await photosApi.listForHouse(houseId);
      return remote.map(toPhoto);
    },
  });
}
