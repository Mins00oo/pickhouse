import {
  formatAnchorDistance,
  formatKm,
  getAnchorCoordinate,
  haversineKm,
} from '../houseMapUtils';
import { AnchorPlace } from '@/types';

const baseAddress = { roadAddress: '주소', jibunAddress: '', zonecode: '' };

function anchor(latitude?: number, longitude?: number): AnchorPlace {
  return {
    id: 'a1',
    anchorType: 'WORKPLACE',
    address: { ...baseAddress, latitude, longitude },
    createdAt: '2026',
    updatedAt: '2026',
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
});
