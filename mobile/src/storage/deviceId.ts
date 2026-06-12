import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'ph_device_id';

let deviceIdPromise: Promise<string> | null = null;

async function loadOrCreateDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (stored) return stored;

  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}

export const deviceId = {
  async get(): Promise<string> {
    if (!deviceIdPromise) {
      deviceIdPromise = loadOrCreateDeviceId().catch((error) => {
        deviceIdPromise = null;
        throw error;
      });
    }
    return deviceIdPromise;
  },
};
