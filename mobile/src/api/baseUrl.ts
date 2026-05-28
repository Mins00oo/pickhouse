import Constants from 'expo-constants';

const LOCAL_PLACEHOLDER = 'YOUR_LAN_IP';
const LOCAL_API_BASE_URL = 'http://localhost:8080';
const PRODUCTION_API_BASE_URL = 'https://api.pickhouse.app';
const BACKEND_PORT = 8080;

function getExpoDevHost(): string | undefined {
  return Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
}

function buildDevApiBaseUrl(devHost?: string): string {
  if (!devHost) return LOCAL_API_BASE_URL;
  const host = devHost.split(':')[0];
  return host ? `http://${host}:${BACKEND_PORT}` : LOCAL_API_BASE_URL;
}

export function resolveApiBaseUrl(
  value = process.env.EXPO_PUBLIC_API_BASE_URL,
  isDev = __DEV__,
  devHost = getExpoDevHost(),
): string {
  if (value && !value.includes(LOCAL_PLACEHOLDER)) {
    return value;
  }
  return isDev ? buildDevApiBaseUrl(devHost) : PRODUCTION_API_BASE_URL;
}
