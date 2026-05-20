import * as Network from 'expo-network';
import { networkMonitor } from '../networkMonitor';

describe('networkMonitor', () => {
  it('isOnline returns true when connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({ isConnected: true });
    expect(await networkMonitor.isOnline()).toBe(true);
  });

  it('isOnline returns false when not connected', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({ isConnected: false });
    expect(await networkMonitor.isOnline()).toBe(false);
  });
});
