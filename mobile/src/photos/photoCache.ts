import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const PHOTO_DIR = (FileSystem.documentDirectory ?? '') + 'photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export const photoCache = {
  async copyToCache(sourceUri: string, mimeType: string): Promise<{ localUri: string; id: string }> {
    await ensureDir();
    const id = Crypto.randomUUID();
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';
    const target = `${PHOTO_DIR}${id}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: target });
    return { localUri: target, id };
  },

  async remove(localUri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    } catch {
      // ignore
    }
  },
};
