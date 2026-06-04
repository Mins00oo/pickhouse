import { Photo, UploadStatus } from '@/types';
import { getDatabase } from './database';

type PhotoRow = {
  id: string;
  house_id: string | null;
  residence_id: string | null;
  local_uri: string | null;
  remote_url: string | null;
  upload_status: UploadStatus;
  taken_at: string;
  width: number | null;
  height: number | null;
  mime_type: string;
};

function rowToPhoto(r: PhotoRow): Photo {
  return {
    id: r.id,
    houseId: r.house_id ?? undefined,
    residenceId: r.residence_id ?? undefined,
    localUri: r.local_uri ?? undefined,
    remoteUrl: r.remote_url ?? undefined,
    uploadStatus: r.upload_status,
    takenAt: r.taken_at,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    mimeType: r.mime_type,
  };
}

export const photosRepo = {
  async insert(p: Photo): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO photos (
        id, house_id, residence_id, local_uri, remote_url,
        upload_status, taken_at, width, height, mime_type,
        is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,1,0)`,
      p.id,
      p.houseId ?? null,
      p.residenceId ?? null,
      p.localUri ?? null,
      p.remoteUrl ?? null,
      p.uploadStatus,
      p.takenAt ?? null,
      p.width ?? null,
      p.height ?? null,
      p.mimeType,
    );
  },

  async updateRemoteUrl(id: string, remoteUrl: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET remote_url = ?, upload_status = 'uploaded', is_dirty = 1 WHERE id = ?",
      remoteUrl,
      id,
    );
  },

  async attachToHouse(photoIds: string[], houseId: string): Promise<void> {
    if (photoIds.length === 0) return;
    const db = await getDatabase();
    const placeholders = photoIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE photos SET house_id = ?, is_dirty = 1 WHERE id IN (${placeholders})`,
      houseId,
      ...photoIds,
    );
  },

  async markUploading(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET upload_status = 'uploading' WHERE id = ?",
      id,
    );
  },

  async markFailed(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE photos SET upload_status = 'failed' WHERE id = ?",
      id,
    );
  },

  async listPending(): Promise<Photo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>(
      "SELECT * FROM photos WHERE upload_status = 'pending' AND is_deleted = 0 ORDER BY taken_at ASC",
    );
    return rows.map(rowToPhoto);
  },

  async listForHouse(houseId: string): Promise<Photo[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PhotoRow>(
      'SELECT * FROM photos WHERE house_id = ? AND is_deleted = 0 ORDER BY taken_at ASC',
      houseId,
    );
    return rows.map(rowToPhoto);
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE photos SET is_deleted = 1, is_dirty = 1 WHERE id = ?',
      id,
    );
  },
};
