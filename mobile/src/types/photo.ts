export type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface Photo {
  id: string;
  houseId?: string;
  residenceId?: string;
  localUri?: string;
  remoteUrl?: string;
  uploadStatus: UploadStatus;
  takenAt?: string;
  width?: number;
  height?: number;
  mimeType: string;
}
