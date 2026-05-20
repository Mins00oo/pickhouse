import { syncQueueRepo, SyncOp } from '../syncQueue.repo';

const mockRunAsync = jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
const mockGetAllAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    runAsync: (...a: unknown[]) => mockRunAsync(...a),
    getAllAsync: (...a: unknown[]) => mockGetAllAsync(...a),
  }),
}));

beforeEach(() => {
  mockRunAsync.mockClear();
  mockGetAllAsync.mockClear();
});

describe('syncQueueRepo', () => {
  it('enqueue inserts op_type, entity, entity_id, payload', async () => {
    const op: SyncOp = {
      opType: 'create',
      entity: 'house',
      entityId: 'h1',
      payload: { id: 'h1' },
    };
    await syncQueueRepo.enqueue(op);
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO sync_queue/);
    const args = mockRunAsync.mock.calls[0]!.slice(1);
    expect(args).toContain('create');
    expect(args).toContain('house');
    expect(args).toContain('h1');
  });

  it('list returns rows ordered by id', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        op_type: 'create',
        entity: 'house',
        entity_id: 'h1',
        payload_json: '{}',
        attempts: 0,
        last_error: null,
        created_at: '2026-05-19T00:00:00Z',
        updated_at: '2026-05-19T00:00:00Z',
      },
    ]);
    const items = await syncQueueRepo.list();
    expect(items).toHaveLength(1);
    expect(items[0]!.opType).toBe('create');
  });

  it('incrementAttempts updates attempts and last_error', async () => {
    await syncQueueRepo.incrementAttempts(1, 'network error');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/attempts = attempts \+ 1/);
    expect(sql).toMatch(/last_error = \?/);
  });
});
