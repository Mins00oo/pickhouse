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
  transport: 'CAR',
  isPrimary: true,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
  mockGetFirstAsync.mockClear();
});

describe('anchorPlacesRepo', () => {
  it('upsert uses ON CONFLICT(id) so the same row id updates (add + edit), persisting transport + is_primary', async () => {
    await anchorPlacesRepo.upsert(sample, 'u1');
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/INSERT INTO anchor_places/);
    expect(sql).toMatch(/ON CONFLICT\(id\) DO UPDATE/);
    expect(args).toContain('u1');
    expect(args).toContain('WORKPLACE');
    expect(args).toContain('연세대학교');
    expect(args).toContain('CAR'); // transport
    expect(args).toContain(1); // is_primary true → 1
    expect(args).toContain(JSON.stringify(sample.address));
    expect(args).toContain(37.5658); // denormalized latitude
  });

  it('upsert writes is_primary 0 when not primary', async () => {
    await anchorPlacesRepo.upsert({ ...sample, isPrimary: false }, 'u1');
    const [, ...args] = mockRunAsync.mock.calls[0]!;
    expect(args).toContain(0);
  });

  it('clearPrimaryExcept un-marks other primaries of the same type', async () => {
    await anchorPlacesRepo.clearPrimaryExcept('u1', 'WORKPLACE', 'a1');
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/UPDATE anchor_places SET is_primary\s*=\s*0/);
    expect(sql).toMatch(/anchor_type\s*=\s*\?/);
    expect(sql).toMatch(/id\s*<>\s*\?/);
    expect(args).toEqual(['u1', 'WORKPLACE', 'a1']);
  });

  it('softDelete marks a single place is_deleted and is_dirty by id', async () => {
    await anchorPlacesRepo.softDelete('a1');
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/UPDATE anchor_places SET is_deleted = 1, is_dirty = 1/);
    expect(args[args.length - 1]).toBe('a1');
  });

  it('listActive filters out soft-deleted rows', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await anchorPlacesRepo.listActive('u1');
    const [sql] = mockGetAllAsync.mock.calls[0]!;
    expect(sql).toMatch(/is_deleted = 0/);
  });

  it('listActive scopes by user, orders by created_at, and maps transport/isPrimary (stripping user_id)', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 'a1',
        user_id: 'u1',
        anchor_type: 'WORKPLACE',
        label: '판교 회사',
        address_json: JSON.stringify(sample.address),
        latitude: 37.5658,
        longitude: 126.9387,
        transport: 'TRANSIT',
        is_primary: 1,
        created_at: sample.createdAt,
        updated_at: sample.updatedAt,
      },
      {
        id: 'a2',
        user_id: 'u1',
        anchor_type: 'OTHER',
        label: null,
        address_json: JSON.stringify(sample.address),
        latitude: 37.5,
        longitude: 127.0,
        transport: null, // 기존 행 호환 → 기본 CAR
        is_primary: 0,
        created_at: sample.createdAt,
        updated_at: sample.updatedAt,
      },
    ]);
    const result = await anchorPlacesRepo.listActive('u1');
    const [sql, ...args] = mockGetAllAsync.mock.calls[0]!;
    expect(sql).toMatch(/WHERE user_id = \?/);
    expect(sql).toMatch(/ORDER BY created_at/);
    expect(args).toEqual(['u1']);

    expect(result[0]).toMatchObject({ id: 'a1', anchorType: 'WORKPLACE', transport: 'TRANSIT', isPrimary: true });
    expect(result[1]).toMatchObject({ id: 'a2', anchorType: 'OTHER', transport: 'CAR', isPrimary: false });
    expect((result[0] as unknown as { user_id?: string }).user_id).toBeUndefined();
  });
});
