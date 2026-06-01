import { House } from '@/types';
import { getDatabase } from './database';

// SQLite row shape — keeps `user_id` column for offline scoping; the wire/UI
// `House` type omits `userId` (it is derived from JWT on the server).
type HouseRow = {
  id: string;
  user_id: string;
  address_json: string;
  deal_type: string;
  deposit: number;
  rent: number | null;
  maintenance_fee: number | null;
  area: number | null;
  built_year: number | null;
  floor: number | null;
  total_floor: number | null;
  available_from: string | null;
  station_distance: number | null;
  rooms: number | null;
  bathrooms: number | null;
  has_balcony: number | null;
  has_elevator: number | null;
  has_parking: number | null;
  options_json: string | null;
  security_json: string | null;
  garbage: string | null;
  water_pressure: number | null;
  sunlight: number | null;
  noise: number | null;
  insulation: number | null;
  ventilation: number | null;
  moisture: number | null;
  neighborhood: number | null;
  first_impression: number | null;
  memo: string | null;
  nickname: string | null;
  visited_at: string | null;
  room_type: string | null;
  floor_type: string | null;
  direction: string | null;
  maintenance_includes_json: string | null;
  utility_estimates_json: string | null;
  full_option: number | null;
  contracted_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToHouse(r: HouseRow, photoIds: string[]): House {
  return {
    id: r.id,
    address: JSON.parse(r.address_json),
    dealType: r.deal_type as House['dealType'],
    deposit: r.deposit,
    rent: r.rent ?? undefined,
    maintenanceFee: r.maintenance_fee ?? undefined,
    area: r.area ?? undefined,
    builtYear: r.built_year ?? undefined,
    floor: r.floor ?? undefined,
    totalFloor: r.total_floor ?? undefined,
    availableFrom: r.available_from ?? undefined,
    stationDistance: r.station_distance ?? undefined,
    rooms: r.rooms ?? undefined,
    bathrooms: r.bathrooms ?? undefined,
    hasBalcony: r.has_balcony === null ? undefined : r.has_balcony === 1,
    hasElevator: r.has_elevator === null ? undefined : r.has_elevator === 1,
    hasParking: r.has_parking === null ? undefined : r.has_parking === 1,
    options: r.options_json ? JSON.parse(r.options_json) : undefined,
    security: r.security_json ? JSON.parse(r.security_json) : undefined,
    garbage: r.garbage ?? undefined,
    waterPressure: r.water_pressure ?? undefined,
    sunlight: r.sunlight ?? undefined,
    noise: r.noise ?? undefined,
    insulation: r.insulation ?? undefined,
    ventilation: r.ventilation ?? undefined,
    moisture: r.moisture ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    firstImpression: r.first_impression ?? undefined,
    memo: r.memo ?? undefined,
    nickname: r.nickname ?? undefined,
    visitedAt: r.visited_at ?? undefined,
    roomType: (r.room_type ?? undefined) as House['roomType'],
    floorType: (r.floor_type ?? undefined) as House['floorType'],
    direction: (r.direction ?? undefined) as House['direction'],
    maintenanceIncludes: r.maintenance_includes_json
      ? (JSON.parse(r.maintenance_includes_json) as House['maintenanceIncludes'])
      : undefined,
    utilityEstimates: r.utility_estimates_json
      ? (JSON.parse(r.utility_estimates_json) as House['utilityEstimates'])
      : undefined,
    fullOption: r.full_option === null ? undefined : r.full_option === 1,
    contractedAt: r.contracted_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    photoIds,
  };
}

async function getPhotoIdsForHouse(houseId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM photos WHERE house_id = ? AND is_deleted = 0 ORDER BY taken_at ASC',
    houseId,
  );
  return (rows ?? []).map((r) => r.id);
}

