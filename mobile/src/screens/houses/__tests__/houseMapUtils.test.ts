import {
  deriveCommuteMode,
  formatAnchorDistance,
  formatKm,
  getAnchorCoordinate,
  haversineKm,
  pickPrimaryAnchors,
} from '../houseMapUtils';
import { AnchorPlace, AnchorType } from '@/types';

const baseAddress = { roadAddress: '주소', jibunAddress: '', zonecode: '' };

function anchor(latitude?: number, longitude?: number): AnchorPlace {
  return {
    id: 'a1',
    anchorType: 'WORKPLACE',
    address: { ...baseAddress, latitude, longitude },
    transport: 'CAR',
    isPrimary: false,
    createdAt: '2026',
    updatedAt: '2026',
  };
}

function place(over: Partial<AnchorPlace> & { id: string; anchorType: AnchorType }): AnchorPlace {
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

describe('getAnchorCoordinate', () => {
  it('returns the coordinate when lat/lng are present', () => {
    expect(getAnchorCoordinate(anchor(37.5, 127.0))).toEqual({ latitude: 37.5, longitude: 127.0 });
  });

  it('returns null when coordinates are missing', () => {
    expect(getAnchorCoordinate(anchor(undefined, undefined))).toBeNull();
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

describe('formatAnchorDistance', () => {
  it('shows distance + driving minutes for a driving source', () => {
    expect(
      formatAnchorDistance({ anchorType: 'WORKPLACE', km: 3.2, source: 'driving', durationMin: 12 }),
    ).toBe('3.2km · 차 12분');
  });

  it('labels straight-line fallback honestly', () => {
    expect(formatAnchorDistance({ anchorType: 'SCHOOL', km: 3.2, source: 'straight-line' })).toBe(
      '직선거리 약 3.2km',
    );
  });

  it('labels an estimate with approximate minutes', () => {
    expect(
      formatAnchorDistance({ anchorType: 'SCHOOL', km: 3.2, source: 'estimate', durationMin: 15 }),
    ).toBe('3.2km · 약 15분');
  });
});

describe('pickPrimaryAnchors', () => {
  it('returns the primary WORKPLACE and SCHOOL, ignoring non-primary and OTHER', () => {
    const places = [
      place({ id: 'w1', anchorType: 'WORKPLACE', isPrimary: false }),
      place({ id: 'w2', anchorType: 'WORKPLACE', isPrimary: true }),
      place({ id: 's1', anchorType: 'SCHOOL', isPrimary: true }),
      place({ id: 'o1', anchorType: 'OTHER', isPrimary: true }),
    ];
    const { work, school } = pickPrimaryAnchors(places);
    expect(work?.id).toBe('w2');
    expect(school?.id).toBe('s1');
  });

  it('returns null for a type with no primary', () => {
    const { work, school } = pickPrimaryAnchors([place({ id: 'w1', anchorType: 'WORKPLACE', isPrimary: false })]);
    expect(work).toBeNull();
    expect(school).toBeNull();
  });
});

describe('deriveCommuteMode', () => {
  it("is 'none' with no primary work/school", () => {
    expect(deriveCommuteMode([])).toBe('none');
    expect(deriveCommuteMode([place({ id: 'o', anchorType: 'OTHER', isPrimary: true })])).toBe('none');
  });

  it("reflects which primary anchors exist", () => {
    expect(deriveCommuteMode([place({ id: 'w', anchorType: 'WORKPLACE', isPrimary: true })])).toBe('work');
    expect(deriveCommuteMode([place({ id: 's', anchorType: 'SCHOOL', isPrimary: true })])).toBe('school');
    expect(
      deriveCommuteMode([
        place({ id: 'w', anchorType: 'WORKPLACE', isPrimary: true }),
        place({ id: 's', anchorType: 'SCHOOL', isPrimary: true }),
      ]),
    ).toBe('both');
  });
});
