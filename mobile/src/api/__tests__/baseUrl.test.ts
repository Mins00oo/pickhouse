jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {},
}));

import { resolveApiBaseUrl } from '../baseUrl';

describe('resolveApiBaseUrl', () => {
  it('uses explicit API URL when it is configured', () => {
    expect(resolveApiBaseUrl('https://api.pickhouse.app', true)).toBe('https://api.pickhouse.app');
  });

  it('uses the Expo dev server host in development when URL is missing', () => {
    expect(resolveApiBaseUrl(undefined, true, '192.168.0.23:8081')).toBe('http://192.168.0.23:8080');
  });

  it('treats the LAN placeholder as missing in development and uses Expo host', () => {
    expect(resolveApiBaseUrl('http://YOUR_LAN_IP:8080', true, '192.168.0.23:8081')).toBe('http://192.168.0.23:8080');
  });

  it('falls back to localhost in development when Expo host is unavailable', () => {
    expect(resolveApiBaseUrl(undefined, true)).toBe('http://localhost:8080');
  });

  it('falls back to production API outside development', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('https://api.pickhouse.app');
  });
});
