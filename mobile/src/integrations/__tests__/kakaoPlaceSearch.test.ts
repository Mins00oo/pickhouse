import { placeToAddress, searchPlaces } from '../kakaoPlaceSearch';

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

describe('searchPlaces', () => {
  it('parses keyword results (x=lng, y=lat) and sends KakaoAK header', async () => {
    const fetchMock = mockFetch({
      json: {
        documents: [
          { place_name: '연세대학교', road_address_name: '서울 서대문구 연세로 50', address_name: '신촌동 134', x: '126.9387', y: '37.5658' },
        ],
      },
    });
    const results = await searchPlaces('연세대학교', 'test-key');
    expect(results).toEqual([
      {
        placeName: '연세대학교',
        roadAddressName: '서울 서대문구 연세로 50',
        addressName: '신촌동 134',
        latitude: 37.5658,
        longitude: 126.9387,
      },
    ]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain('dapi.kakao.com/v2/local/search/keyword.json');
    expect((init as { headers: Record<string, string> }).headers.Authorization).toBe('KakaoAK test-key');
  });

  it('skips documents with non-finite coordinates', async () => {
    mockFetch({ json: { documents: [{ place_name: 'x', x: 'abc', y: 'def' }] } });
    expect(await searchPlaces('x', 'test-key')).toEqual([]);
  });

  it('returns [] for empty results', async () => {
    mockFetch({ json: { documents: [] } });
    expect(await searchPlaces('없는 장소', 'test-key')).toEqual([]);
  });

  it('returns [] and does NOT fetch when key or query is missing', async () => {
    const fetchMock = mockFetch({ json: { documents: [] } });
    expect(await searchPlaces('x', undefined)).toEqual([]);
    expect(await searchPlaces('   ', 'test-key')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns [] when response is not ok or fetch throws', async () => {
    mockFetch({ ok: false, json: {} });
    expect(await searchPlaces('x', 'test-key')).toEqual([]);
    mockFetch(new Error('network'));
    expect(await searchPlaces('x', 'test-key')).toEqual([]);
  });
});

describe('placeToAddress', () => {
  it('maps a search result to our Address with coordinates', () => {
    expect(
      placeToAddress({
        placeName: '연세대학교',
        roadAddressName: '서울 서대문구 연세로 50',
        addressName: '신촌동 134',
        latitude: 37.5658,
        longitude: 126.9387,
      }),
    ).toEqual({
      roadAddress: '서울 서대문구 연세로 50',
      jibunAddress: '신촌동 134',
      zonecode: '',
      latitude: 37.5658,
      longitude: 126.9387,
    });
  });

  it('falls back to jibun address when road address is empty', () => {
    expect(
      placeToAddress({ placeName: 'x', roadAddressName: '', addressName: '신촌동 134', latitude: 1, longitude: 2 })
        .roadAddress,
    ).toBe('신촌동 134');
  });
});
