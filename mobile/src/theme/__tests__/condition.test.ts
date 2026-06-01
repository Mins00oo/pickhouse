import { colors, conditionColor, conditionLabel } from '@/theme';

describe('conditionColor', () => {
  it('maps levels 3/2/1 to good/mid/bad tokens', () => {
    expect(conditionColor(3)).toBe(colors.condGood);
    expect(conditionColor(2)).toBe(colors.condMid);
    expect(conditionColor(1)).toBe(colors.condBad);
  });

  it('falls back to inkMuted when undefined', () => {
    expect(conditionColor(undefined)).toBe(colors.inkMuted);
  });
});

describe('conditionLabel', () => {
  it('maps levels to Korean labels', () => {
    expect(conditionLabel(3)).toBe('좋음');
    expect(conditionLabel(2)).toBe('보통');
    expect(conditionLabel(1)).toBe('나쁨');
  });

  it('returns empty string when undefined', () => {
    expect(conditionLabel(undefined)).toBe('');
  });
});
