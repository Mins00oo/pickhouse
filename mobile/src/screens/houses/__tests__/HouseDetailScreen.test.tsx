import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseDetailScreen } from '../HouseDetailScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/photos.repo');

const wrap = (c: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>{c}</NavigationContainer>
    </QueryClientProvider>
  );
};

describe('HouseDetailScreen', () => {
  it('shows house address and memo', async () => {
    const house = {
      id: 'h1',
      address: { roadAddress: '서울시 마포구 1', jibunAddress: '', zonecode: '04000' },
      dealType: 'WOLSE', deposit: 1000, rent: 50, memo: '햇빛 잘 듦',
      photoIds: [], createdAt: '2026', updatedAt: '2026',
    };
    (housesRepo.findById as jest.Mock).mockResolvedValue(house);
    (housesApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { findByText } = render(
      wrap(<HouseDetailScreen navigation={nav} route={{ params: { houseId: 'h1' }, key: 'k', name: 'HouseDetail' } as any} />),
    );
    await waitFor(async () => {
      expect(await findByText(/마포구/)).toBeTruthy();
      expect(await findByText(/햇빛 잘 듦/)).toBeTruthy();
    });
  });
});
