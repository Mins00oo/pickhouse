import { estimateCommute } from '../commuteEstimate';
import { routeDistance } from '../kakaoDirections';

jest.mock('../kakaoDirections', () => ({ routeDistance: jest.fn() }));
const mockRouteDistance = routeDistance as jest.MockedFunction<typeof routeDistance>;

const origin = { latitude: 37.556, longitude: 126.901 };
const dest = { latitude: 37.5, longitude: 127.03 };

beforeEach(() => mockRouteDistance.mockReset());

describe('estimateCommute', () => {
  it('CAR uses real Kakao driving route when available (distance + car time)', async () => {
    mockRouteDistance.mockResolvedValueOnce({ distanceM: 3200, durationSec: 720 });
    const out = await estimateCommute('CAR', origin, dest, 'test-key');
    expect(out).toEqual({ km: 3.2, durationMin: 12, source: 'driving', mode: 'CAR' });
  });

  it('CAR falls back to a straight-line estimate when routing is unavailable', async () => {
    mockRouteDistance.mockResolvedValueOnce(null);
    const out = await estimateCommute('CAR', origin, dest, 'test-key');
    expect(out.source).toBe('estimate');
    expect(out.mode).toBe('CAR');
    expect(out.km).toBeGreaterThan(0);
    expect(out.durationMin).toBeGreaterThanOrEqual(1);
  });

  it('TRANSIT estimates without calling the driving API', async () => {
    const out = await estimateCommute('TRANSIT', origin, dest);
    expect(out.source).toBe('estimate');
    expect(out.mode).toBe('TRANSIT');
    expect(out.durationMin).toBeGreaterThan(0);
    expect(mockRouteDistance).not.toHaveBeenCalled();
  });

  it('WALK is slower than TRANSIT for the same coordinates', async () => {
    const walk = await estimateCommute('WALK', origin, dest);
    const transit = await estimateCommute('TRANSIT', origin, dest);
    expect(walk.source).toBe('estimate');
    expect(walk.mode).toBe('WALK');
    expect(walk.durationMin).toBeGreaterThan(transit.durationMin);
  });
});
