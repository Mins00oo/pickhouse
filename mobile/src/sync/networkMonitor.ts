import * as Network from 'expo-network';

export const networkMonitor = {
  async isOnline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected);
  },
};
