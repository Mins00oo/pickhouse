import { House } from './house';

export interface Residence extends Omit<House, 'contractedAt'> {
  contractStartDate: string;
  contractEndDate: string;
  landlordMemo?: string;
  moveInPhotoIds: string[];
  contractPhotoId?: string;
  meterReadings?: {
    electricity?: number;
    water?: number;
    gas?: number;
  };
  isCurrent: boolean;
  eraLabel?: string;
}
