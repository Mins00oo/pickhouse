import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncProcessor } from './syncProcessor';
import { photoUploader } from '@/photos/photoUploader';
import { photosRepo } from '@/db/photos.repo';
import { useAuthStore } from '@/stores/authStore';
import { networkMonitor } from './networkMonitor';

const SYNC_INTERVAL_MS = 30_000;

async function processPendingPhotos(): Promise<void> {
  const online = await networkMonitor.isOnline();
  if (!online) return;
  const pending = await photosRepo.listPending();
  for (const p of pending) {
    if (!p.localUri) continue;
    if (!p.houseId) continue;
    try {
      await photoUploader.upload({
        localUri: p.localUri,
        mimeType: p.mimeType,
        houseId: p.houseId,
        photoId: p.id,
      });
    } catch {
      // marked failed inside uploader; next cycle retries
    }
  }
}

export function useSyncOrchestrator() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const kick = () => {
      void (async () => {
        await syncProcessor.processOnce();
        await processPendingPhotos();
      })();
    };

    kick();
    timer = setInterval(kick, SYNC_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') kick();
    });

    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [status]);
}
