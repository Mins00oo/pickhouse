import { photosRepo } from '../photos.repo';

const mockRunAsync = jest.fn().mockResolvedValue({ changes: 1 });
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

describe('photosRepo', () => {
  it('insert stores upload_status pending by default', async () => {
    await photosRepo.insert({
      id: 'p1',
      houseId: 'h1',
      localUri: 'file:///tmp/p1.jpg',
      uploadStatus: 'pending',
      takenAt: '2026-05-19T00:00:00Z',
      mimeType: 'image/jpeg',
    });
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/INSERT.*INTO photos/);
  });

  it('updateRemoteUrl sets remote_url and upload_status uploaded', async () => {
    await photosRepo.updateRemoteUrl('p1', 'https://r2.example/p1.jpg');
    const sql = mockRunAsync.mock.calls[0]![0];
    expect(sql).toMatch(/remote_url = \?/);
    expect(sql).toMatch(/upload_status = 'uploaded'/);
  });

  it('listPending returns pending uploads only', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    await photosRepo.listPending();
    const sql = mockGetAllAsync.mock.calls[0]![0];
    expect(sql).toMatch(/upload_status = 'pending'/);
  });

  it('attachToHouse links local photos to the server-created house id', async () => {
    await photosRepo.attachToHouse(['p1', 'p2'], 'h1');
    const [sql, houseId, firstPhotoId, secondPhotoId] = mockRunAsync.mock.calls[0]!;
    expect(sql).toMatch(/UPDATE photos SET house_id = \?/);
    expect(sql).toMatch(/WHERE id IN \(\?,\?\)/);
    expect(houseId).toBe('h1');
    expect(firstPhotoId).toBe('p1');
    expect(secondPhotoId).toBe('p2');
  });
});
