import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HouseDetailScreen } from '../HouseDetailScreen';
import { housesRepo } from '@/db/houses.repo';
import { housesApi } from '@/api/houses.api';

jest.mock('@/db/houses.repo');
jest.mock('@/api/houses.api');
jest.mock('@/db/photos.repo');

let queryClient: QueryClient | null = null;

const wrap = (c: React.ReactNode) => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return (
    <QueryClientProvider client={queryClient}>
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
    expect(await findByText(/마포구/, {}, { timeout: 10000 })).toBeTruthy();
    expect(await findByText(/햇빛 잘 듦/)).toBeTruthy();
  });

  it('shows nickname heading, structure pills, and 3-level condition labels', async () => {
    const house = {
      id: 'h2',
      address: {
        roadAddress: '서울 용산구 청파로47길 22',
        jibunAddress: '청파동1가 56-3',
        zonecode: '04303',
        detail: '302호',
      },
      dealType: 'WOLSE',
      deposit: 1000,
      rent: 50,
      nickname: '청파동 빌라',
      roomType: 'ONE_AND_HALF',
      floorType: 'GROUND',
      floor: 3,
      totalFloor: 5,
      direction: 'SOUTH',
      sunlight: 3,
      waterPressure: 2,
      moisture: 1,
      photoIds: [],
      createdAt: '2026',
      updatedAt: '2026',
    };
    (housesRepo.findById as jest.Mock).mockResolvedValue(house);
    (housesApi.get as jest.Mock).mockRejectedValue(new Error('offline'));

    const nav = { goBack: jest.fn(), navigate: jest.fn() } as any;
    const { findByText, getByText } = render(
      wrap(
        <HouseDetailScreen
          navigation={nav}
          route={{ params: { houseId: 'h2' }, key: 'k', name: 'HouseDetail' } as any}
        />,
      ),
    );

    expect(await findByText('청파동 빌라', {}, { timeout: 10000 })).toBeTruthy(); // nickname heading
    expect(getByText('컨디션')).toBeTruthy();
    expect(getByText('1.5룸')).toBeTruthy();
    expect(getByText('3/5층')).toBeTruthy();
    expect(getByText('남향')).toBeTruthy();
    expect(getByText('좋음')).toBeTruthy(); // sunlight=3
    expect(getByText('나쁨')).toBeTruthy(); // moisture=1
  });
});

afterEach(() => {
  queryClient?.clear();
  queryClient = null;
});
