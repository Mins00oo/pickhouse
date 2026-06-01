import { routeDistance } from '../kakaoDirections';

type FetchResult = { ok?: boolean; json?: unknown } | Error;

function mockFetch(value: FetchResult) {
  const fn = jest.fn();
  if (value instanceof Error) {
    fn.mockRejectedValueOnce(value);
  } else {
    fn.mockResolvedValueOnce({ ok: value.ok ?? true, json: async () => value.json });
  }
  (global as unknown as { fetch: jest.Mock }).fetch = fn;
  return fn;
}

const origin = { latitude: 37.556, longitude: 126.901 };
const dest = { latitude: 37.5, longitude: 127.03 };

afterEach(() => {
  jest.restoreAllMocks();
  delete (global as { fetch?: unknown }).fetch;
});

describe('routeDistance', () => {
  it('parses summary distance/duration and sends origin,dest as lng,lat with KakaoAK', async () => {
    const fetchMock = mockFetch({
      json: { routes: [{ result_code: 0, summary: { distance: 3200, duration: 720 } }] },
    });
    const out = await routeDistance(origin, dest, 'test-key');
    expect(out).toEqual({ distanceM: 3200, durationSec: 720 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('apis-navi.kakaomobility.com/v1/directions');
    expect(url).toContain('origin=126.901,37.556');
    expect(url).toContain('destination=127.03,37.5');
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe('KakaoAK test-key');
  });

  it('returns null when the route result_code is non-zero', async () => {
    mockFetch({ json: { routes: [{ result_code: 104, summary: {} }] } });
    expect(await routeDistance(origin, dest, 'test-key')).toBeNull();
  });

  it('returns null when response is not ok (e.g. 401 service not enabled)', async () => {
    mockFetch({ ok: false, json: {} });
    expect(await routeDistance(origin, dest, 'test-key')).toBeNull();
  });

  it('returns null and does NOT fetch when key is missing', async () => {
    const fetchMock = mockFetch({ json: { routes: [] } });
    expect(await routeDistance(origin, dest, undefined)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when fetch throws', async () => {
    mockFetch(new Error('network'));
    expect(await routeDistance(origin, dest, 'test-key')).toBeNull();
  });
});
