export interface Timestamped {
  updatedAt: string;
}

export function lastWriteWins<T extends Timestamped>(local: T, remote: T | null): T {
  if (!remote) return local;
  return new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()
    ? local
    : remote;
}
