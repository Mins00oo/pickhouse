import {
  deriveCommuteMode,
  formatMyPlaceDistance,
  formatKm,
  getMyPlaceCoordinate,
  haversineKm,
  pickPrimaryMyPlaces,
} from '../houseMapUtils';
import { MyPlace, PlaceType } from '@/types';

const baseAddress = { roadAddress: '주소', jibunAddress: '', zonecode: '' };

function myPlace(latitude?: number, longitude?: number): MyPlace {
  return {
    id: 'a1',
    placeType: 'WORKPLACE',
    address: { ...baseAddress, latitude, longitude },
    transport: 'CAR',
    isPrimary: false,
    createdAt: '2026',
    updatedAt: '2026',
  };
}

function place(over: Partial<MyPlace> & { id: string; placeType: PlaceType }): MyPlace {
  return {
    address: { ...baseAddress, latitude: 37.5, longitude: 127.0 },
    transport: 'CAR',
    isPrimary: false,
    createdAt: '2026',
    updatedAt: '2026',
    ...over,
  };
}

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    const p = { latitude: 37.5, longitude: 127.0 };
    expect(haversineKm(p, p)).toBeCloseTo(0, 5);
  });

  it('approximates 서울시청 ↔ 강남역 (~8-9km)', () => {
    const cityHall = { latitude: 37.5663, longitude: 126.9779 };
    const gangnam = { latitude: 37.4979, longitude: 127.0276 };
    const km = haversineKm(cityHall, gangnam);
    expect(km).toBeGreaterThan(7);
    expect(km).toBeLessThan(10);
  });
});

describe('getMyPlaceCoordinate', () => {
  it('returns the coordinate when lat/lng are present', () => {
    expect(getMyPlaceCoordinate(myPlace(37.5, 127.0))).toEqual({ latitude: 37.5, longitude: 127.0 });
  });

  it('returns null when coordinates are missing', () => {
    expect(getMyPlaceCoordinate(myPlace(undefined, undefined))).toBeNull();
  });
});

describe('formatKm', () => {
  it('uses meters under 1km (rounded to 10m)', () => {
    expect(formatKm(0.35)).toBe('350m');
    expect(formatKm(0.356)).toBe('360m');
  });

  it('uses one-decimal km at or above 1km', () => {
    expect(formatKm(1.24)).toBe('1.2km');
    expect(formatKm(3.0)).toBe('3.0km');
  });
});

describe('formatMyPlaceDistance', () => {
  it('shows distance + driving minutes for a driving source', () => {
    expect(
      formatMyPlaceDistance({ placeType: 'WORKPLACE', km: 3.2, source: 'driving', durationMin: 12 }),
    ).toBe('3.2km · 차 12분');
  });

  it('labels straight-line fallback honestly', () => {
    expect(formatMyPlaceDistance({ placeType: 'SCHOOL', km: 3.2, source: 'straight-line' })).toBe(
      '직선거리 약 3.2km',
    );
  });

  it('labels an estimate with approximate minutes', () => {
    expect(
      formatMyPlaceDistance({ placeType: 'SCHOOL', km: 3.2, source: 'estimate', durationMin: 15 }),
    ).toBe('3.2km · 약 15분');
  });
});

describe('pickPrimaryMyPlaces', () => {
  it('returns the primary WORKPLACE and SCHOOL, ignoring non-primary and OTHER', () => {
    const places = [
      place({ id: 'w1', placeType: 'WORKPLACE', isPrimary: false }),
      place({ id: 'w2', placeType: 'WORKPLACE', isPrimary: true }),
      place({ id: 's1', placeType: 'SCHOOL', isPrimary: true }),
      place({ id: 'o1', placeType: 'OTHER', isPrimary: true }),
    ];
    const { work, school } = pickPrimaryMyPlaces(places);
    expect(work?.id).toBe('w2');
    expect(school?.id).toBe('s1');
  });

  it('returns null for a type with no primary', () => {
    const { work, school } = pickPrimaryMyPlaces([place({ id: 'w1', placeType: 'WORKPLACE', isPrimary: false })]);
    expect(work).toBeNull();
    expect(school).toBeNull();
  });
});

describe('deriveCommuteMode', () => {
  it("is 'none' with no primary work/school", () => {
    expect(deriveCommuteMode([])).toBe('none');
    expect(deriveCommuteMode([place({ id: 'o', placeType: 'OTHER', isPrimary: true })])).toBe('none');
  });

  it("reflects which primary myPlaces exist", () => {
    expect(deriveCommuteMode([place({ id: 'w', placeType: 'WORKPLACE', isPrimary: true })])).toBe('work');
    expect(deriveCommuteMode([place({ id: 's', placeType: 'SCHOOL', isPrimary: true })])).toBe('school');
    expect(
      deriveCommuteMode([
        place({ id: 'w', placeType: 'WORKPLACE', isPrimary: true }),
        place({ id: 's', placeType: 'SCHOOL', isPrimary: true }),
      ]),
    ).toBe('both');
  });
});
