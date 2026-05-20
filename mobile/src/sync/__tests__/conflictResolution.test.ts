import { lastWriteWins } from '../conflictResolution';

describe('lastWriteWins', () => {
  it('returns local when local.updatedAt > remote.updatedAt', () => {
    const local = { id: 'h1', updatedAt: '2026-05-19T10:00:00Z' } as any;
    const remote = { id: 'h1', updatedAt: '2026-05-19T09:00:00Z' } as any;
    expect(lastWriteWins(local, remote)).toBe(local);
  });

  it('returns remote when remote.updatedAt >= local.updatedAt', () => {
    const local = { id: 'h1', updatedAt: '2026-05-19T08:00:00Z' } as any;
    const remote = { id: 'h1', updatedAt: '2026-05-19T09:00:00Z' } as any;
    expect(lastWriteWins(local, remote)).toBe(remote);
  });

  it('returns local when no remote', () => {
    expect(lastWriteWins({ id: 'h1', updatedAt: 'x' } as any, null)).toEqual({
      id: 'h1', updatedAt: 'x',
    });
  });
});
