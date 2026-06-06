import * as ImagePicker from 'expo-image-picker';
import { photoCache } from './photoCache';
import { photosRepo } from '@/db/photos.repo';

export interface CapturedPhoto {
  id: string;
  localUri: string;
  mimeType: string;
  width?: number;
  height?: number;
}

async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

async function ensureLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export const cameraHelper = {
  async takePhoto(houseId?: string): Promise<CapturedPhoto | null> {
    const ok = await ensureCameraPermission();
    if (!ok) return null;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const asset = result.assets[0]!;
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const { localUri, id } = await photoCache.copyToCache(asset.uri, mimeType);
    await photosRepo.insert({
      id,
      houseId,
      localUri,
      uploadStatus: 'pending',
      takenAt: new Date().toISOString(),
      width: asset.width,
      height: asset.height,
      mimeType,
    });
    return { id, localUri, mimeType, width: asset.width, height: asset.height };
  },

  async pickFromLibrary(houseId?: string, max = 10): Promise<CapturedPhoto[]> {
    const ok = await ensureLibraryPermission();
    if (!ok) return [];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: max,
    });
    if (result.canceled) return [];
    const out: CapturedPhoto[] = [];
    for (const asset of result.assets) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const { localUri, id } = await photoCache.copyToCache(asset.uri, mimeType);
      await photosRepo.insert({
        id,
        houseId,
        localUri,
        uploadStatus: 'pending',
        takenAt: new Date().toISOString(),
        width: asset.width,
        height: asset.height,
        mimeType,
      });
      out.push({ id, localUri, mimeType, width: asset.width, height: asset.height });
    }
    return out;
  },
};
