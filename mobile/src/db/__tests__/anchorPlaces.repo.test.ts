import { anchorPlacesRepo } from '../anchorPlaces.repo';
import { AnchorPlace } from '@/types';

const mockRunAsync = jest.fn().mockResolvedValue({ changes: 1 });
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
    getFirstAsync: (...a: unknown[]) => mockGetFirstAsync(...a),
  }),
}));

const sample: AnchorPlace = {
  id: 'a1',
  anchorType: 'WORKPLACE',
  label: '연세대학교',
  address: { roadAddress: '서울 서대문구 연세로 50', jibunAddress: '신촌동 134', zonecode: '', latitude: 37.5658, longitude: 126.9387 },
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
  mockGetFirstAsync.mockClear();
});

describe('anchorPlacesRepo', () => {
  it('upsert uses ON CONFLICT(user_id, anchor_type) to enforce one-per-type', async () => {
    await anchorPlacesRepo.upsert(sample, 'u1');
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/INSERT INTO anchor_places/);
    expect(sql).toMatch(/ON CONFLICT\(user_id, anchor_type\) DO UPDATE/);
    expect(args).toContain('u1');
    expect(args).toContain('WORKPLACE');
    expect(args).toContain('연세대학교');
    expect(args).toContain(JSON.stringify(sample.address));
    expect(args).toContain(37.5658); // denormalized latitude
  });

  it('getByType filters by user and type', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'a1',
      user_id: 'u1',
      anchor_type: 'WORKPLACE',
      label: '연세대학교',
      address_json: JSON.stringify(sample.address),
      latitude: 37.5658,
      longitude: 126.9387,
      created_at: sample.createdAt,
      updated_at: sample.updatedAt,
    });
    const result = await anchorPlacesRepo.getByType('u1', 'WORKPLACE');
    const [sql, ...args] = mockGetFirstAsync.mock.calls[0]!;
    expect(sql).toMatch(/anchor_type = \?/);
    expect(args).toEqual(['u1', 'WORKPLACE']);
    expect(result?.label).toBe('연세대학교');
    expect(result?.address.latitude).toBe(37.5658);
    expect((result as unknown as { user_id?: string }).user_id).toBeUndefined();
  });

  it('getByType returns null when no row', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(undefined);
    expect(await anchorPlacesRepo.getByType('u1', 'SCHOOL')).toBeNull();
  });

  it('clear hard-deletes the slot for the user/type', async () => {
    await anchorPlacesRepo.clear('u1', 'SCHOOL');
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/DELETE FROM anchor_places/);
    expect(args).toEqual(['u1', 'SCHOOL']);
  });

  it('listActive scopes by user', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await anchorPlacesRepo.listActive('u1');
    const [sql, ...args] = mockGetAllAsync.mock.calls[0]!;
    expect(sql).toMatch(/WHERE user_id = \?/);
    expect(args).toEqual(['u1']);
  });
});
