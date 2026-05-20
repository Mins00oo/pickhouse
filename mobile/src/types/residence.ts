import { House } from './house';

export interface Residence extends Omit<House, 'contractedAt'> {
  name: string;
  sourceHouseId?: string;
  isFavorite: boolean;
  contractStartDate: string;
  contractEndDate: string;
  landlordMemo?: string;
  moveInPhotoIds: string[];
  contractPhotoId?: string;
  meterReadings?: {
    electricity?: number;
    water?: number;
    gas?: number;
    recordedAt?: string;
  };
  isCurrent: boolean;
  eraLabel?: string;
}
