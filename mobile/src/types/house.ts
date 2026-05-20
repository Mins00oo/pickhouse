export type DealType = 'JEONSE' | 'WOLSE' | 'BAN_JEONSE';

export interface Address {
  roadAddress: string;
  jibunAddress: string;
  zonecode: string;
  latitude?: number;
  longitude?: number;
  detail?: string;
}

export const RATING_KEYS = [
  'waterPressure',
  'sunlight',
  'noise',
  'insulation',
  'ventilation',
  'moisture',
  'neighborhood',
  'firstImpression',
] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

export interface House {
  id: string;
  address: Address;
  dealType: DealType;
  deposit: number;
  rent?: number;
  maintenanceFee?: number;
  area?: number;
  builtYear?: number;
  floor?: number;
  totalFloor?: number;
  availableFrom?: string;
  stationDistance?: number;
  rooms?: number;
  bathrooms?: number;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasParking?: boolean;
  options?: string[];
  security?: string[];
  garbage?: string;
  waterPressure?: number;
  sunlight?: number;
  noise?: number;
  insulation?: number;
  ventilation?: number;
  moisture?: number;
  neighborhood?: number;
  firstImpression?: number;
  memo?: string;
  photoIds: string[];
  contractedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type HouseDraft = Omit<House, 'id' | 'photoIds' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  photoIds?: string[];
};
