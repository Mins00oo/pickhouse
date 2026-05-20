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
});