export const housesRepo = {
  async insert(h: House, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO houses (
        id, user_id, address_json, deal_type, deposit, rent,
        maintenance_fee, area, built_year, floor, total_floor,
        available_from, station_distance, rooms, bathrooms,
        has_balcony, has_elevator, has_parking, options_json,
        security_json, garbage,
        water_pressure, sunlight, noise, insulation, ventilation,
        moisture, neighborhood, first_impression,
        memo, nickname, visited_at, room_type, floor_type, direction,
        maintenance_includes_json, utility_estimates_json, full_option,
        contracted_at, created_at, updated_at, is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
      h.id,
      userId,
      JSON.stringify(h.address),
      h.dealType,
      h.deposit,
      h.rent ?? null,
      h.maintenanceFee ?? null,
      h.area ?? null,
      h.builtYear ?? null,
      h.floor ?? null,
      h.totalFloor ?? null,
      h.availableFrom ?? null,
      h.stationDistance ?? null,
      h.rooms ?? null,
      h.bathrooms ?? null,
      h.hasBalcony == null ? null : h.hasBalcony ? 1 : 0,
      h.hasElevator == null ? null : h.hasElevator ? 1 : 0,
      h.hasParking == null ? null : h.hasParking ? 1 : 0,
      h.options ? JSON.stringify(h.options) : null,
      h.security ? JSON.stringify(h.security) : null,
      h.garbage ?? null,
      h.waterPressure ?? null,
      h.sunlight ?? null,
      h.noise ?? null,
      h.insulation ?? null,
      h.ventilation ?? null,
      h.moisture ?? null,
      h.neighborhood ?? null,
      h.firstImpression ?? null,
      h.memo ?? null,
      h.nickname ?? null,
      h.visitedAt ?? null,
      h.roomType ?? null,
      h.floorType ?? null,
      h.direction ?? null,
      h.maintenanceIncludes ? JSON.stringify(h.maintenanceIncludes) : null,
      h.utilityEstimates && Object.keys(h.utilityEstimates).length > 0
        ? JSON.stringify(h.utilityEstimates)
        : null,
      h.fullOption == null ? null : h.fullOption ? 1 : 0,
      h.contractedAt ?? null,
      h.createdAt,
      h.updatedAt,
    );
  },

  async update(h: House): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE houses SET
        address_json=?, deal_type=?, deposit=?, rent=?, maintenance_fee=?,
        area=?, built_year=?, floor=?, total_floor=?, available_from=?,
        station_distance=?, rooms=?, bathrooms=?, has_balcony=?, has_elevator=?,
        has_parking=?, options_json=?, security_json=?, garbage=?,
        water_pressure=?, sunlight=?, noise=?, insulation=?, ventilation=?,
        moisture=?, neighborhood=?, first_impression=?,
        memo=?, nickname=?, visited_at=?, room_type=?, floor_type=?, direction=?,
        maintenance_includes_json=?, utility_estimates_json=?, full_option=?,
        contracted_at=?, updated_at=?, is_dirty=1
      WHERE id = ?`,
      JSON.stringify(h.address),
      h.dealType,
      h.deposit,
      h.rent ?? null,
      h.maintenanceFee ?? null,
      h.area ?? null,
      h.builtYear ?? null,
      h.floor ?? null,
      h.totalFloor ?? null,
      h.availableFrom ?? null,
      h.stationDistance ?? null,
      h.rooms ?? null,
      h.bathrooms ?? null,
      h.hasBalcony == null ? null : h.hasBalcony ? 1 : 0,
      h.hasElevator == null ? null : h.hasElevator ? 1 : 0,
      h.hasParking == null ? null : h.hasParking ? 1 : 0,
      h.options ? JSON.stringify(h.options) : null,
      h.security ? JSON.stringify(h.security) : null,
      h.garbage ?? null,
      h.waterPressure ?? null,
      h.sunlight ?? null,
      h.noise ?? null,
      h.insulation ?? null,
      h.ventilation ?? null,
      h.moisture ?? null,
      h.neighborhood ?? null,
      h.firstImpression ?? null,
      h.memo ?? null,
      h.nickname ?? null,
      h.visitedAt ?? null,
      h.roomType ?? null,
      h.floorType ?? null,
      h.direction ?? null,
      h.maintenanceIncludes ? JSON.stringify(h.maintenanceIncludes) : null,
      h.utilityEstimates && Object.keys(h.utilityEstimates).length > 0
        ? JSON.stringify(h.utilityEstimates)
        : null,
      h.fullOption == null ? null : h.fullOption ? 1 : 0,
      h.contractedAt ?? null,
      h.updatedAt,
      h.id,
    );
  },

  async findById(id: string): Promise<House | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<HouseRow>(
      'SELECT * FROM houses WHERE id = ? AND is_deleted = 0',
      id,
    );
    if (!row) return null;
    const photoIds = await getPhotoIdsForHouse(id);
    return rowToHouse(row, photoIds);
  },

  async listActive(userId: string): Promise<House[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HouseRow>(
      'SELECT * FROM houses WHERE user_id = ? AND is_deleted = 0 AND contracted_at IS NULL ORDER BY created_at DESC',
      userId,
    );
    const result: House[] = [];
    for (const r of rows) {
      const photoIds = await getPhotoIdsForHouse(r.id);
      result.push(rowToHouse(r, photoIds));
    }
    return result;
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE houses SET is_deleted = 1, is_dirty = 1, updated_at = ? WHERE id = ?',
      new Date().toISOString(),
      id,
    );
  },

  async markClean(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE houses SET is_dirty = 0 WHERE id = ?', id);
  },

  async listDirty(): Promise<House[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HouseRow>(
      'SELECT * FROM houses WHERE is_dirty = 1',
    );
    const result: House[] = [];
    for (const r of rows) {
      const photoIds = await getPhotoIdsForHouse(r.id);
      result.push(rowToHouse(r, photoIds));
    }
    return result;
  },
};
