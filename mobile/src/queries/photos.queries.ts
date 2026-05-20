import { useMutation, useQueryClient } from '@tanstack/react-query';
import { photoUploader, UploadInput } from '@/photos/photoUploader';

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInput) => photoUploader.upload(input),
    onSuccess: (_url, vars) => {
      if (vars.houseId) {
        qc.invalidateQueries({ queryKey: ['house', vars.houseId] });
      }
    },
  });
}
