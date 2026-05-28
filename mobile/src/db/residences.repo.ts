import { Residence } from '@/types';
import { getDatabase } from './database';

type ResidenceRow = {
  id: string;
  user_id: string;
  address_json: string;
  deal_type: string;
  deposit: number;
  rent: number | null;
  maintenance_fee: number | null;
  area: number | null;
  contract_start_date: string;
  contract_end_date: string;
  landlord_memo: string | null;
  meter_readings_json: string | null;
  is_current: number;
  era_label: string | null;
  memo: string | null;
  water_pressure: number | null;
  sunlight: number | null;
  noise: number | null;
  insulation: number | null;
  ventilation: number | null;
  moisture: number | null;
  neighborhood: number | null;
  first_impression: number | null;
  created_at: string;
  updated_at: string;
};

function rowToResidence(r: ResidenceRow, photoIds: string[]): Residence {
  return {
    id: r.id,
    name: '',
    isFavorite: false,
    address: JSON.parse(r.address_json),
    dealType: r.deal_type as Residence['dealType'],
    deposit: r.deposit,
    rent: r.rent ?? undefined,
    maintenanceFee: r.maintenance_fee ?? undefined,
    area: r.area ?? undefined,
    contractStartDate: r.contract_start_date,
    contractEndDate: r.contract_end_date,
    landlordMemo: r.landlord_memo ?? undefined,
    meterReadings: r.meter_readings_json ? JSON.parse(r.meter_readings_json) : undefined,
    isCurrent: r.is_current === 1,
    eraLabel: r.era_label ?? undefined,
    memo: r.memo ?? undefined,
    waterPressure: r.water_pressure ?? undefined,
    sunlight: r.sunlight ?? undefined,
    noise: r.noise ?? undefined,
    insulation: r.insulation ?? undefined,
    ventilation: r.ventilation ?? undefined,
    moisture: r.moisture ?? undefined,
    neighborhood: r.neighborhood ?? undefined,
    firstImpression: r.first_impression ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    photoIds,
    moveInPhotoIds: [],
  };
}

export const residencesRepo = {
  async insert(r: Residence, userId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO residences (
        id, user_id, address_json, deal_type, deposit, rent,
        maintenance_fee, area, contract_start_date, contract_end_date,
        landlord_memo, meter_readings_json, is_current, era_label, memo,
        water_pressure, sunlight, noise, insulation, ventilation,
        moisture, neighborhood, first_impression,
        created_at, updated_at, is_dirty, is_deleted
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,0)`,
      r.id,
      userId,
      JSON.stringify(r.address),
      r.dealType,
      r.deposit,
      r.rent ?? null,
      r.maintenanceFee ?? null,
      r.area ?? null,
      r.contractStartDate,
      r.contractEndDate,
      r.landlordMemo ?? null,
      r.meterReadings ? JSON.stringify(r.meterReadings) : null,
      r.isCurrent ? 1 : 0,
      r.eraLabel ?? null,
      r.memo ?? null,
      r.waterPressure ?? null,
      r.sunlight ?? null,
      r.noise ?? null,
      r.insulation ?? null,
      r.ventilation ?? null,
      r.moisture ?? null,
      r.neighborhood ?? null,
      r.firstImpression ?? null,
      r.createdAt,
      r.updatedAt,
    );
  },

  async list(userId: string): Promise<Residence[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ResidenceRow>(
      'SELECT * FROM residences WHERE user_id = ? AND is_deleted = 0 ORDER BY contract_start_date DESC',
      userId,
    );
    return (rows ?? []).map((row) => rowToResidence(row, []));
  },

  async findCurrent(userId: string): Promise<Residence | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<ResidenceRow>(
      'SELECT * FROM residences WHERE user_id = ? AND is_current = 1 AND is_deleted = 0 LIMIT 1',
      userId,
    );
    return row ? rowToResidence(row, []) : null;
  },
};
