import { housesRepo } from '../houses.repo';
import { House } from '@/types';

const mockExec: jest.Mock = jest.fn();
const mockRunAsync = jest.fn().mockResolvedValue({ changes: 1 });
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    execAsync: (...a: unknown[]) => mockExec(...a),
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
    getFirstAsync: (...a: unknown[]) => mockGetFirstAsync(...a),
  }),
}));

const sampleHouse: House = {
  id: 'h1',
  address: { roadAddress: '서울시 종로구', jibunAddress: '', zonecode: '03000' },
  dealType: 'WOLSE',
  deposit: 1000,
  rent: 50,
  photoIds: [],
  createdAt: '2026-05-19T00:00:00Z',
  updatedAt: '2026-05-19T00:00:00Z',
};

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
  mockGetFirstAsync.mockClear();
});

describe('housesRepo', () => {
  it('insert serializes address to JSON and persists rating columns', async () => {
    await housesRepo.insert({ ...sampleHouse, sunlight: 4, noise: 3 }, 'u1');
    expect(mockRunAsync).toHaveBeenCalled();
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO houses/);
    expect(sql).toMatch(/sunlight/);
    expect(sql).toMatch(/first_impression/);
  });

  it('listActive filters is_deleted=0 and contracted_at IS NULL', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await housesRepo.listActive('u1');
    const sql = mockGetAllAsync.mock.calls[0]![0];
    expect(sql).toMatch(/is_deleted = 0/);
    expect(sql).toMatch(/contracted_at IS NULL/);
  });

  it('findById parses row back to House (no userId on wire type)', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'h1',
      user_id: 'u1',
      address_json: JSON.stringify(sampleHouse.address),
      deal_type: 'WOLSE',
      deposit: 1000,
      rent: 50,
      sunlight: 4,
      created_at: sampleHouse.createdAt,
      updated_at: sampleHouse.updatedAt,
      photo_ids_json: '[]',
    });
    const result = await housesRepo.findById('h1');
    expect(result?.id).toBe('h1');
    expect(result?.address.roadAddress).toBe('서울시 종로구');
    expect(result?.sunlight).toBe(4);
    expect((result as unknown as { userId?: string }).userId).toBeUndefined();
  });

  it('softDelete sets is_deleted=1 and is_dirty=1', async () => {
    await housesRepo.softDelete('h1');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/is_deleted = 1/);
    expect(sql).toMatch(/is_dirty = 1/);
  });

  it('insert persists wizard columns and serializes json/boolean fields', async () => {
    await housesRepo.insert(
      {
        ...sampleHouse,
        nickname: '청파동 빌라',
        visitedAt: '2026-05-29',
        roomType: 'ONE_AND_HALF',
        floorType: 'GROUND',
        direction: 'SOUTH',
        maintenanceIncludes: ['WATER', 'INTERNET'],
        utilityEstimates: { ELECTRIC: 4, GAS: 3 },
        fullOption: true,
      },
      'u1',
    );
    const [sql, ...args] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/nickname/);
    expect(sql).toMatch(/room_type/);
    expect(sql).toMatch(/floor_type/);
    expect(sql).toMatch(/maintenance_includes_json/);
    expect(sql).toMatch(/utility_estimates_json/);
    expect(sql).toMatch(/full_option/);
    expect(args).toContain('청파동 빌라');
    expect(args).toContain(JSON.stringify(['WATER', 'INTERNET']));
    expect(args).toContain(JSON.stringify({ ELECTRIC: 4, GAS: 3 }));
    expect(args).toContain(1); // fullOption true -> 1
  });

  it('insert stores empty utilityEstimates as null (not "{}")', async () => {
    await housesRepo.insert({ ...sampleHouse, utilityEstimates: {} }, 'u1');
    const [, ...args] = mockRunAsync.mock.calls[0]!;
    expect(args).not.toContain('{}');
  });

  it('findById maps wizard columns back to House', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'h1',
      user_id: 'u1',
      address_json: JSON.stringify(sampleHouse.address),
      deal_type: 'WOLSE',
      deposit: 1000,
      rent: 50,
      nickname: '청파동 빌라',
      visited_at: '2026-05-29',
      room_type: 'TWO_ROOM',
      floor_type: 'SEMI_BASEMENT',
      direction: 'NORTH',
      maintenance_includes_json: JSON.stringify(['WATER', 'GAS']),
      utility_estimates_json: JSON.stringify({ ELECTRIC: 5 }),
      full_option: 1,
      created_at: sampleHouse.createdAt,
      updated_at: sampleHouse.updatedAt,
    });
    const r = await housesRepo.findById('h1');
    expect(r?.nickname).toBe('청파동 빌라');
    expect(r?.visitedAt).toBe('2026-05-29');
    expect(r?.roomType).toBe('TWO_ROOM');
    expect(r?.floorType).toBe('SEMI_BASEMENT');
    expect(r?.direction).toBe('NORTH');
    expect(r?.maintenanceIncludes).toEqual(['WATER', 'GAS']);
    expect(r?.utilityEstimates).toEqual({ ELECTRIC: 5 });
    expect(r?.fullOption).toBe(true);
  });

  it('findById leaves wizard fields undefined when columns are null', async () => {
    mockGetFirstAsync.mockResolvedValueOnce({
      id: 'h1',
      user_id: 'u1',
      address_json: JSON.stringify(sampleHouse.address),
      deal_type: 'WOLSE',
      deposit: 1000,
      rent: 50,
      nickname: null,
      visited_at: null,
      room_type: null,
      floor_type: null,
      direction: null,
      maintenance_includes_json: null,
      utility_estimates_json: null,
      full_option: null,
      created_at: sampleHouse.createdAt,
      updated_at: sampleHouse.updatedAt,
    });
    const r = await housesRepo.findById('h1');
    expect(r?.nickname).toBeUndefined();
    expect(r?.maintenanceIncludes).toBeUndefined();
    expect(r?.utilityEstimates).toBeUndefined();
    expect(r?.fullOption).toBeUndefined();
  });
});
