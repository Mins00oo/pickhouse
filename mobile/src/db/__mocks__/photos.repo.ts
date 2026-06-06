export const photosRepo = {
  insert: jest.fn().mockResolvedValue(undefined),
  updateRemoteUrl: jest.fn().mockResolvedValue(undefined),
  markUploading: jest.fn().mockResolvedValue(undefined),
  markFailed: jest.fn().mockResolvedValue(undefined),
  listPending: jest.fn().mockResolvedValue([]),
  listForHouse: jest.fn().mockResolvedValue([]),
  attachToHouse: jest.fn().mockResolvedValue(undefined),
  softDelete: jest.fn().mockResolvedValue(undefined),
};
