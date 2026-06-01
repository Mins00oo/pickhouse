import { geocodeAddress, attachCoords } from '../kakaoGeocode';
import type { Address } from '@/types';

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

afterEach(() => {
  jest.restoreAllMocks();
  delete (global as { fetch?: unknown }).fetch;
});

describe('geocodeAddress', () => {
  it('returns lat/lng from documents[0] (x=lng, y=lat) and sends KakaoAK header', async () => {
    const fetchMock = mockFetch({ json: { documents: [{ x: '126.97', y: '37.55' }] } });
    const coord = await geocodeAddress('서울 용산구 청파로47길 22', 'test-key');
    expect(coord).toEqual({ latitude: 37.55, longitude: 126.97 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('dapi.kakao.com/v2/local/search/address.json');
    expect(url).toContain('query=');
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe(
      'KakaoAK test-key',
    );
  });

  it('returns null when documents is empty', async () => {
    mockFetch({ json: { documents: [] } });
    expect(await geocodeAddress('없는 주소', 'test-key')).toBeNull();
  });

  it('returns null when response is not ok', async () => {
    mockFetch({ ok: false, json: {} });
    expect(await geocodeAddress('x', 'test-key')).toBeNull();
  });

  it('returns null and does NOT fetch when api key is missing', async () => {
    const fetchMock = mockFetch({ json: { documents: [{ x: '1', y: '1' }] } });
    expect(await geocodeAddress('x', undefined)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null and does NOT fetch for empty query', async () => {
    const fetchMock = mockFetch({ json: { documents: [] } });
    expect(await geocodeAddress('', 'test-key')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when fetch throws (network error)', async () => {
    mockFetch(new Error('network down'));
    expect(await geocodeAddress('x', 'test-key')).toBeNull();
  });

  it('returns null when coordinates are non-finite', async () => {
    mockFetch({ json: { documents: [{ x: 'abc', y: 'def' }] } });
    expect(await geocodeAddress('x', 'test-key')).toBeNull();
  });
});

describe('attachCoords', () => {
  const addr: Address = {
    roadAddress: '서울 용산구 청파로47길 22',
    jibunAddress: '청파동1가 56-3',
    zonecode: '04303',
  };

  it('merges coordinates into the address on success', async () => {
    mockFetch({ json: { documents: [{ x: '126.97', y: '37.55' }] } });
    const out = await attachCoords(addr, 'test-key');
    expect(out).toEqual({ ...addr, latitude: 37.55, longitude: 126.97 });
  });

  it('returns the original address unchanged on geocode failure', async () => {
    mockFetch({ json: { documents: [] } });
    const out = await attachCoords(addr, 'test-key');
    expect(out).toEqual(addr);
    expect(out.latitude).toBeUndefined();
  });
});
